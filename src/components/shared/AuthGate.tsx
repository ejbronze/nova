"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { LandingVisuals } from "@/components/shared/LandingVisuals";

const SESSION_KEY = "nova_session";
const EXPECTED = btoa("Britney10!");

// Inactivity settings (ms)
const IDLE_WARN_MS  = 4 * 60 * 1000; // warn after 4 min
const IDLE_LOCK_MS  = 5 * 60 * 1000; // lock after 5 min
const WARN_COUNTDOWN = 60;           // seconds shown in warning

type Stage = "checking" | "login" | "unlocking" | "done";

export function signOut() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.reload();
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
    setStage(stored === EXPECTED ? "done" : "login");
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

  const waitlistHref =
    "mailto:hello@palmchatinnovations.com?subject=" +
    encodeURIComponent("Nova beta request") +
    "&body=" +
    encodeURIComponent("I'd love to join the Nova beta and learn more about the product.\n");

  if (stage === "checking") return null;

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
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-nova-bg gap-6"
        style={{ animation: "fadeIn 0.3s ease" }}>
        <Image
          src="/logo.svg"
          alt="Nova"
          width={64}
          height={64}
          className="rounded-2xl"
          style={{ animation: "logoBounce 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
        />
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-nova-text"
              style={{ animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
        <p className="text-sm text-nova-muted font-medium tracking-wide">Loading your dashboard…</p>
      </div>
    );
  }

  // Login stage
  return (
    <div className="fixed inset-0 overflow-y-auto bg-[linear-gradient(180deg,#f3f1ff_0%,#eef3ff_45%,#f9f7ff_100%)] text-[#1f2350]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(111,114,255,0.16),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(245,166,35,0.12),transparent_24%),radial-gradient(circle_at_12%_30%,rgba(91,184,138,0.10),transparent_24%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-5 py-8 sm:px-6 lg:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Nova" width={40} height={40} className="rounded-xl" />
            <div>
              <p className="font-serif text-2xl tracking-tight text-[#1f2350]">Nova</p>
              <p className="text-xs uppercase tracking-[0.24em] text-[#787db2]">PalmchatInnovations Lab</p>
            </div>
          </div>
          <p className="hidden text-sm text-[#666b9d] md:block">Designed and built by Edwin Jaquez</p>
        </header>

        <div className="flex-1 py-8">
          <LandingVisuals />

          <section className="mt-10">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div
                className={`rounded-[30px] border border-[#dfe2fb] bg-white/88 p-5 shadow-[0_30px_80px_-44px_rgba(84,91,176,0.45)] backdrop-blur-xl sm:p-6 ${shake ? "[animation:shake_0.4s_ease-in-out]" : ""}`}
                style={{ animation: shake ? undefined : "cardReveal 0.5s cubic-bezier(0.34,1.2,0.64,1) 0.2s both" }}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Image src="/logo.svg" alt="Nova" width={44} height={44} className="rounded-xl" />
                    <div>
                      <p className="font-serif text-2xl text-[#1f2350]">Enter Nova</p>
                      <p className="text-sm text-[#666b9d]">Unlock your personal dashboard.</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#eef2ff] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f72ff]">
                    Private by default
                  </span>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
                  <input
                    type="password"
                    value={code}
                    onChange={e => { setCode(e.target.value); setError(false); }}
                    onKeyDown={e => e.key === "Enter" && submit()}
                    placeholder="Access code"
                    autoFocus
                    className={`rounded-2xl border px-4 py-3 text-sm tracking-[0.24em] outline-none transition-colors ${
                      error
                        ? "border-danger bg-danger/5 text-danger"
                        : "border-[#d8dcfa] bg-[#f8f9ff] text-[#1f2350] focus:border-[#6f72ff] focus:bg-white"
                    }`}
                  />
                  <button
                    onClick={submit}
                    disabled={!code}
                    className="rounded-2xl bg-[#1f2350] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[#2a3063] active:scale-95 disabled:opacity-40"
                  >
                    Unlock
                  </button>
                </div>

                {error && (
                  <p className="mt-3 text-xs text-danger" style={{ animation: "fadeIn 0.2s ease" }}>
                    Incorrect code — try again
                  </p>
                )}
              </div>

              <div className="rounded-[30px] border border-[#dfe2fb] bg-white/82 p-5 text-[#1f2350] shadow-[0_30px_80px_-44px_rgba(84,91,176,0.24)] backdrop-blur-xl sm:p-6">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/65">Request beta</p>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#7c80b6]">Request beta</p>
                <p className="mt-3 font-serif text-3xl leading-none">Stay close to the build.</p>
                <p className="mt-3 text-sm leading-6 text-[#666d9c]">
                  Join the waitlist, follow the product, and help shape the future of Nova with Edwin Jaquez.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href={waitlistHref}
                    className="rounded-full bg-[#1f2350] px-4 py-2.5 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
                  >
                    Join waitlist
                  </a>
                  <span className="rounded-full border border-[#dfe2fb] px-4 py-2.5 text-sm font-medium text-[#666d9c]">
                    PalmchatInnovations Lab
                  </span>
                </div>
              </div>
            </div>
          </section>
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
