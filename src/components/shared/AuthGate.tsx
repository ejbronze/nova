"use client";

import { useState, useEffect, useRef, useCallback, type CSSProperties } from "react";
import Image from "next/image";
import { createDemoSnapshot, exportAllData, importAllData } from "@/lib/db";

const SESSION_KEY = "nova_session";
export const DEMO_SESSION_VALUE = "demo";
const DEMO_BACKUP_KEY = "nova_demo_backup";
const DEMO_SNAPSHOT_KEY = "nova_demo_snapshot";
const EXPECTED = btoa("Britney10!");

const IDLE_WARN_MS = 4 * 60 * 1000;
const IDLE_LOCK_MS = 5 * 60 * 1000;
const WARN_COUNTDOWN = 60;
const INTRO_DURATION_MS = 2400;

type Stage = "checking" | "intro" | "login" | "unlocking" | "done";

export function isDemoSession() {
  return typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) === DEMO_SESSION_VALUE;
}

export async function signOut() {
  if (typeof window === "undefined") return;

  const isDemo = sessionStorage.getItem(SESSION_KEY) === DEMO_SESSION_VALUE;
  if (isDemo) {
    const backup = sessionStorage.getItem(DEMO_BACKUP_KEY);
    if (backup) {
      await importAllData(backup);
    }
    sessionStorage.removeItem(DEMO_BACKUP_KEY);
    sessionStorage.removeItem(DEMO_SNAPSHOT_KEY);
  }

  sessionStorage.removeItem(SESSION_KEY);
  window.location.reload();
}

