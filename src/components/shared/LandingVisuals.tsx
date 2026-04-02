"use client";

import { useEffect, useState } from "react";

const HERO_METRICS = [
  { label: "Private by default", value: "Local-first" },
  { label: "Three pillars", value: "Money · Health · Life" },
  { label: "Flexible layout", value: "Move and resize cards" },
];

const FEATURE_ROWS = [
  {
    title: "A calmer command center",
    body: "One dashboard for the parts of life that usually live in separate apps.",
  },
  {
    title: "Guided by your rhythm",
    body: "Nova uses zodiac-led energy as a tone system, not a gimmick.",
  },
  {
    title: "Built for real daily use",
    body: "Track routines, see progress, and keep your future visible in one place.",
  },
];

const BAR_VALUES = [0.3, 0.44, 0.61, 0.86, 0.56, 0.7, 0.48];

function HeroMockup({ animateIn }: { animateIn: boolean }) {
  return (
    <div className="relative mx-auto w-full max-w-[34rem]">
      <div className="absolute -left-10 top-10 h-32 w-32 rounded-[2rem] bg-white/70 shadow-[0_24px_50px_-30px_rgba(88,94,176,0.35)] backdrop-blur-sm" />
      <div className="absolute -right-8 bottom-12 h-24 w-24 rounded-full border border-[#dfe2fb] bg-white/72 shadow-[0_24px_50px_-30px_rgba(88,94,176,0.35)] backdrop-blur-sm" />

      <div className="landing-device relative overflow-hidden rounded-[2.25rem] border border-[#d8dbf8] bg-[linear-gradient(180deg,#fcfcff_0%,#f3f3ff_100%)] p-3 shadow-[0_36px_90px_-42px_rgba(70,78,170,0.42)]">
        <div className="rounded-[1.8rem] border border-[#e2e5fb] bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8b91bc]">Nova</p>
              <p className="mt-1 text-sm font-medium text-[#20254a]">Your daily dashboard</p>
            </div>
            <div className="flex gap-1.5">
              {["#4F7CFF", "#5BB88A", "#F5A623"].map((color) => (
                <span key={color} className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[1.4rem] bg-[linear-gradient(135deg,#ece9ff_0%,#f8f7ff_100%)] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b91bc]">Future mode</p>
                  <p className="mt-2 font-serif text-[2rem] leading-none text-[#1d2148]">Calm clarity</p>
                  <p className="mt-2 max-w-[14rem] text-xs leading-5 text-[#666d9c]">
                    A softer dashboard for routines, finances, health, and direction.
                  </p>
                </div>
                <div className="rounded-[1.1rem] bg-white px-3 py-2 text-[11px] font-medium text-[#6f72ff] shadow-sm">
                  Gemini
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[1.15fr_0.85fr] gap-3">
              <div className="rounded-[1.35rem] border border-[#e9ebff] bg-[#fafaff] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b91bc]">Net worth</p>
                <p className="mt-2 font-serif text-[2rem] leading-none text-[#20254a]">$8,420</p>
                <div className="mt-4 flex h-[4.75rem] items-end gap-1">
                  {BAR_VALUES.map((value, index) => (
                    <span
                      key={index}
                      className="flex-1 rounded-[4px] bg-[#726df8]/20"
                      style={{
                        height: animateIn ? `${value * 100}%` : "0%",
                        backgroundColor: index === 3 ? "#726df8" : undefined,
                        transition: `height 0.55s cubic-bezier(0.34,1.3,0.64,1) ${0.08 + index * 0.05}s`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-[1.35rem] bg-[#eef8f2] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#67937a]">Health</p>
                <p className="mt-2 text-base font-semibold text-[#214533]">7h 18m sleep</p>
                <p className="mt-2 text-xs leading-5 text-[#5e836c]">Medication and mood stay visible.</p>
              </div>
            </div>

            <div className="grid grid-cols-[0.9fr_1.1fr] gap-3">
              <div className="rounded-[1.35rem] bg-[#fff8ee] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b48745]">Goals</p>
                <p className="mt-2 text-base font-semibold text-[#4f3f23]">3 in motion</p>
                <p className="mt-2 text-xs leading-5 text-[#8f7751]">The next chapter stays in view.</p>
              </div>

              <div className="rounded-[1.35rem] border border-[#e9ebff] bg-white p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b91bc]">Today</p>
                <div className="mt-3 space-y-2">
                  {["Morning ritual", "Budget check", "Medication check-in"].map((item, index) => (
                    <div key={item} className="flex items-center justify-between rounded-[1rem] bg-[#f8f8ff] px-3 py-2.5">
                      <span className="text-xs font-medium text-[#20254a]">{item}</span>
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: index === 0 ? "#4F7CFF" : index === 1 ? "#5BB88A" : "#F5A623" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingVisuals() {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setAnimateIn(true), 120);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="relative -mx-5 sm:-mx-6 lg:-mx-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-6%] h-[28rem] w-[28rem] rounded-full border-[36px] border-[#6f72ff]/55" />
        <div className="absolute right-[-8%] top-[8%] h-[22rem] w-[22rem] rounded-full border-[28px] border-[#7d7fff]/45" />
        <div className="absolute bottom-[5%] right-[10%] h-[14rem] w-[14rem] rounded-full border-[22px] border-[#5BB88A]/22" />
        <div className="absolute bottom-[-6%] left-[16%] h-[18rem] w-[18rem] rounded-full border-[24px] border-[#F5A623]/18" />
      </div>

      <section className="relative overflow-hidden border-y border-[#e2e4fb] bg-[linear-gradient(180deg,#f5f3ff_0%,#eef3ff_50%,#faf8ff_100%)] px-6 py-10 sm:px-8 sm:py-12 lg:px-10 xl:px-14">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.5),transparent_34%,rgba(111,114,255,0.04)_66%,transparent_82%)]" />

        <div className="relative grid gap-10 xl:grid-cols-[0.7fr_1.3fr] xl:items-center">
          <div className="max-w-[31rem]">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#d8dcfa] bg-white/82 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7075ae] shadow-sm">
              <span className="flex gap-[5px]">
                <span className="h-[7px] w-[7px] rounded-full bg-[#4F7CFF]" />
                <span className="h-[7px] w-[7px] rounded-full bg-[#5BB88A]" />
                <span className="h-[7px] w-[7px] rounded-full bg-[#F5A623]" />
              </span>
              Zodiac-guided life OS
            </p>

            <h1 className="mt-5 font-serif text-[3rem] leading-[0.92] text-[#1f2350] sm:text-[3.75rem] xl:text-[4.35rem]">
              A more beautiful way to run your life.
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-6 text-[#666d9c] sm:text-base">
              Nova brings money, health, and life into one personal dashboard so your routines feel connected, clear, and actually usable.
            </p>

            <div className="mt-6 grid gap-2.5">
              {HERO_METRICS.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.25rem] border border-[#dfe2fb] bg-white/76 px-4 py-3 shadow-[0_16px_32px_-26px_rgba(84,91,176,0.35)]"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7c80b6]">{item.label}</p>
                  <p className="mt-1 text-sm font-medium text-[#22264a]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex min-h-[30rem] items-center justify-center xl:min-h-[38rem]">
            <div className="absolute inset-0 rounded-[3rem] bg-[radial-gradient(circle_at_center,rgba(111,114,255,0.14),transparent_52%)] blur-3xl" />
            <HeroMockup animateIn={animateIn} />
          </div>
        </div>
      </section>

      <section className="relative border-b border-[#e2e4fb] bg-white/62 px-6 py-8 backdrop-blur-sm sm:px-8 lg:px-10 xl:px-14">
        <div className="grid gap-3 md:grid-cols-3">
          {FEATURE_ROWS.map((feature) => (
            <div
              key={feature.title}
              className="rounded-[1.4rem] border border-[#e3e6fb] bg-white/78 px-4 py-4 shadow-[0_16px_32px_-28px_rgba(84,91,176,0.28)]"
            >
              <p className="text-sm font-semibold text-[#22264a]">{feature.title}</p>
              <p className="mt-2 text-sm leading-6 text-[#666d9c]">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .landing-device {
          transition: transform 260ms ease, box-shadow 260ms ease;
        }

        .landing-device:hover {
          transform: translateY(-4px);
          box-shadow: 0 42px 96px -44px rgba(70, 78, 170, 0.5);
        }
      `}</style>
    </div>
  );
}
