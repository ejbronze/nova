"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { WeatherWidget } from "@/components/shared/WeatherWidget";
import { db } from "@/lib/db";
import { ZODIAC_THEMES, type BentoLayout } from "@/lib/themes";
import { useAppStore } from "@/lib/store";
import { formatCurrency, getCategoryEmoji, getGreeting, getDaysUntilDue, todayStr } from "@/lib/utils";

const MOOD_EMOJI = ["", "😞", "😕", "😐", "🙂", "😊"];
const MOOD_LABEL = ["", "Low", "Meh", "Okay", "Good", "Great"];

const LAYOUT_SPANS: Record<BentoLayout, { hero: string; money: string; health: string; life: string }> = {
  balanced: {
    hero: "xl:col-span-7",
    money: "xl:col-span-4",
    health: "xl:col-span-4",
    life: "xl:col-span-4",
  },
  "money-dominant": {
    hero: "xl:col-span-8",
    money: "xl:col-span-5",
    health: "xl:col-span-4",
    life: "xl:col-span-3",
  },
  "health-dominant": {
    hero: "xl:col-span-7",
    money: "xl:col-span-3",
    health: "xl:col-span-5",
    life: "xl:col-span-4",
  },
};

const panelBase =
  "group relative overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.35)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_70px_-32px_rgba(15,23,42,0.45)]";

