"use client";

import { useState, useEffect, useRef, useCallback, type CSSProperties } from "react";
import Image from "next/image";

const SESSION_KEY = "nova_session";
const EXPECTED = btoa("Britney10!");

// Inactivity settings (ms)
const IDLE_WARN_MS  = 4 * 60 * 1000; // warn after 4 min
const IDLE_LOCK_MS  = 5 * 60 * 1000; // lock after 5 min
const WARN_COUNTDOWN = 60;           // seconds shown in warning

type Stage = "checking" | "intro" | "login" | "unlocking" | "done";

const INTRO_DURATION_MS = 2400;

export function signOut() {
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
  const [stage, setStage]       = useState<Stage>("checking");
  const [code, setCode]         = useState("");
  const [error, setError]       = useState(false);
  const [shake, setShake]       = useState(false);
  const [warning, setWarning]   = useState(false);
  const [countdown, setCountdown] = useState(WARN_COUNTDOWN);

  const warnTimer  = useRef<ReturnType<typeof setTimeout>>();
  const lockTimer  = useRef<ReturnType<typeof setTimeout>>();
  const countRef   = useRef<ReturnType<typeof setInterval>>();

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
        setCountdown(n => {
          if (n <= 1) { clearInterval(countRef.current); return 0; }
          return n - 1;
        });
      }, 1000);
    }, IDLE_WARN_MS);

    lockTimer.current = setTimeout(() => {
      signOut();
    }, IDLE_LOCK_MS);
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored === EXPECTED) {
      setStage("done");
      return;
    }
    setStage("intro");
    const timer = window.setTimeout(() => setStage("login"), INTRO_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);

  // Start/stop inactivity timers when authenticated
  useEffect(() => {
    if (stage !== "done") return;
    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    const onActivity = () => resetTimers();
    events.forEach(e => window.addEventListener(e, onActivity));
    resetTimers();
    return () => {
      events.forEach(e => window.removeEventListener(e, onActivity));
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

  if (stage === "checking") return null;

  if (stage === "intro") {
    return <IntroAnimation />;
  }

  if (stage === "done") return (
    <>
      {children}
      {warning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          style={{ animation: "fadeIn 0.3s ease" }}>
          <div className="bg-white border border-nova-border rounded-2xl shadow-xl p-7 w-full max-w-sm text-center"
            style={{ animation: "cardReveal 0.35s cubic-bezier(0.34,1.2,0.64,1)" }}>
            <p className="text-3xl mb-3">⏰</p>
            <h2 className="font-serif text-xl mb-2">Still there?</h2>
            <p className="text-sm text-nova-muted mb-5">
              You'll be signed out in{" "}
              <span className="font-semibold text-danger">{countdown}s</span>{" "}
              due to inactivity.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => resetTimers()}
                className="flex-1 py-2.5 bg-nova-text text-white rounded-xl text-sm font-medium hover:bg-nova-text/90 transition-colors"
              >
                Keep me in
              </button>
              <button
                onClick={signOut}
                className="flex-1 py-2.5 border border-nova-border rounded-xl text-sm font-medium text-nova-muted hover:bg-nova-bg transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (stage === "unlocking") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black gap-6"
        style={{ animation: "fadeIn 0.25s ease" }}>
        <Image
          src="/logo.svg"
          alt="Nova"
          width={64}
          height={64}
          className="rounded-2xl"
          style={{ animation: "logoBounce 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
        />
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-white/85"
              style={{ animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
        <p className="text-sm text-white/70 font-medium tracking-wide">Loading your dashboard…</p>
      </div>
    );
  }

  // Login stage
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div
        className={`w-full max-w-sm rounded-2xl border border-white/10 bg-white p-8 text-center shadow-[0_32px_80px_-24px_rgba(0,0,0,0.6)] ${shake ? "[animation:shake_0.4s_ease-in-out]" : ""}`}
        style={{ animation: shake ? undefined : "cardReveal 0.45s cubic-bezier(0.34,1.2,0.64,1) both" }}
      >
        <div
          className="flex justify-center mb-5"
          style={{ animation: "fadeIn 0.35s ease 0.1s both" }}
        >
          <Image src="/logo.svg" alt="Nova" width={56} height={56} className="rounded-xl drop-shadow-md" />
        </div>

        <h1
          className="font-serif text-2xl text-nova-text mb-1"
          style={{ animation: "fadeIn 0.4s ease 0.5s both" }}
        >
          Nova
        </h1>
        <p
          className="text-sm text-nova-muted mb-7"
          style={{ animation: "fadeIn 0.4s ease 0.65s both" }}
        >
          Enter your access code to continue
        </p>

        <div style={{ animation: "fadeIn 0.4s ease 0.75s both" }}>
          <input
            type="password"
            value={code}
            onChange={e => { setCode(e.target.value); setError(false); }}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="••••••••••"
            autoFocus
            className={`w-full px-4 py-3 border rounded-xl text-sm text-center tracking-[0.3em] outline-none transition-colors mb-3 ${
              error
                ? "border-danger bg-danger/5 text-danger"
                : "border-nova-border bg-nova-bg focus:border-money focus:bg-white"
            }`}
          />

          {error && (
            <p className="text-xs text-danger mb-3" style={{ animation: "fadeIn 0.2s ease" }}>
              Incorrect code — try again
            </p>
          )}

          <button
            onClick={submit}
            disabled={!code}
            className="w-full py-3 bg-nova-text text-white rounded-xl text-sm font-medium hover:bg-nova-text/90 active:scale-95 transition-all disabled:opacity-40"
          >
            Unlock
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-9px); }
          40%       { transform: translateX(9px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
