"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { PillarLabel } from "@/components/shared/PillarIcon";
import { WeatherWidget } from "@/components/shared/WeatherWidget";
import { db } from "@/lib/db";
import { ZODIAC_THEMES } from "@/lib/themes";
import { useAppStore } from "@/lib/store";
import { formatCurrency, getCategoryEmoji, getGreeting, getDaysUntilDue, todayStr } from "@/lib/utils";
import type { DashboardCardSize } from "@/types";
import { GripVertical } from "lucide-react";

const MOOD_EMOJI = ["", "😞", "😕", "😐", "🙂", "😊"];
const MOOD_LABEL = ["", "Low", "Meh", "Okay", "Good", "Great"];
const DEFAULT_CARD_ORDER = ["summary", "weather", "money", "health", "life", "transactions", "bills"] as const;
type DashboardCardId = (typeof DEFAULT_CARD_ORDER)[number];
type DashboardCardSizeMap = Record<DashboardCardId, DashboardCardSize>;

const tileBase =
  "group relative overflow-hidden rounded-2xl border border-nova-border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md";
const SIZE_OPTIONS: DashboardCardSize[] = ["small", "medium", "large"];
const DEFAULT_CARD_SIZES: DashboardCardSizeMap = {
  summary: "large",
  weather: "medium",
  money: "medium",
  health: "medium",
  life: "medium",
  transactions: "large",
  bills: "medium",
};

const SIZE_LABELS: Record<DashboardCardSize, string> = {
  small: "S",
  medium: "M",
  large: "L",
};

function getNextCardSize(size: DashboardCardSize): DashboardCardSize {
  if (size === "small") return "medium";
  if (size === "medium") return "large";
  return "small";
}

