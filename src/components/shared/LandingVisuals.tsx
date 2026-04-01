"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { PillarIcon } from "@/components/shared/PillarIcon";
import { ZodiacIcon } from "@/components/shared/ZodiacIcon";
import { ZODIAC_THEMES, type ZodiacSign } from "@/lib/themes";

const HERO_POINTS = [
  { label: "Discover your sign", copy: "Choose the energy that feels like your next chapter." },
  { label: "See your future style", copy: "Watch the visual world and dashboard attitude shift around it." },
  { label: "Try it for real", copy: "Enter demo mode or request early access when it feels right." },
];

const SIGN_STORIES: Record<ZodiacSign, { title: string; future: string; mood: string; money: string; health: string; life: string }> = {
  aries: {
    title: "Bold momentum",
    future: "Turn urgency into traction and make progress visible fast.",
    mood: "Fast, bright, kinetic",
    money: "Quick captures and confident budgeting cues.",
    health: "Rituals that keep pace with your ambition.",
    life: "Direction that feels decisive, not heavy.",
  },
  taurus: {
    title: "Grounded abundance",
    future: "Build steadiness, comfort, and visible prosperity over time.",
    mood: "Warm, luxe, rooted",
    money: "Budgeting that feels calm and controlled.",
    health: "Routines designed to feel nourishing.",
    life: "A home base that supports consistency.",
  },
  gemini: {
    title: "Adaptive clarity",
    future: "Hold multiple parts of life at once without losing the thread.",
    mood: "Curious, airy, quick",
    money: "Flexible but legible financial flow.",
    health: "Fast check-ins with real signal.",
    life: "A dashboard that moves with your mind.",
  },
  cancer: {
    title: "Protected peace",
    future: "Make care feel easy to return to, even on heavy days.",
    mood: "Soft, lunar, reassuring",
    money: "A gentler view of what supports stability.",
    health: "Medication and sleep stay front and center.",
    life: "Tasks and home details feel held together.",
  },
  leo: {
    title: "Radiant direction",
    future: "Make your daily system feel worthy of your bigger ambitions.",
    mood: "Golden, expressive, warm",
    money: "Progress that feels celebratory.",
    health: "Rituals with presence and pride.",
    life: "A command center with charisma.",
  },
  virgo: {
    title: "Refined order",
    future: "Turn scattered obligations into elegant, useful structure.",
    mood: "Clean, composed, precise",
    money: "Clear categories and visible control.",
    health: "Details are easy to maintain.",
    life: "Every moving part gets a place.",
  },
  libra: {
    title: "Balanced beauty",
    future: "Let discipline and aesthetic taste reinforce each other.",
    mood: "Light, polished, harmonious",
    money: "Budgeting feels intentional, not harsh.",
    health: "A gentle rhythm with strong cues.",
    life: "Everything resolves into one elegant system.",
  },
  scorpio: {
    title: "Quiet transformation",
    future: "Turn private intensity into visible long-term change.",
    mood: "Deep, magnetic, focused",
    money: "Rebuild with precision and control.",
    health: "Rituals support the deeper work.",
    life: "The interface feels intimate and powerful.",
  },
  sagittarius: {
    title: "Expansive motion",
    future: "Keep the big vision alive without dropping the daily systems.",
    mood: "Open, adventurous, bright",
    money: "A view that supports movement and freedom.",
    health: "Routines that flex without disappearing.",
    life: "Direction that still leaves room to roam.",
  },
  capricorn: {
    title: "Measured ascent",
    future: "Make discipline feel like an advantage you can actually see.",
    mood: "Structured, cool, strategic",
    money: "Progress that compounds over time.",
    health: "Steady rituals with visible proof.",
    life: "A system that rewards follow-through.",
  },
  aquarius: {
    title: "Inventive future",
    future: "Build a life system that feels original, expressive, and ahead of its time.",
    mood: "Electric, unusual, crisp",
    money: "Unconventional clarity across the whole picture.",
    health: "Modern routines with strong feedback.",
    life: "A command center for thinkers and builders.",
  },
  pisces: {
    title: "Dream with traction",
    future: "Turn soft intuition into rituals that carry real life forward.",
    mood: "Fluid, luminous, tender",
    money: "Clarity without losing softness.",
    health: "Gentle systems that still hold you accountable.",
    life: "A dashboard that feels compassionate and calm.",
  },
};

