"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { PillarIcon } from "@/components/shared/PillarIcon";
import { ZodiacIcon } from "@/components/shared/ZodiacIcon";
import { ZODIAC_THEMES, type ZodiacSign } from "@/lib/themes";

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
    body: "Branded zodiac icons and motion make the product feel symbolic, personal, and alive.",
    icon: ConstellationIcon,
  },
];

const SIGN_STORIES: Record<ZodiacSign, { future: string; ritual: string; spotlight: string }> = {
  aries: {
    future: "Move first, refine later. Nova turns bold starts into a rhythm you can sustain.",
    ritual: "Fast logging and visible progress help momentum feel energizing instead of chaotic.",
    spotlight: "Best for users who want action to become structure.",
  },
  taurus: {
    future: "Build a calmer, richer future through steady rituals and grounded decisions.",
    ritual: "Nova rewards consistency, helping budgets and habits feel luxurious instead of restrictive.",
    spotlight: "Best for users who want comfort, abundance, and control.",
  },
  gemini: {
    future: "See more of yourself at once and keep every part of life in conversation.",
    ritual: "Switch contexts quickly without losing the thread between health, money, and life admin.",
    spotlight: "Best for users who want flexibility without fragmentation.",
  },
  cancer: {
    future: "Protect your peace by making care visible and easy to return to.",
    ritual: "Medication, sleep, tasks, and money all sit in one reassuring command center.",
    spotlight: "Best for users who want softness with real structure.",
  },
  leo: {
    future: "Design a future that feels radiant, intentional, and unmistakably yours.",
    ritual: "Nova makes daily upkeep feel elevated, expressive, and worth showing up for.",
    spotlight: "Best for users who want ambition with style.",
  },
  virgo: {
    future: "Turn scattered details into a life system that feels clean, useful, and precise.",
    ritual: "Nova gives every routine a clear place so follow-through feels satisfying.",
    spotlight: "Best for users who want elegance through order.",
  },
  libra: {
    future: "Balance beauty and discipline so the dashboard feels as good as the progress it tracks.",
    ritual: "Thoughtful layout, refined cues, and clear signals make decisions feel lighter.",
    spotlight: "Best for users who want harmony across everything.",
  },
  scorpio: {
    future: "Transform your private inner shifts into visible long-term power.",
    ritual: "Nova holds the deep work: rebuilding finances, health, and discipline quietly over time.",
    spotlight: "Best for users who want intensity with control.",
  },
  sagittarius: {
    future: "Aim at a bigger life and keep the practical systems moving with you.",
    ritual: "Nova helps vision stay connected to daily action, not just big ideas.",
    spotlight: "Best for users who want freedom with follow-through.",
  },
  capricorn: {
    future: "Make progress measurable and let discipline become a visible advantage.",
    ritual: "The dashboard turns structure into momentum without feeling corporate or cold.",
    spotlight: "Best for users who want strategy that compounds.",
  },
  aquarius: {
    future: "Invent a life system that feels original, future-ready, and unmistakably your own.",
    ritual: "Nova merges experimentation, personal symbolism, and practical tracking into one flow.",
    spotlight: "Best for users who want vision with unconventional clarity.",
  },
  pisces: {
    future: "Turn intuition into gentle systems that keep your real life afloat.",
    ritual: "Nova helps dreams become rituals through visual clarity and soft accountability.",
    spotlight: "Best for users who want tenderness with traction.",
  },
};

const STORY_SECTIONS = [
  {
    kicker: "A private future",
    title: "The dashboard becomes a mirror for the life you want next.",
    body: "Nova is designed to feel less like software and more like a future-self ritual space. Every section connects back to the same question: who are you becoming?",
  },
  {
    kicker: "Aligned systems",
    title: "Money, health, and life stop competing for your attention.",
    body: "Instead of bouncing between disconnected apps, Nova lets each decision reinforce the others. Budgeting can support health. Health can support direction. Direction can support peace.",
  },
  {
    kicker: "Designed identity",
    title: "Your sign becomes part of the emotional language of the product.",
    body: "Themes, icons, motion, and tone all reinforce a sense of identity, so the experience feels expressive without losing practical clarity.",
  },
];

