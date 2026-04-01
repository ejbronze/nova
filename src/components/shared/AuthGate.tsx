"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

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
    <div className="fixed inset-0 flex items-center justify-center bg-nova-bg">
      <div
        className={`bg-white border border-nova-border rounded-2xl shadow-xl p-8 w-full max-w-sm text-center ${shake ? "[animation:shake_0.4s_ease-in-out]" : ""}`}
        style={{ animation: shake ? undefined : "cardReveal 0.5s cubic-bezier(0.34,1.2,0.64,1) 0.4s both" }}
      >
        <div
          className="flex justify-center mb-5"
          style={{ animation: "logoBounce 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.1s both" }}
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
