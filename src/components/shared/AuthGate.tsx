"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const SESSION_KEY = "nova_session";
// Simple obfuscation — not real security, just a soft lock
const EXPECTED = btoa("Britney10!");

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null); // null = loading
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    setAuthed(stored === EXPECTED);
  }, []);

  const submit = () => {
    if (btoa(code) === EXPECTED) {
      sessionStorage.setItem(SESSION_KEY, EXPECTED);
      setAuthed(true);
    } else {
      setError(true);
      setShake(true);
      setCode("");
      setTimeout(() => setShake(false), 500);
    }
  };

  // Still checking session
  if (authed === null) return null;

  // Authenticated — render app normally
  if (authed) return <>{children}</>;

  // Login screen
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-nova-bg">
      <div className={`bg-white border border-nova-border rounded-2xl shadow-xl p-8 w-full max-w-sm text-center transition-all ${shake ? "animate-shake" : ""}`}>
        <div className="flex justify-center mb-4">
          <Image src="/logo.svg" alt="Nova" width={52} height={52} className="rounded-xl" />
        </div>
        <h1 className="font-serif text-2xl text-nova-text mb-1">Nova</h1>
        <p className="text-sm text-nova-muted mb-6">Enter your access code to continue</p>

        <input
          type="password"
          value={code}
          onChange={e => { setCode(e.target.value); setError(false); }}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="Access code"
          autoFocus
          className={`w-full px-4 py-3 border rounded-xl text-sm text-center tracking-widest outline-none transition-colors mb-3 ${
            error
              ? "border-danger bg-danger/5 text-danger placeholder-danger/40"
              : "border-nova-border bg-nova-bg focus:border-money focus:bg-white"
          }`}
        />

        {error && <p className="text-xs text-danger mb-3">Incorrect code — try again</p>}

        <button
          onClick={submit}
          disabled={!code}
          className="w-full py-3 bg-nova-text text-white rounded-xl text-sm font-medium hover:bg-nova-text/90 transition-colors disabled:opacity-40"
        >
          Unlock
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}