export function LandingVisuals() {
  const [activeSign, setActiveSign] = useState<ZodiacSign>("gemini");
  const activeTheme = useMemo(
    () => ZODIAC_THEMES.find((theme) => theme.sign === activeSign) ?? ZODIAC_THEMES[0],
    [activeSign],
  );
  const story = SIGN_STORIES[activeSign];

  return (
    <div className="relative pb-10">
      <div className="pointer-events-none absolute -left-10 top-10 h-40 w-40 rounded-full blur-3xl" style={{ backgroundColor: `${activeTheme.accent}33` }} />
      <div className="pointer-events-none absolute right-0 top-24 h-52 w-52 rounded-full bg-[#F5A623]/16 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 top-[48rem] h-44 w-44 rounded-full bg-[#5BB88A]/14 blur-3xl" />

      <section className="relative rounded-[36px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
        <div className="absolute inset-0 rounded-[36px] bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_48%,rgba(255,255,255,0.03))]" />

        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.24em] text-white/55">
            <span className="h-2 w-2 rounded-full bg-white/60" />
            Zodiac-guided life OS
          </div>

          <h2 className="mt-5 max-w-2xl font-serif text-5xl leading-[0.98] text-white sm:text-6xl">
            Create a new future for yourself, one aligned ritual at a time.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/68 sm:text-lg">
            Explore the sign energy that feels like your next chapter. Nova connects that identity to real systems for abundance, vitality, and direction.
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

          <div className="mt-10 grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
            <div className="grid gap-4">
              <div className="rounded-[30px] border border-white/10 bg-[#08101a]/70 p-5 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.65)]">
                <div className="flex items-center gap-3">
                  <ZodiacIcon sign={activeTheme.sign} size={46} className="text-white" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-white/45">Current spotlight</p>
                    <p className="mt-1 font-serif text-3xl text-white">
                      {activeTheme.name} <span className="text-white/45">{activeTheme.symbol}</span>
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-white/72">{story.future}</p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">Aligned ritual</p>
                    <p className="mt-2 text-sm leading-6 text-white/76">{story.ritual}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">Why it fits</p>
                    <p className="mt-2 text-sm leading-6 text-white/76">{story.spotlight}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
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
                  const isActive = theme.sign === activeTheme.sign;
                  return (
                    <button
                      key={theme.sign}
                      type="button"
                      onClick={() => setActiveSign(theme.sign)}
                      className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-md transition-all ${
                        isActive ? "h-14 w-14 scale-110 border-white/25 bg-[#08111d]" : "h-11 w-11 border-white/10 bg-[#09101a]/80 hover:scale-105"
                      }`}
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        color: isActive ? theme.accentLight : "rgba(255,255,255,0.82)",
                        boxShadow: `0 0 0 1px ${theme.accent}22, 0 10px 25px rgba(0,0,0,0.18)`,
                      }}
                      aria-label={`Explore ${theme.name}`}
                      title={theme.name}
                    >
                      <ZodiacIcon sign={theme.sign} size={isActive ? 30 : 24} className="border-0 bg-transparent text-current" />
                    </button>
                  );
                })}

                <div className="absolute left-1/2 top-1/2 flex h-[188px] w-[188px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[36px] border border-white/12 bg-[#0b1018]/86 px-6 text-center shadow-[0_30px_90px_-30px_rgba(0,0,0,0.7)]">
                  <div className="relative">
                    <Image src="/logo.svg" alt="Nova" width={76} height={76} className="rounded-2xl shadow-2xl" />
                    <span className="absolute -right-2 -top-2 h-3 w-3 rounded-full bg-[#4F7CFF] shadow-[0_0_18px_rgba(79,124,255,0.7)]" />
                    <span className="absolute -left-3 bottom-5 h-3 w-3 rounded-full bg-[#5BB88A] shadow-[0_0_18px_rgba(91,184,138,0.7)]" />
                    <span className="absolute bottom-1 -right-3 h-3 w-3 rounded-full bg-[#F5A623] shadow-[0_0_18px_rgba(245,166,35,0.7)]" />
                  </div>
                  <p className="mt-5 text-[11px] uppercase tracking-[0.24em] text-white/45">{activeTheme.element} sign energy</p>
                  <p className="mt-2 font-serif text-2xl leading-none text-white">{activeTheme.description}</p>
                  <p className="mt-3 text-xs leading-5 text-white/58">{activeTheme.dates}</p>
                </div>

                <div className="absolute left-[20%] top-[22%] h-2 w-2 rounded-full bg-white/70 shadow-[0_0_16px_rgba(255,255,255,0.8)]" />
                <div className="absolute right-[18%] top-[30%] h-1.5 w-1.5 rounded-full bg-white/60 shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
                <div className="absolute bottom-[20%] left-[30%] h-2 w-2 rounded-full bg-white/65 shadow-[0_0_14px_rgba(255,255,255,0.7)]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 space-y-8">
        {STORY_SECTIONS.map((section, index) => (
          <div key={section.title} className="relative min-h-[70vh]">
            <div className="sticky top-14 rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,15,22,0.92),rgba(7,9,13,0.95))] p-8 shadow-[0_30px_90px_-35px_rgba(0,0,0,0.72)]">
              <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">{section.kicker}</p>
                  <h3 className="mt-4 max-w-md font-serif text-4xl leading-tight text-white">{section.title}</h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
                    <p className="text-sm leading-7 text-white/72">{section.body}</p>
                  </div>
                  <div
                    className="rounded-3xl border border-white/10 p-5"
                    style={{
                      background: `linear-gradient(135deg, ${activeTheme.accent}24, rgba(255,255,255,0.04))`,
                    }}
                  >
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Scroll story {index + 1}</p>
                    <p className="mt-4 font-serif text-2xl text-white">
                      {index === 0
                        ? "Your habits become visible."
                        : index === 1
                          ? "Your systems start feeling coherent."
                          : "Your identity becomes part of the interface."}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {ZODIAC_THEMES.slice(index * 4, index * 4 + 4).map((theme) => (
                        <span key={theme.sign} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-white/72">
                          <ZodiacIcon sign={theme.sign} size={18} className="border-0 bg-transparent text-current" />
                          {theme.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-10 rounded-[34px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Interactive sign map", "Choose a sign and watch the product language shift around it."],
            ["Brand-consistent icon pack", "The zodiac icon system is now reusable across landing, settings, and future product surfaces."],
            ["Modern motion language", "Sticky scroll sections and layered depth make the brand feel contemporary and deliberate."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="mt-2 text-sm leading-6 text-white/64">{body}</p>
            </div>
          ))}
        </div>
      </section>

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