const SCENES = [
  {
    eyebrow: "Scene one",
    title: "Pick the future that feels like you.",
    body: "Nova starts as an atmosphere before it becomes a dashboard. Your sign sets the emotional tone, then the product translates that tone into practical structure.",
  },
  {
    eyebrow: "Scene two",
    title: "Watch the interface become a ritual space.",
    body: "Money, health, and life stop feeling like separate chores. They become one visual system with rhythm, momentum, and memory.",
  },
  {
    eyebrow: "Scene three",
    title: "Step into a command center that feels personal.",
    body: "Not just productive. Not just pretty. Something that helps you feel closer to the version of yourself you’re trying to build.",
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
    <div className="relative -mx-5 sm:-mx-6 lg:-mx-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[44rem] opacity-90 blur-3xl transition-all duration-700"
        style={{
          background: `radial-gradient(circle at 18% 24%, ${activeTheme.accent}33, transparent 24%), radial-gradient(circle at 82% 22%, rgba(245,166,35,0.16), transparent 22%), radial-gradient(circle at 50% 68%, rgba(91,184,138,0.12), transparent 22%)`,
        }}
      />

      <section className="relative min-h-[98vh] overflow-hidden border-y border-white/10 bg-[linear-gradient(180deg,rgba(9,11,17,0.96),rgba(6,8,12,0.99))] px-6 py-10 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.75)] sm:px-8 lg:px-10 xl:px-16">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_36%,rgba(255,255,255,0.03)_60%,transparent_82%)]" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, index) => (
            <span
              key={index}
              className="star-pulse absolute rounded-full bg-white/75"
              style={{
                left: `${6 + (index * 4.7) % 90}%`,
                top: `${8 + (index * 7.9) % 78}%`,
                width: `${index % 3 === 0 ? 3 : 2}px`,
                height: `${index % 3 === 0 ? 3 : 2}px`,
                animationDelay: `${index * 0.35}s`,
              }}
            />
          ))}
        </div>
        <div
          className="absolute left-[10%] top-[16%] h-40 w-40 rounded-full blur-3xl transition-all duration-700"
          style={{ backgroundColor: `${activeTheme.accent}26` }}
        />
        <div className="absolute right-[6%] top-[18%] h-56 w-56 rounded-full bg-white/6 blur-3xl" />

        <div className="relative grid min-h-[86vh] gap-10 xl:grid-cols-[0.78fr_1.22fr] xl:items-center">
          <div className="flex max-w-2xl flex-col justify-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-white/46">Zodiac-guided life OS</p>
            <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-[0.9] text-white sm:text-6xl xl:text-[5.5rem]">
              A future-facing dashboard for the person you are becoming.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/68 sm:text-lg">
              Choose a sign. Watch the world shift. Then imagine what money, health, and life could feel like when they finally move together.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {HERO_POINTS.map((item) => (
                <div key={item.label} className="min-w-[12rem] rounded-full border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/42">{item.label}</p>
                  <p className="mt-1 text-sm text-white/70">{item.copy}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/78">
                <PillarIcon pillar="money" size={16} />
                Abundance
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/78">
                <PillarIcon pillar="health" size={16} />
                Vitality
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/78">
                <PillarIcon pillar="life" size={16} />
                Direction
              </span>
            </div>
          </div>

          <div className="relative flex min-h-[40rem] items-center justify-center xl:min-h-[52rem]">
            <div className="absolute inset-y-[12%] left-[6%] w-[18%] rounded-full bg-white/[0.03] blur-3xl" />
            <div className="absolute inset-y-[18%] right-[8%] w-[22%] rounded-full blur-3xl" style={{ backgroundColor: `${activeTheme.accent}14` }} />

            <div className="relative h-[32rem] w-full max-w-[64rem] xl:h-[46rem]">
              <div
                className="constellation-cloud absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 sm:h-[42rem] sm:w-[42rem]"
                style={{
                  background: `radial-gradient(circle, ${activeTheme.accent}16, rgba(255,255,255,0.03) 42%, transparent 66%)`,
                }}
              />
              <div
                className="absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-all duration-700"
                style={{ backgroundColor: `${activeTheme.accent}16` }}
              />
              <div className="absolute left-1/2 top-1/2 h-[74%] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/10" />
              <div className="absolute left-1/2 top-1/2 h-[92%] w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/8" />

              {ZODIAC_THEMES.map((theme, index) => {
                const angle = (index / ZODIAC_THEMES.length) * Math.PI * 2 - Math.PI / 2;
                const radius = 42;
                const x = 50 + Math.cos(angle) * radius;
                const y = 50 + Math.sin(angle) * radius;
                const isActive = theme.sign === activeTheme.sign;
                return (
                  <button
                    key={theme.sign}
                    type="button"
                    onClick={() => setActiveSign(theme.sign)}
                    className={`absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border transition-all duration-300 ${
                      isActive ? "h-16 w-16 scale-110 border-white/30 bg-[#08111d]" : "h-12 w-12 border-white/10 bg-[#09101a]/70 hover:scale-105"
                    }`}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      color: isActive ? theme.accentLight : "rgba(255,255,255,0.82)",
                      boxShadow: isActive ? `0 0 0 1px ${theme.accent}66, 0 0 36px ${theme.accent}33` : `0 0 0 1px ${theme.accent}22`,
                    }}
                    aria-label={`Preview ${theme.name}`}
                  >
                    <ZodiacIcon sign={theme.sign} size={isActive ? 34 : 24} className="border-0 bg-transparent text-current" />
                  </button>
                );
              })}

              <div className="orbit-card absolute left-[4%] top-[14%] w-[13rem] rounded-[28px] border border-white/10 bg-[#0d1420]/84 p-4 shadow-[0_24px_70px_-28px_rgba(0,0,0,0.7)] backdrop-blur-md xl:w-[15rem]">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Money</p>
                <p className="mt-3 font-serif text-3xl text-white">$8,420</p>
                <div className="mt-3 h-16 rounded-2xl bg-white/[0.05] p-3">
                  <div className="h-2 rounded-full" style={{ width: "72%", backgroundColor: activeTheme.accent }} />
                  <div className="mt-3 h-2 rounded-full bg-white/18" style={{ width: "48%" }} />
                  <div className="mt-3 h-2 rounded-full bg-white/12" style={{ width: "83%" }} />
                </div>
              </div>

              <div className="orbit-card absolute right-[2%] top-[24%] w-[12rem] rounded-[28px] border border-white/10 bg-[#0d1420]/84 p-4 shadow-[0_24px_70px_-28px_rgba(0,0,0,0.7)] backdrop-blur-md xl:w-[14rem]">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Health</p>
                <p className="mt-3 font-serif text-3xl text-white">On Track</p>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <span
                      key={index}
                      className="h-6 rounded-xl"
                      style={{ backgroundColor: index < 6 ? `${activeTheme.accent}88` : "rgba(255,255,255,0.12)" }}
                    />
                  ))}
                </div>
              </div>

              <div className="orbit-card absolute bottom-[10%] left-[12%] w-[14rem] rounded-[28px] border border-white/10 bg-[#0d1420]/84 p-4 shadow-[0_24px_70px_-28px_rgba(0,0,0,0.7)] backdrop-blur-md xl:w-[16rem]">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Life</p>
                <p className="mt-3 font-serif text-3xl text-white">{story.title}</p>
                <div className="mt-3 space-y-2">
                  {["Morning ritual", "Money check-in", "Health reset"].map((item, index) => (
                    <div key={item} className="flex items-center gap-2 rounded-2xl bg-white/[0.05] px-3 py-2 text-sm text-white/68">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: index === 0 ? "#4F7CFF" : index === 1 ? "#5BB88A" : "#F5A623" }}
                      />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute left-1/2 top-1/2 z-10 flex h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 flex-col justify-between rounded-[44px] border border-white/12 bg-[#0a1018]/88 p-5 text-center shadow-[0_40px_120px_-40px_rgba(0,0,0,0.78)] sm:h-[21rem] sm:w-[21rem] xl:h-[23rem] xl:w-[23rem]">
                <div className="relative">
                  <Image src="/logo.svg" alt="Nova" width={94} height={94} className="rounded-[26px] shadow-2xl" />
                  <span className="absolute -right-2 -top-2 h-3 w-3 rounded-full bg-[#4F7CFF] shadow-[0_0_20px_rgba(79,124,255,0.8)]" />
                  <span className="absolute -left-3 bottom-5 h-3 w-3 rounded-full bg-[#5BB88A] shadow-[0_0_20px_rgba(91,184,138,0.8)]" />
                  <span className="absolute bottom-1 -right-3 h-3 w-3 rounded-full bg-[#F5A623] shadow-[0_0_20px_rgba(245,166,35,0.8)]" />
                </div>
                <div>
                  <p className="mt-5 text-[11px] uppercase tracking-[0.24em] text-white/42">{activeTheme.name} future mode</p>
                  <p className="mt-2 font-serif text-3xl leading-none text-white">{activeTheme.description}</p>
                  <p className="mt-3 text-sm leading-6 text-white/62">{story.future}</p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-3 text-left">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Dashboard preview</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-white/[0.06] p-3">
                      <p className="text-[10px] text-white/40">Mood</p>
                      <p className="mt-1 text-sm text-white">{story.mood}</p>
                    </div>
                    <div className="rounded-2xl bg-white/[0.06] p-3">
                      <p className="text-[10px] text-white/40">Sign</p>
                      <p className="mt-1 text-sm text-white">{activeTheme.symbol} {activeTheme.name}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="absolute inset-x-[12%] bottom-[6%] h-px bg-gradient-to-r from-transparent via-white/18 to-transparent"
                style={{ opacity: 0.9 }}
              />
            </div>
          </div>
        </div>

        <div className="relative mt-10 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-3">
            {ZODIAC_THEMES.map((theme) => {
              const isActive = theme.sign === activeTheme.sign;
              return (
                <button
                  key={theme.sign}
                  type="button"
                  onClick={() => setActiveSign(theme.sign)}
                  className={`inline-flex items-center gap-3 rounded-full border px-4 py-3 text-left transition-all ${
                    isActive ? "border-white/24 bg-white/10 text-white" : "border-white/10 bg-white/[0.04] text-white/68 hover:bg-white/[0.07]"
                  }`}
                >
                  <ZodiacIcon sign={theme.sign} size={24} className="border-0 bg-transparent text-current" />
                  <span>
                    <span className="block text-sm font-medium">{theme.name}</span>
                    <span className="block text-xs opacity-70">{theme.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-16 space-y-10">
        {SCENES.map((scene, index) => (
          <div key={scene.title} className="relative min-h-screen">
            <div className="sticky top-0 flex min-h-screen items-center">
              <div className="grid w-full gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <div className="scene-copy px-2 lg:px-6">
                  <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-white/38">
                    <ZodiacIcon sign={activeTheme.sign} size={18} className="border-0 bg-transparent text-white/55" />
                    {scene.eyebrow}
                  </div>
                  <h3 className="mt-5 max-w-xl font-serif text-4xl leading-[1] text-white sm:text-5xl xl:text-6xl">{scene.title}</h3>
                  <p className="mt-6 max-w-lg text-lg leading-8 text-white/64">{scene.body}</p>
                </div>

                <div className="scene-visual relative min-h-[32rem] overflow-hidden rounded-[42px] bg-[linear-gradient(180deg,rgba(12,16,24,0.92),rgba(8,10,15,0.98))] p-6 sm:min-h-[38rem] sm:p-8">
                  <div
                    className="absolute inset-0 opacity-90"
                    style={{
                      background:
                        index === 0
                          ? `radial-gradient(circle at 20% 25%, ${activeTheme.accent}28, transparent 22%), radial-gradient(circle at 78% 68%, rgba(255,255,255,0.08), transparent 24%)`
                          : index === 1
                            ? "radial-gradient(circle at 30% 30%, rgba(91,184,138,0.24), transparent 24%), radial-gradient(circle at 76% 56%, rgba(79,124,255,0.18), transparent 22%)"
                            : "radial-gradient(circle at 18% 68%, rgba(245,166,35,0.22), transparent 24%), radial-gradient(circle at 82% 24%, rgba(255,255,255,0.08), transparent 22%)",
                    }}
                  />

                  {index === 0 && (
                    <div className="relative h-full">
                      <div className="absolute left-[6%] top-[8%] w-[44%] rounded-[28px] bg-white/[0.05] p-5 backdrop-blur-md">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Before</p>
                        <p className="mt-3 font-serif text-3xl text-white/88">Scattered</p>
                        <p className="mt-2 text-sm leading-6 text-white/58">Too many apps. Too many tabs. Too many broken routines.</p>
                      </div>
                      <div className="absolute bottom-[10%] right-[8%] w-[48%] rounded-[28px] bg-white/[0.08] p-5 backdrop-blur-md">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">After</p>
                        <p className="mt-3 font-serif text-3xl text-white">Aligned</p>
                        <p className="mt-2 text-sm leading-6 text-white/64">One calm system that keeps money, health, and life moving together.</p>
                      </div>
                      <div className="absolute left-1/2 top-1/2 h-px w-[42%] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/28 to-transparent" />
                    </div>
                  )}

                  {index === 1 && (
                    <div className="relative flex h-full items-center justify-center">
                      <div className="grid w-full max-w-[34rem] gap-4 md:grid-cols-3">
                        {[
                          ["Money", "$8,420", "Expenses and wins stay visible."],
                          ["Health", "On Track", "Rituals become easier to repeat."],
                          ["Life", "4 Open", "Tasks and direction sit in the same frame."],
                        ].map(([label, value, desc], cardIndex) => (
                          <div
                            key={label}
                            className="rounded-[30px] bg-white/[0.06] p-5 backdrop-blur-md"
                            style={{ transform: `translateY(${cardIndex % 2 === 0 ? "-10px" : "18px"})` }}
                          >
                            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">{label}</p>
                            <p className="mt-4 font-serif text-3xl text-white">{value}</p>
                            <p className="mt-3 text-sm leading-6 text-white/62">{desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {index === 2 && (
                    <div className="relative flex h-full items-center justify-center">
                      <div className="grid w-full max-w-[38rem] gap-3 sm:grid-cols-4">
                        {ZODIAC_THEMES.slice(0, 8).map((theme, themeIndex) => (
                          <div
                            key={theme.sign}
                            className="rounded-[26px] bg-white/[0.05] p-4 text-center backdrop-blur-md"
                            style={{ transform: `translateY(${themeIndex % 2 === 0 ? "0px" : "16px"})` }}
                          >
                            <div className="mx-auto flex w-fit justify-center rounded-full" style={{ color: theme.accentLight }}>
                              <ZodiacIcon sign={theme.sign} size={32} className="border-0 bg-transparent text-current" />
                            </div>
                            <p className="mt-3 text-sm font-medium text-white">{theme.name}</p>
                            <p className="mt-1 text-xs text-white/54">{theme.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-12 rounded-[40px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Interactive sign system", "The zodiac layer now feels like a graphic interface, not a text picker."],
            ["Product visuals first", "The page leans on visual scenes and mock interfaces instead of over-explaining itself."],
            ["Motion-led branding", "Transitions, depth, and orbiting surfaces push the brand closer to a premium launch site."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-[28px] bg-white/[0.05] p-5">
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="mt-3 text-sm leading-6 text-white/62">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .constellation-cloud {
          animation: orbitPulse 8s ease-in-out infinite;
        }

        .orbit-card {
          animation: orbitFloat 7s ease-in-out infinite;
        }

        .orbit-card:nth-child(2) {
          animation-delay: -1.4s;
        }

        .orbit-card:nth-child(3) {
          animation-delay: -2.3s;
        }

        .zodiac-wheel {
          animation: zodiacFloat 9s ease-in-out infinite;
        }

        @keyframes zodiacFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-10px) scale(1.01); }
        }

        @keyframes orbitFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }

        @keyframes orbitPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(0.98); opacity: 0.88; }
          50% { transform: translate(-50%, -50%) scale(1.02); opacity: 1; }
        }

        .star-pulse {
          animation: starPulse 4.8s ease-in-out infinite;
        }

        .scene-copy {
          animation: sceneFade 1s ease both;
        }

        .scene-visual {
          animation: sceneDrift 1.1s ease both;
        }

        @keyframes starPulse {
          0%, 100% { opacity: 0.25; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.15); }
        }

        @keyframes sceneFade {
          from { opacity: 0.35; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes sceneDrift {
          from { opacity: 0.3; transform: translateY(30px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