export default function HomePage() {
  const { settings } = useAppStore();
  const today = todayStr();

  const recentTx = useLiveQuery(() => db.transactions.orderBy("date").reverse().limit(6).toArray(), []);
  const bills = useLiveQuery(() => db.bills.toArray(), []);
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const todayLog = useLiveQuery(() => db.healthLogs.get({ date: today }), [today]);
  const tasks = useLiveQuery(() => db.tasks.where("completed").equals(0).toArray(), []);
  const debts = useLiveQuery(() => db.debts.toArray(), []);
  const allTx = useLiveQuery(
    () => db.transactions.where("date").startsWith(new Date().toISOString().slice(0, 7)).toArray(),
    [],
  );

  const cur = settings?.primaryCurrency ?? "USD";
  const rate = settings?.dopRate ?? 59.5;
  const cv = (amount: number, from: "USD" | "DOP") =>
    from === cur ? amount : cur === "USD" ? amount / rate : amount * rate;

  const totalBalance = (accounts ?? []).reduce((sum, account) => sum + cv(account.balance, account.currency), 0);
  const income = (allTx ?? [])
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + cv(tx.amount, tx.currency), 0);
  const spent = (allTx ?? [])
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + cv(tx.amount, tx.currency), 0);
  const totalDebt = (debts ?? []).reduce((sum, debt) => sum + cv(debt.currentBalance, debt.currency), 0);

  const upcomingBills = (bills ?? [])
    .filter((bill) => bill.status !== "paid")
    .sort((a, b) => getDaysUntilDue(a.dueDay) - getDaysUntilDue(b.dueDay))
    .slice(0, 4);

  const openTasks = (tasks ?? []).filter((task) => !task.completed);
  const overdueTasks = openTasks.filter((task) => task.dueDate && task.dueDate < today);

  const theme = ZODIAC_THEMES.find((entry) => entry.sign === settings?.zodiacTheme);
  const layout = theme?.layout ?? "balanced";
  const spans = LAYOUT_SPANS[layout];

  const savings = income - spent;
  const completionCount = [todayLog?.hivMed, todayLog?.adderall, todayLog?.weed].filter(Boolean).length;
  const moodValue = todayLog?.mood ? `${MOOD_EMOJI[todayLog.mood]} ${MOOD_LABEL[todayLog.mood]}` : "No mood logged";
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="animate-fadeIn relative select-none">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 rounded-[36px] bg-[radial-gradient(circle_at_top_left,rgba(79,124,255,0.16),transparent_48%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_40%)]" />

      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-nova-hint">
            Personal Command Center
          </p>
          <h1 className="font-serif text-4xl leading-none text-nova-text">{getGreeting()}</h1>
          <p className="mt-2 max-w-2xl text-sm text-nova-muted">
            A cleaner read on your finances, routines, and loose ends, arranged in one sleek bento board.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1.5 font-medium text-nova-muted shadow-sm backdrop-blur-sm">
            {dateLabel}
          </span>
          <span className="rounded-full border border-health/20 bg-health/10 px-3 py-1.5 font-medium text-health">
            {completionCount}/3 daily rituals logged
          </span>
          {theme && (
            <span
              className="rounded-full px-3 py-1.5 font-medium shadow-sm"
              style={{ backgroundColor: theme.accentLight, color: theme.accent }}
            >
              {theme.symbol} {theme.name} mode
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12">
        <section className={`${panelBase} md:col-span-6 ${spans.hero}`}>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.28),transparent_55%)]" />
          <div
            className="absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl"
            style={{ backgroundColor: theme?.accentLight ?? "rgba(79,124,255,0.18)" }}
          />
          <div className="relative flex h-full flex-col justify-between p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="rounded-full border border-white/80 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-nova-hint">
                  Overview
                </span>
                <h2 className="mt-4 max-w-xl font-serif text-3xl leading-tight text-nova-text sm:text-[2.4rem]">
                  Your week at a glance, without the spreadsheet energy.
                </h2>
              </div>

              <Link
                href="/settings"
                className="rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-nova-muted transition-all hover:text-nova-text"
              >
                Tune the vibe
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-white/80 bg-white/75 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-nova-hint">Net worth</p>
                <p className="mt-3 font-serif text-3xl text-nova-text">{formatCurrency(totalBalance, cur)}</p>
                <p className="mt-2 text-xs text-nova-muted">
                  {savings >= 0 ? "Monthly surplus" : "Monthly burn"} {formatCurrency(Math.abs(savings), cur)}
                </p>
              </div>

              <div className="rounded-[22px] border border-white/80 bg-white/75 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-nova-hint">Health pulse</p>
                <p className="mt-3 text-lg font-semibold text-nova-text">
                  {todayLog ? (todayLog.hivMed && todayLog.adderall ? "On track today" : "Needs a check-in") : "No log yet"}
                </p>
                <p className="mt-2 text-xs text-nova-muted">{moodValue}</p>
              </div>

              <div className="rounded-[22px] border border-white/80 bg-white/75 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-nova-hint">Life admin</p>
                <p className="mt-3 text-lg font-semibold text-nova-text">
                  {openTasks.length} active task{openTasks.length === 1 ? "" : "s"}
                </p>
                <p className="mt-2 text-xs text-nova-muted">
                  {overdueTasks.length ? `${overdueTasks.length} overdue and ready for cleanup` : "Nothing overdue right now"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="md:col-span-3 xl:col-span-5">
          <WeatherWidget />
        </div>

        <Link href="/money" className={`md:col-span-3 ${spans.money}`}>
          <article className={`${panelBase} h-full min-h-[250px]`}>
            <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(16,185,129,0.08),transparent_65%)]" />
            <div className="relative flex h-full flex-col justify-between p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-money">Money</p>
                  <p className="mt-3 font-serif text-4xl leading-none text-nova-text">{formatCurrency(totalBalance, cur)}</p>
                  <p className="mt-2 text-sm text-nova-muted">Liquid picture across all accounts</p>
                </div>
                <span className="rounded-full bg-money/10 px-2.5 py-1 text-xs font-medium text-money">Open</span>
              </div>

              <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-2xl bg-nova-bg/80 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-nova-hint">Income</p>
                  <p className="mt-1 font-semibold text-health">{formatCurrency(income, cur)}</p>
                </div>
                <div className="rounded-2xl bg-nova-bg/80 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-nova-hint">Spent</p>
                  <p className="mt-1 font-semibold text-nova-text">{formatCurrency(spent, cur)}</p>
                </div>
                <div className="rounded-2xl bg-nova-bg/80 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-nova-hint">Debt</p>
                  <p className="mt-1 font-semibold text-danger">{formatCurrency(totalDebt, cur)}</p>
                </div>
              </div>
            </div>
          </article>
        </Link>

        <Link href="/health" className={`md:col-span-3 ${spans.health}`}>
          <article className={`${panelBase} h-full min-h-[250px]`}>
            <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(34,197,94,0.08),transparent_65%)]" />
            <div className="relative flex h-full flex-col justify-between p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-health">Health</p>
                  <p className="mt-3 font-serif text-4xl leading-none text-nova-text">
                    {todayLog ? (todayLog.hivMed && todayLog.adderall ? "On track" : "Check in") : "Not logged"}
                  </p>
                  <p className="mt-2 text-sm text-nova-muted">Medication, mood, and recovery in one glance</p>
                </div>
                <span className="rounded-full bg-health/10 px-2.5 py-1 text-xs font-medium text-health">Today</span>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-nova-bg/80 px-3 py-2 text-sm">
                  <span className="text-nova-muted">Mood</span>
                  <span className="font-medium text-nova-text">{moodValue}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-nova-bg/80 px-3 py-2 text-sm">
                  <span className="text-nova-muted">Sleep</span>
                  <span className="font-medium text-nova-text">
                    {todayLog?.sleep != null ? `${todayLog.sleep}h` : "No sleep logged"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["hivMed", "adderall", "weed"] as const).map((key) => (
                    <span
                      key={key}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        todayLog?.[key] ? "bg-health/12 text-health" : "bg-nova-bg text-nova-muted"
                      }`}
                    >
                      {key === "hivMed" ? "HIV Med" : key === "adderall" ? "Adderall" : "Cannabis"}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>
        </Link>

        <Link href="/life" className={`md:col-span-6 ${spans.life}`}>
          <article className={`${panelBase} h-full min-h-[250px]`}>
            <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(251,146,60,0.08),transparent_65%)]" />
            <div className="relative flex h-full flex-col justify-between p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-life">Life</p>
                  <p className="mt-3 font-serif text-4xl leading-none text-nova-text">{openTasks.length}</p>
                  <p className="mt-2 text-sm text-nova-muted">Open task{openTasks.length === 1 ? "" : "s"} across life admin</p>
                </div>
                <span className="rounded-full bg-life/10 px-2.5 py-1 text-xs font-medium text-life">Focus</span>
              </div>

              <div className="mt-6 space-y-2">
                {overdueTasks.length > 0 && (
                  <div className="flex items-center justify-between rounded-2xl border border-danger/15 bg-danger/6 px-3 py-2 text-sm">
                    <span className="text-danger">Overdue items</span>
                    <span className="font-semibold text-danger">{overdueTasks.length}</span>
                  </div>
                )}
                {openTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center gap-3 rounded-2xl bg-nova-bg/80 px-3 py-2 text-sm">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        task.priority === "high" ? "bg-danger" : task.priority === "medium" ? "bg-life" : "bg-nova-muted"
                      }`}
                    />
                    <span className="min-w-0 flex-1 truncate font-medium text-nova-text">{task.title}</span>
                    <span className="text-xs text-nova-muted">{task.category}</span>
                  </div>
                ))}
                {!openTasks.length && (
                  <div className="rounded-2xl bg-nova-bg/80 px-3 py-3 text-sm text-nova-muted">
                    All clear. The board is quiet.
                  </div>
                )}
              </div>
            </div>
          </article>
        </Link>

        <Link href="/money" className="md:col-span-6 xl:col-span-7">
          <article className={`${panelBase} h-full min-h-[320px]`}>
            <div className="relative flex h-full flex-col p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-nova-hint">Transaction feed</p>
                  <h3 className="mt-2 text-lg font-semibold text-nova-text">Recent movement</h3>
                </div>
                <span className="rounded-full bg-nova-bg px-2.5 py-1 text-xs font-medium text-nova-muted">This month</span>
              </div>

              <div className="space-y-2">
                {(recentTx ?? []).slice(0, 5).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 rounded-[22px] border border-black/5 bg-nova-bg/70 px-3 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-lg shadow-sm">
                        {getCategoryEmoji(tx.category)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-nova-text">{tx.description}</p>
                        <p className="text-xs text-nova-muted">{tx.category} · {tx.date}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 text-sm font-semibold ${tx.type === "income" ? "text-health" : "text-nova-text"}`}>
                      {tx.type === "income" ? "+" : "−"}
                      {formatCurrency(tx.amount, tx.currency)}
                    </span>
                  </div>
                ))}
                {!(recentTx?.length) && (
                  <div className="rounded-[22px] bg-nova-bg/80 px-4 py-10 text-center text-sm text-nova-muted">
                    No transactions yet.
                  </div>
                )}
              </div>
            </div>
          </article>
        </Link>

        <Link href="/money" className="md:col-span-6 xl:col-span-5">
          <article className={`${panelBase} h-full min-h-[320px]`}>
            <div className="relative flex h-full flex-col p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-nova-hint">Bills radar</p>
                  <h3 className="mt-2 text-lg font-semibold text-nova-text">Upcoming obligations</h3>
                </div>
                <span className="rounded-full bg-nova-bg px-2.5 py-1 text-xs font-medium text-nova-muted">
                  {upcomingBills.length} queued
                </span>
              </div>

              <div className="space-y-2">
                {upcomingBills.slice(0, 4).map((bill) => {
                  const days = getDaysUntilDue(bill.dueDay);
                  return (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between gap-3 rounded-[22px] border border-black/5 bg-nova-bg/70 px-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-nova-text">{bill.name}</p>
                        <p className="text-xs text-nova-muted">{bill.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-nova-text">{formatCurrency(bill.amount, bill.currency)}</p>
                        <span
                          className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            days <= 3 ? "bg-danger/10 text-danger" : "bg-white text-nova-muted"
                          }`}
                        >
                          {days === 0 ? "Due today" : `${days} days`}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {!upcomingBills.length && (
                  <div className="rounded-[22px] bg-nova-bg/80 px-4 py-10 text-center text-sm text-nova-muted">
                    No upcoming bills. Quiet money week.
                  </div>
                )}
              </div>
            </div>
          </article>
        </Link>
      </div>
    </div>
  );
}
