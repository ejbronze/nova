"use client";

import Image from "next/image";
import { PillarIcon } from "@/components/shared/PillarIcon";
import { ZODIAC_THEMES } from "@/lib/themes";

function FutureIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M6 17L18 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10 7H18V15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="17" r="2.4" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function RitualIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8V12L15 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2" fill="currentColor" fillOpacity="0.22" />
    </svg>
  );
}

function ConstellationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M6 17L10.5 8.5L16.5 10.5L18 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="17" r="1.8" fill="currentColor" />
      <circle cx="10.5" cy="8.5" r="1.8" fill="currentColor" />
      <circle cx="16.5" cy="10.5" r="1.8" fill="currentColor" />
      <circle cx="18" cy="16" r="1.8" fill="currentColor" />
    </svg>
  );
}

const LANDING_FEATURES = [
  {
    title: "Shape your next chapter",
    body: "A dashboard that turns intention into visible daily momentum.",
    icon: FutureIcon,
  },
  {
    title: "Built around ritual",
    body: "Money, health, and life systems that help routines actually stick.",
    icon: RitualIcon,
  },
  {
    title: "Constellation-led identity",
    body: "Zodiac themes and motion tie the product to personal evolution.",
    icon: ConstellationIcon,
  },
];

export function LandingVisuals() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -left-10 top-10 h-40 w-40 rounded-full bg-[#4F7CFF]/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 h-52 w-52 rounded-full bg-[#F5A623]/16 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 top-2/3 h-44 w-44 rounded-full bg-[#5BB88A]/14 blur-3xl" />

      <div className="relative rounded-[36px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
        <div className="absolute inset-0 rounded-[36px] bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_48%,rgba(255,255,255,0.03))]" />

        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.24em] text-white/55">
            <span className="h-2 w-2 rounded-full bg-white/60" />
            Zodiac-guided life OS
          </div>

          <h2 className="mt-5 max-w-xl font-serif text-5xl leading-[0.98] text-white sm:text-6xl">
            Create a future that feels aligned, intentional, and yours.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/68 sm:text-lg">
            Nova ties your money, health, and life rituals into one evolving constellation so every choice feels connected to the person you are becoming.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/76">
              <PillarIcon pillar="money" size={16} />
              Abundance
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/76">
              <PillarIcon pillar="health" size={16} />
              Vitality
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/76">
              <PillarIcon pillar="life" size={16} />
              Direction
            </span>
          </div>

          <div className="mt-10 grid gap-5 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {LANDING_FEATURES.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-white/72"
                    style={{ animation: `fadeIn 0.45s ease ${0.15 + index * 0.12}s both` }}
                  >
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white">
                      <Icon />
                    </div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-2 text-sm leading-6">{item.body}</p>
                  </div>
                );
              })}
            </div>

            <div className="relative mx-auto mt-3 flex w-full max-w-[460px] items-center justify-center xl:mt-0">
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.12),transparent_58%)] blur-xl" />
              <div className="zodiac-wheel relative h-[360px] w-[360px] sm:h-[420px] sm:w-[420px]">
                <div className="absolute inset-[13%] rounded-full border border-white/10 bg-[radial-gradient(circle,rgba(255,255,255,0.08),rgba(255,255,255,0.03)_45%,transparent_70%)]" />
                <div className="absolute inset-[18%] rounded-full border border-dashed border-white/12" />
                <div className="absolute inset-[4%] rounded-full border border-white/10" />

                {ZODIAC_THEMES.map((theme, index) => {
                  const angle = (index / ZODIAC_THEMES.length) * Math.PI * 2 - Math.PI / 2;
                  const radius = 44;
                  const x = 50 + Math.cos(angle) * radius;
                  const y = 50 + Math.sin(angle) * radius;
                  return (
                    <span
                      key={theme.sign}
                      className="absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#09101a]/80 text-lg text-white/80 backdrop-blur-md"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        boxShadow: `0 0 0 1px ${theme.accent}22, 0 10px 25px rgba(0,0,0,0.18)`,
                      }}
                    >
                      {theme.symbol}
                    </span>
                  );
                })}

                <div className="absolute left-1/2 top-1/2 flex h-[180px] w-[180px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[36px] border border-white/12 bg-[#0b1018]/86 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.7)]">
                  <div className="relative">
                    <Image src="/logo.svg" alt="Nova" width={76} height={76} className="rounded-2xl shadow-2xl" />
                    <span className="absolute -right-2 -top-2 h-3 w-3 rounded-full bg-[#4F7CFF] shadow-[0_0_18px_rgba(79,124,255,0.7)]" />
                    <span className="absolute -left-3 bottom-5 h-3 w-3 rounded-full bg-[#5BB88A] shadow-[0_0_18px_rgba(91,184,138,0.7)]" />
                    <span className="absolute bottom-1 -right-3 h-3 w-3 rounded-full bg-[#F5A623] shadow-[0_0_18px_rgba(245,166,35,0.7)]" />
                  </div>
                  <p className="mt-5 text-[11px] uppercase tracking-[0.24em] text-white/45">Your next self</p>
                  <p className="mt-2 text-center font-serif text-2xl leading-none text-white">Starts with one aligned ritual.</p>
                </div>

                <div className="absolute left-[20%] top-[22%] h-2 w-2 rounded-full bg-white/70 shadow-[0_0_16px_rgba(255,255,255,0.8)]" />
                <div className="absolute right-[18%] top-[30%] h-1.5 w-1.5 rounded-full bg-white/60 shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
                <div className="absolute bottom-[20%] left-[30%] h-2 w-2 rounded-full bg-white/65 shadow-[0_0_14px_rgba(255,255,255,0.7)]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .zodiac-wheel {
          animation: zodiacFloat 7s ease-in-out infinite;
        }

        @keyframes zodiacFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}