function IntroAnimation() {
  const nodes = [
    {
      color: "#4F7CFF",
      delay: "0.05s",
      startX: "-38vw",
      startY: "-24vh",
      targetX: "0px",
      targetY: "-44px",
      glow: "rgba(79,124,255,0.45)",
    },
    {
      color: "#5BB88A",
      delay: "0.22s",
      startX: "-30vw",
      startY: "30vh",
      targetX: "-42px",
      targetY: "26px",
      glow: "rgba(91,184,138,0.42)",
    },
    {
      color: "#F5A623",
      delay: "0.38s",
      startX: "34vw",
      startY: "28vh",
      targetX: "42px",
      targetY: "26px",
      glow: "rgba(245,166,35,0.42)",
    },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_42%)]" />

      <div className="relative h-44 w-44">
        <div className="intro-logo absolute inset-0">
          <svg viewBox="0 0 48 48" className="h-full w-full" fill="none" aria-hidden="true">
            <rect width="48" height="48" rx="12" fill="#0F0F0F" />
            <line x1="24" y1="10" x2="11" y2="32" stroke="white" strokeWidth="1" strokeOpacity="0.15" strokeLinecap="round" />
            <line x1="24" y1="10" x2="37" y2="32" stroke="white" strokeWidth="1" strokeOpacity="0.15" strokeLinecap="round" />
            <line x1="11" y1="32" x2="37" y2="32" stroke="white" strokeWidth="1" strokeOpacity="0.15" strokeLinecap="round" />
            <circle cx="24" cy="24" r="5" fill="white" fillOpacity="0.04" />
            <circle cx="24" cy="10" r="5" fill="#4F7CFF" />
            <circle cx="11" cy="32" r="5" fill="#5BB88A" />
            <circle cx="37" cy="32" r="5" fill="#F5A623" />
            <circle cx="24" cy="8.5" r="1.5" fill="white" fillOpacity="0.7" />
            <circle cx="11" cy="30.5" r="1.5" fill="white" fillOpacity="0.7" />
            <circle cx="37" cy="30.5" r="1.5" fill="white" fillOpacity="0.7" />
          </svg>
        </div>

        {nodes.map((node, index) => (
          <span
            key={index}
            className="intro-node absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={
              {
                "--start-x": node.startX,
                "--start-y": node.startY,
                "--target-x": node.targetX,
                "--target-y": node.targetY,
                "--node-glow": node.glow,
                backgroundColor: node.color,
                animationDelay: node.delay,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-10 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/45">PalmchatInnovations Lab</p>
        <p className="mt-2 text-sm text-white/70">Created by Edwin Jaquez</p>
      </div>

      <style>{`
        .intro-node {
          box-shadow: 0 0 0 10px var(--node-glow), 0 0 28px var(--node-glow);
          animation: introNodeLand 1.25s cubic-bezier(0.18, 0.9, 0.22, 1.3) forwards;
          transform: translate(calc(-50% + var(--start-x)), calc(-50% + var(--start-y)));
        }

        .intro-logo {
          opacity: 0;
          transform: scale(0.78);
          animation: introLogoReveal 0.55s ease forwards;
          animation-delay: 1.05s;
          filter: drop-shadow(0 18px 38px rgba(0, 0, 0, 0.45));
        }

        @keyframes introNodeLand {
          0% {
            transform: translate(calc(-50% + var(--start-x)), calc(-50% + var(--start-y))) scale(0.65);
          }
          60% {
            transform: translate(calc(-50% + var(--target-x)), calc(-50% + var(--target-y) - 10px)) scale(1.08);
          }
          78% {
            transform: translate(calc(-50% + var(--target-x)), calc(-50% + var(--target-y) + 4px)) scale(0.96);
          }
          100% {
            transform: translate(calc(-50% + var(--target-x)), calc(-50% + var(--target-y))) scale(1);
          }
        }

        @keyframes introLogoReveal {
          from {
            opacity: 0;
            transform: scale(0.78);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [stage, setStage] = useState<Stage>("checking");
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [warning, setWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARN_COUNTDOWN);
  const [isStartingDemo, setIsStartingDemo] = useState(false);
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistEmail, setWaitlistEmail] = useState("");

  const warnTimer = useRef<ReturnType<typeof setTimeout>>();
  const lockTimer = useRef<ReturnType<typeof setTimeout>>();
  const countRef = useRef<ReturnType<typeof setInterval>>();

  const resetTimers = useCallback(() => {
    clearTimeout(warnTimer.current);
    clearTimeout(lockTimer.current);
    clearInterval(countRef.current);
    setWarning(false);
    setCountdown(WARN_COUNTDOWN);

    warnTimer.current = setTimeout(() => {
      setWarning(true);
      setCountdown(WARN_COUNTDOWN);
      countRef.current = setInterval(() => {
        setCountdown((n) => {
          if (n <= 1) {
            clearInterval(countRef.current);
            return 0;
          }
          return n - 1;
        });
      }, 1000);
    }, IDLE_WARN_MS);

    lockTimer.current = setTimeout(() => {
      void signOut();
    }, IDLE_LOCK_MS);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const boot = async () => {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored === EXPECTED) {
        if (!cancelled) setStage("done");
        return;
      }

      if (stored === DEMO_SESSION_VALUE) {
        const snapshot = sessionStorage.getItem(DEMO_SNAPSHOT_KEY);
        if (snapshot) {
          await importAllData(snapshot);
        }
        if (!cancelled) setStage("done");
        return;
      }

      if (!cancelled) {
        setStage("intro");
        timer = window.setTimeout(() => setStage("login"), INTRO_DURATION_MS);
      }
    };

    void boot();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (stage !== "done") return;
    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    const onActivity = () => resetTimers();
    events.forEach((event) => window.addEventListener(event, onActivity));
    resetTimers();
    return () => {
      events.forEach((event) => window.removeEventListener(event, onActivity));
      clearTimeout(warnTimer.current);
      clearTimeout(lockTimer.current);
      clearInterval(countRef.current);
    };
  }, [stage, resetTimers]);

  const submit = () => {
    if (btoa(code) === EXPECTED) {
      sessionStorage.setItem(SESSION_KEY, EXPECTED);
      setStage("unlocking");
      setTimeout(() => setStage("done"), 1800);
    } else {
      setError(true);
      setShake(true);
      setCode("");
      setTimeout(() => setShake(false), 500);
    }
  };

  const startDemo = async () => {
    try {
      setIsStartingDemo(true);
      const backup = await exportAllData();
      const demoSnapshot = createDemoSnapshot();
      sessionStorage.setItem(DEMO_BACKUP_KEY, backup);
      sessionStorage.setItem(DEMO_SNAPSHOT_KEY, demoSnapshot);
      await importAllData(demoSnapshot);
      sessionStorage.setItem(SESSION_KEY, DEMO_SESSION_VALUE);
      setStage("unlocking");
      setTimeout(() => setStage("done"), 1800);
    } finally {
      setIsStartingDemo(false);
    }
  };

  const waitlistHref = `mailto:hello@palmchatinnovations.com?subject=${encodeURIComponent("Nova beta waitlist request")}&body=${encodeURIComponent(
    `Name: ${waitlistName || "[Your name]"}\nEmail: ${waitlistEmail || "[Your email]"}\n\nI'd like to join the Nova waitlist / beta.\n`,
  )}`;

  if (stage === "checking") return null;
  if (stage === "intro") return <IntroAnimation />;

  if (stage === "done") {
    return (
      <>
        {children}
        {warning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{ animation: "fadeIn 0.3s ease" }}>
            <div className="w-full max-w-sm rounded-2xl border border-nova-border bg-white p-7 text-center shadow-xl" style={{ animation: "cardReveal 0.35s cubic-bezier(0.34,1.2,0.64,1)" }}>
              <p className="mb-3 text-3xl">⏰</p>
              <h2 className="mb-2 font-serif text-xl">Still there?</h2>
              <p className="mb-5 text-sm text-nova-muted">
                You'll be signed out in <span className="font-semibold text-danger">{countdown}s</span> due to inactivity.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => resetTimers()}
                  className="flex-1 rounded-xl bg-nova-text py-2.5 text-sm font-medium text-white transition-colors hover:bg-nova-text/90"
                >
                  Keep me in
                </button>
                <button
                  onClick={() => void signOut()}
                  className="flex-1 rounded-xl border border-nova-border py-2.5 text-sm font-medium text-nova-muted transition-colors hover:bg-nova-bg"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (stage === "unlocking") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 bg-black" style={{ animation: "fadeIn 0.25s ease" }}>
        <Image
          src="/logo.svg"
          alt="Nova"
          width={64}
          height={64}
          className="rounded-2xl"
          style={{ animation: "logoBounce 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
        />
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-full bg-white/85" style={{ animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
        <p className="text-sm font-medium tracking-wide text-white/70">Loading your dashboard…</p>
        <p className="text-[11px] uppercase tracking-[0.28em] text-white/35">PalmchatInnovations Lab · Edwin Jaquez</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#06070a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,124,255,0.2),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(245,166,35,0.18),transparent_26%),linear-gradient(180deg,#07080b_0%,#0a0d12_100%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Nova" width={40} height={40} className="rounded-xl" />
            <div>
              <p className="font-serif text-2xl tracking-tight">Nova</p>
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">PalmchatInnovations Lab</p>
            </div>
          </div>
          <p className="hidden text-sm text-white/60 md:block">Designed and built by Edwin Jaquez</p>
        </header>

        <div className="grid flex-1 gap-10 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <section className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-white/70 backdrop-blur">
              Local-first money, health, and life OS
            </div>
            <h1 className="mt-6 font-serif text-5xl leading-[0.98] text-white sm:text-6xl">
              One beautiful dashboard for your money, health, and daily life.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
              Nova is a premium-feeling personal command center that helps you budget better, stay on top of medication and routines, and keep life admin beautifully organized. Built by Edwin Jaquez under PalmchatInnovations Lab.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "Money with momentum",
                  body: "Guided prompts, dual-currency support, bills, debt payoff, and small-win encouragement.",
                },
                {
                  title: "Health that feels human",
                  body: "Medication tracking, mood and sleep logs, gym history, and editable daily details.",
                },
                {
                  title: "Life admin, finally elegant",
                  body: "Tasks, notes, house details, branded quick links, and a dashboard you can shape around your flow.",
                },
              ].map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
                  style={{ animation: `fadeIn 0.45s ease ${0.15 + index * 0.12}s both` }}
                >
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/60">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {["private by default", "masonry dashboard", "zodiac themes", "demo workspace", "offline-friendly"].map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70">
                  {tag}
                </span>
              ))}
            </div>
          </section>

          <section className="space-y-5">
            <div className={`rounded-[28px] border border-white/10 bg-white p-7 text-center text-nova-text shadow-[0_32px_80px_-24px_rgba(0,0,0,0.6)] ${shake ? "[animation:shake_0.4s_ease-in-out]" : ""}`}>
              <div className="mb-5 flex justify-center">
                <Image src="/logo.svg" alt="Nova" width={56} height={56} className="rounded-xl drop-shadow-md" />
              </div>

              <h1 className="mb-1 font-serif text-2xl text-nova-text">Nova</h1>
              <p className="mb-1 text-sm text-nova-muted">A personal command center by Edwin Jaquez</p>
              <p className="mb-7 text-xs uppercase tracking-[0.22em] text-nova-hint">PalmchatInnovations Lab</p>

              <input
                type="password"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  setError(false);
                }}
                onKeyDown={(event) => event.key === "Enter" && submit()}
                placeholder="Access code"
                autoFocus
                className={`mb-3 w-full rounded-xl border px-4 py-3 text-center text-sm tracking-[0.3em] outline-none transition-colors ${
                  error ? "border-danger bg-danger/5 text-danger" : "border-nova-border bg-nova-bg focus:border-money focus:bg-white"
                }`}
              />

              {error && <p className="mb-3 text-xs text-danger">Incorrect code — try again</p>}

              <button
                onClick={submit}
                disabled={!code}
                className="w-full rounded-xl bg-nova-text py-3 text-sm font-medium text-white transition-all hover:bg-nova-text/90 active:scale-95 disabled:opacity-40"
              >
                Log in
              </button>

              <button
                onClick={() => void startDemo()}
                disabled={isStartingDemo}
                className="mt-3 w-full rounded-xl border border-nova-border py-3 text-sm font-medium text-nova-text transition-colors hover:bg-nova-bg disabled:opacity-50"
              >
                {isStartingDemo ? "Preparing demo…" : "Demo"}
              </button>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Waitlist / Beta</p>
              <h2 className="mt-2 font-serif text-2xl text-white">Request early access</h2>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Want to test Nova, give feedback, or follow the build? Send a beta request and let Edwin know how you'd use it.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <input
                  value={waitlistName}
                  onChange={(event) => setWaitlistName(event.target.value)}
                  placeholder="Your name"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-white/25"
                />
                <input
                  type="email"
                  value={waitlistEmail}
                  onChange={(event) => setWaitlistEmail(event.target.value)}
                  placeholder="Your email"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-white/25"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <a href={waitlistHref} className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition-transform hover:-translate-y-0.5">
                  Join waitlist
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setWaitlistName("");
                    setWaitlistEmail("");
                  }}
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/5"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Built to feel legit", "Animated onboarding, refined typography, polished cards, and branded iconography throughout."],
                ["Demo-safe exploration", "Demo mode swaps in a seeded workspace and restores your real data when you leave."],
                ["Founder-led product", "PalmchatInnovations Lab and Edwin Jaquez are visibly credited throughout the experience."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/60">{body}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-9px); }
          40% { transform: translateX(9px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