function formatSleep(value?: number) {
  if (value == null || Number.isNaN(value)) return "No sleep logged";
  const totalMinutes = Math.round(value * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!minutes) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function orderCards(order?: string[]) {
  const valid = (order ?? []).filter((id): id is DashboardCardId =>
    (DEFAULT_CARD_ORDER as readonly string[]).includes(id),
  );
  const missing = DEFAULT_CARD_ORDER.filter((id) => !valid.includes(id));
  return [...valid, ...missing];
}

function moveCard(order: DashboardCardId[], fromId: DashboardCardId, toId: DashboardCardId) {
  if (fromId === toId) return order;
  const next = [...order];
  const fromIndex = next.indexOf(fromId);
  const toIndex = next.indexOf(toId);
  if (fromIndex === -1 || toIndex === -1) return order;
  next.splice(fromIndex, 1);
  next.splice(toIndex, 0, fromId);
  return next;
}

function normalizeCardSizes(cardSizes?: Record<string, DashboardCardSize>): DashboardCardSizeMap {
  const next = { ...DEFAULT_CARD_SIZES };
  for (const cardId of DEFAULT_CARD_ORDER) {
    const value = cardSizes?.[cardId];
    if (value === "small" || value === "medium" || value === "large") {
      next[cardId] = value;
    }
  }
  return next;
}

function getCardSpan(cardId: DashboardCardId, size: DashboardCardSize) {
  const scale: Record<DashboardCardId, Record<DashboardCardSize, string>> = {
    summary: {
      small: "md:col-span-6 xl:col-span-4",
      medium: "md:col-span-6 xl:col-span-5",
      large: "md:col-span-6 xl:col-span-6",
    },
    money: {
      small: "md:col-span-3 xl:col-span-2",
      medium: "md:col-span-3 xl:col-span-3",
      large: "md:col-span-6 xl:col-span-6",
    },
    health: {
      small: "md:col-span-3 xl:col-span-2",
      medium: "md:col-span-3 xl:col-span-3",
      large: "md:col-span-6 xl:col-span-6",
    },
    life: {
      small: "md:col-span-3 xl:col-span-2",
      medium: "md:col-span-6 xl:col-span-3",
      large: "md:col-span-6 xl:col-span-6",
    },
    weather: {
      small: "md:col-span-3 xl:col-span-2",
      medium: "md:col-span-3 xl:col-span-2",
      large: "md:col-span-6 xl:col-span-3",
    },
    transactions: {
      small: "md:col-span-6 xl:col-span-3",
      medium: "md:col-span-6 xl:col-span-4",
      large: "md:col-span-6 xl:col-span-6",
    },
    bills: {
      small: "md:col-span-6 xl:col-span-3",
      medium: "md:col-span-6 xl:col-span-3",
      large: "md:col-span-6 xl:col-span-6",
    },
  };

  return scale[cardId][size];
}

function getCardHeight(cardId: DashboardCardId, size: DashboardCardSize) {
  const heights: Record<DashboardCardId, Record<DashboardCardSize, string>> = {
    summary: { small: "min-h-[160px]", medium: "min-h-[180px]", large: "min-h-[210px]" },
    weather: { small: "min-h-[160px]", medium: "min-h-[180px]", large: "min-h-[200px]" },
    money: { small: "min-h-[165px]", medium: "min-h-[185px]", large: "min-h-[215px]" },
    health: { small: "min-h-[165px]", medium: "min-h-[185px]", large: "min-h-[215px]" },
    life: { small: "min-h-[165px]", medium: "min-h-[185px]", large: "min-h-[215px]" },
    transactions: { small: "min-h-[220px]", medium: "min-h-[250px]", large: "min-h-[270px]" },
    bills: { small: "min-h-[220px]", medium: "min-h-[240px]", large: "min-h-[270px]" },
  };

  return heights[cardId][size];
}

export default function HomePage() {
  const { settings, setDashboardCardOrder, setDashboardCardSizes } = useAppStore();
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

  const [isArrangeMode, setIsArrangeMode] = useState(false);
  const [draggingId, setDraggingId] = useState<DashboardCardId | null>(null);
  const [cardOrder, setCardOrder] = useState<DashboardCardId[]>(() => [...DEFAULT_CARD_ORDER]);
  const [cardSizes, setCardSizes] = useState<DashboardCardSizeMap>(DEFAULT_CARD_SIZES);

  useEffect(() => {
    setCardOrder(orderCards(settings?.dashboardCardOrder));
  }, [settings?.dashboardCardOrder]);

  useEffect(() => {
    setCardSizes(normalizeCardSizes(settings?.dashboardCardSizes));
  }, [settings?.dashboardCardSizes]);

  const cur = settings?.primaryCurrency ?? "USD";
  const rate = settings?.dopRate ?? 59.5;
  const convert = (amount: number, from: "USD" | "DOP") =>
    from === cur ? amount : cur === "USD" ? amount / rate : amount * rate;

  const totalBalance = (accounts ?? []).reduce((sum, account) => sum + convert(account.balance, account.currency), 0);
  const income = (allTx ?? [])
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + convert(tx.amount, tx.currency), 0);
  const spent = (allTx ?? [])
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + convert(tx.amount, tx.currency), 0);
  const totalDebt = (debts ?? []).reduce((sum, debt) => sum + convert(debt.currentBalance, debt.currency), 0);

  const upcomingBills = (bills ?? [])
    .filter((bill) => bill.status !== "paid")
    .sort((a, b) => getDaysUntilDue(a.dueDay) - getDaysUntilDue(b.dueDay))
    .slice(0, 4);

  const openTasks = (tasks ?? []).filter((task) => !task.completed);
  const overdueTasks = openTasks.filter((task) => task.dueDate && task.dueDate < today);

  const theme = ZODIAC_THEMES.find((entry) => entry.sign === settings?.zodiacTheme);

  const completionCount = [todayLog?.hivMed, todayLog?.adderall, todayLog?.weed].filter(Boolean).length;
  const moodValue = todayLog?.mood ? `${MOOD_EMOJI[todayLog.mood]} ${MOOD_LABEL[todayLog.mood]}` : "No mood logged";
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const persistOrder = async (nextOrder: DashboardCardId[]) => {
    setCardOrder(nextOrder);
    await setDashboardCardOrder(nextOrder);
  };

  const persistSizes = async (nextSizes: DashboardCardSizeMap) => {
    setCardSizes(nextSizes);
    await setDashboardCardSizes(nextSizes);
  };

  const resetDashboardLayout = async () => {
    setDraggingId(null);
    setCardOrder([...DEFAULT_CARD_ORDER]);
    setCardSizes(DEFAULT_CARD_SIZES);
    await Promise.all([
      setDashboardCardOrder([...DEFAULT_CARD_ORDER]),
      setDashboardCardSizes(DEFAULT_CARD_SIZES),
    ]);
  };

  const cards = useMemo(() => {
    const summary = (
      <section className={`${tileBase} ${getCardHeight("summary", cardSizes.summary)} ${getCardSpan("summary", cardSizes.summary)}`}>
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-nova-hint">Dashboard</p>
              <p className="mt-1 text-sm text-nova-muted">Compact snapshot of money, health, and life.</p>
            </div>
            <Link href="/settings" className="text-xs font-medium text-theme-accent hover:underline">
              Settings
            </Link>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl bg-nova-bg px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-nova-hint">Net worth</p>
              <p className="mt-1 font-serif text-2xl text-nova-text">{formatCurrency(totalBalance, cur)}</p>
              <p className="mt-1 text-xs text-nova-muted">{income - spent >= 0 ? "Ahead this month" : "Behind this month"}</p>
            </div>
            <div className="rounded-xl bg-nova-bg px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-nova-hint">
                <PillarLabel pillar="health" iconSize={14}>Health</PillarLabel>
              </p>
              <p className="mt-1 text-sm font-semibold text-nova-text">
                {todayLog ? (todayLog.hivMed && todayLog.adderall ? "On track" : "Check in") : "Not logged"}
              </p>
              <p className="mt-1 text-xs text-nova-muted">{moodValue}</p>
            </div>
            <div className="rounded-xl bg-nova-bg px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-nova-hint">
                <PillarLabel pillar="life" iconSize={14}>Life</PillarLabel>
              </p>
              <p className="mt-1 text-sm font-semibold text-nova-text">
                {openTasks.length} open task{openTasks.length === 1 ? "" : "s"}
              </p>
              <p className="mt-1 text-xs text-nova-muted">
                {overdueTasks.length ? `${overdueTasks.length} overdue` : "Nothing overdue"}
              </p>
            </div>
          </div>
        </div>
      </section>
    );

    const weather = (
      <div className={getCardSpan("weather", cardSizes.weather)}>
        <WeatherWidget />
      </div>
    );

    const money = (
      <Link href="/money" className={getCardSpan("money", cardSizes.money)}>
        <article className={`${tileBase} h-full ${getCardHeight("money", cardSizes.money)}`}>
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-money">
                <PillarLabel pillar="money" iconSize={14}>Money</PillarLabel>
              </p>
              <span className="text-xs text-nova-muted opacity-0 transition-opacity group-hover:opacity-100">Open</span>
            </div>
            <p className="font-serif text-[2rem] leading-none text-nova-text">{formatCurrency(totalBalance, cur)}</p>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-nova-bg px-3 py-2">
                <span className="text-nova-muted">Income</span>
                <span className="font-medium text-health">{formatCurrency(income, cur)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-nova-bg px-3 py-2">
                <span className="text-nova-muted">Spent</span>
                <span className="font-medium text-nova-text">{formatCurrency(spent, cur)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-nova-bg px-3 py-2">
                <span className="text-nova-muted">Debt</span>
                <span className="font-medium text-danger">{formatCurrency(totalDebt, cur)}</span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    );

    const health = (
      <Link href="/health" className={getCardSpan("health", cardSizes.health)}>
        <article className={`${tileBase} h-full ${getCardHeight("health", cardSizes.health)}`}>
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-health">
                <PillarLabel pillar="health" iconSize={14}>Health</PillarLabel>
              </p>
              <span className="text-xs text-nova-muted opacity-0 transition-opacity group-hover:opacity-100">Open</span>
            </div>
            <p className="font-serif text-[2rem] leading-none text-nova-text">
              {todayLog ? (todayLog.hivMed && todayLog.adderall ? "On track" : "Check in") : "Not logged"}
            </p>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-nova-bg px-3 py-2">
                <span className="text-nova-muted">Mood</span>
                <span className="font-medium text-nova-text">{moodValue}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-nova-bg px-3 py-2">
                <span className="text-nova-muted">Sleep</span>
                <span className="font-medium text-nova-text">{formatSleep(todayLog?.sleep)}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(["hivMed", "adderall", "weed"] as const).map((key) => (
                  <span
                    key={key}
                    className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                      todayLog?.[key] ? "bg-health/10 text-health" : "bg-nova-bg text-nova-muted"
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
    );

    const life = (
      <Link href="/life" className={getCardSpan("life", cardSizes.life)}>
        <article className={`${tileBase} h-full ${getCardHeight("life", cardSizes.life)}`}>
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-life">
                <PillarLabel pillar="life" iconSize={14}>Life</PillarLabel>
              </p>
              <span className="text-xs text-nova-muted opacity-0 transition-opacity group-hover:opacity-100">Open</span>
            </div>
            <p className="font-serif text-[2rem] leading-none text-nova-text">{openTasks.length}</p>
            <p className="mt-1 text-xs text-nova-muted">Open task{openTasks.length === 1 ? "" : "s"}</p>
            <div className="mt-4 space-y-2 text-xs">
              {overdueTasks.length > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-danger/8 px-3 py-2">
                  <span className="text-danger">Overdue</span>
                  <span className="font-medium text-danger">{overdueTasks.length}</span>
                </div>
              )}
              {openTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center gap-2 rounded-xl bg-nova-bg px-3 py-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      task.priority === "high" ? "bg-danger" : task.priority === "medium" ? "bg-life" : "bg-nova-muted"
                    }`}
                  />
                  <span className="min-w-0 flex-1 truncate font-medium text-nova-text">{task.title}</span>
                  <span className="text-nova-muted">{task.category}</span>
                </div>
              ))}
              {!openTasks.length && <div className="rounded-xl bg-nova-bg px-3 py-3 text-nova-muted">All clear.</div>}
            </div>
          </div>
        </article>
      </Link>
    );

    const transactions = (
      <Link href="/money" className={getCardSpan("transactions", cardSizes.transactions)}>
        <article className={`${tileBase} h-full ${getCardHeight("transactions", cardSizes.transactions)}`}>
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-nova-hint">Transactions</p>
                <p className="mt-1 text-sm font-medium text-nova-text">Recent activity</p>
              </div>
              <span className="text-xs text-nova-muted">This month</span>
            </div>
            <div className="space-y-2">
              {(recentTx ?? []).slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between gap-3 rounded-xl bg-nova-bg px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-base shadow-sm">
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
              {!(recentTx?.length) && <div className="rounded-xl bg-nova-bg px-4 py-8 text-center text-sm text-nova-muted">No transactions yet.</div>}
            </div>
          </div>
        </article>
      </Link>
    );

    const billCards = (
      <Link href="/money" className={getCardSpan("bills", cardSizes.bills)}>
        <article className={`${tileBase} h-full ${getCardHeight("bills", cardSizes.bills)}`}>
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-nova-hint">Bills</p>
                <p className="mt-1 text-sm font-medium text-nova-text">Upcoming</p>
              </div>
              <span className="text-xs text-nova-muted">{upcomingBills.length} items</span>
            </div>
            <div className="space-y-2">
              {upcomingBills.slice(0, 4).map((bill) => {
                const days = getDaysUntilDue(bill.dueDay);
                return (
                  <div key={bill.id} className="flex items-center justify-between gap-3 rounded-xl bg-nova-bg px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-nova-text">{bill.name}</p>
                      <p className="text-xs text-nova-muted">{bill.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-nova-text">{formatCurrency(bill.amount, bill.currency)}</p>
                      <span className={`text-[10px] font-medium ${days <= 3 ? "text-danger" : "text-nova-muted"}`}>
                        {days === 0 ? "Due today" : `${days} days`}
                      </span>
                    </div>
                  </div>
                );
              })}
              {!upcomingBills.length && <div className="rounded-xl bg-nova-bg px-4 py-8 text-center text-sm text-nova-muted">No upcoming bills.</div>}
            </div>
          </div>
        </article>
      </Link>
    );

    return {
      summary,
      weather,
      money,
      health,
      life,
      transactions,
      bills: billCards,
    } satisfies Record<DashboardCardId, JSX.Element>;
  }, [
    cur,
    cardSizes,
    income,
    moodValue,
    openTasks,
    overdueTasks,
    recentTx,
    spent,
    theme,
    todayLog,
    totalBalance,
    totalDebt,
    upcomingBills,
  ]);

  return (
    <div className="animate-fadeIn">
      <section className="overflow-hidden rounded-[28px] border border-nova-border bg-white shadow-[0_18px_48px_-28px_rgba(15,23,42,0.28)]">
        <div className="border-b border-nova-border bg-[linear-gradient(180deg,#ffffff_0%,#fbfbf9_100%)] px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[12px] font-medium text-nova-muted">{dateLabel}</p>
              <h1 className="mt-1 font-serif text-[2rem] leading-none text-nova-text">{getGreeting()}</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <button
                onClick={() => setIsArrangeMode((value) => !value)}
                className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                  isArrangeMode ? "bg-theme-accent text-theme-accent-text" : "bg-nova-bg text-nova-muted"
                }`}
              >
                {isArrangeMode ? "Done arranging" : "Arrange cards"}
              </button>
              {isArrangeMode && (
                <button
                  onClick={() => void resetDashboardLayout()}
                  className="rounded-full bg-nova-bg px-2.5 py-1 font-medium text-nova-muted transition-colors hover:text-nova-text"
                >
                  Reset layout
                </button>
              )}
              <span className="rounded-full bg-nova-bg px-2.5 py-1 font-medium text-nova-muted">
                {completionCount}/3 rituals logged
              </span>
              {theme && (
                <span
                  className="rounded-full px-2.5 py-1 font-medium"
                  style={{ backgroundColor: theme.accentLight, color: theme.accent }}
                >
                  {theme.symbol} {theme.name}
                </span>
              )}
            </div>
          </div>
          {isArrangeMode && (
            <p className="mt-3 text-xs text-nova-muted">
              Drag from the handle, tap size once to cycle the card, or reset the whole layout. Everything saves automatically.
            </p>
          )}
        </div>

        <div className="bg-[#fcfcfa] p-3 sm:p-4">
          {isArrangeMode ? (
            <div className="columns-1 gap-3 md:columns-2 xl:columns-3">
              {cardOrder.map((cardId) => (
                <div
                  key={cardId}
                  onDragOver={(event) => {
                    event.preventDefault();
                  }}
                  onDrop={(event) => {
                    if (!draggingId || draggingId === cardId) return;
                    event.preventDefault();
                    const nextOrder = moveCard(cardOrder, draggingId, cardId);
                    setDraggingId(null);
                    void persistOrder(nextOrder);
                  }}
                  className={`relative mb-3 break-inside-avoid cursor-grab active:cursor-grabbing ${
                    draggingId === cardId ? "opacity-60" : ""
                  }`}
                >
                  <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const nextSize = getNextCardSize(cardSizes[cardId]);
                        const nextSizes = { ...cardSizes, [cardId]: nextSize };
                        void persistSizes(nextSizes);
                      }}
                      className="flex h-8 min-w-[40px] items-center justify-center rounded-full border border-nova-border bg-white px-2 text-[10px] font-semibold text-nova-muted shadow-sm transition-colors hover:text-nova-text"
                      aria-label={`Cycle ${cardId} card size`}
                      title={`Size: ${SIZE_LABELS[cardSizes[cardId]]}`}
                    >
                      {SIZE_LABELS[cardSizes[cardId]]}
                    </button>
                    <button
                      type="button"
                      draggable
                      onDragStart={() => setDraggingId(cardId)}
                      onDragEnd={() => setDraggingId(null)}
                      className="flex h-8 w-8 cursor-grab items-center justify-center rounded-full border border-nova-border bg-white text-nova-muted shadow-sm active:cursor-grabbing"
                      aria-label={`Drag ${cardId} card`}
                      title="Drag card"
                    >
                      <GripVertical size={14} />
                    </button>
                  </div>
                  <div className="pointer-events-none">{cards[cardId]}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="columns-1 gap-3 md:columns-2 xl:columns-3">
              {cardOrder.map((cardId) => (
                <div key={cardId} className="mb-3 break-inside-avoid">
                  {cards[cardId]}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
