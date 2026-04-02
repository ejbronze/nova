"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useAppStore } from "@/lib/store";
import { formatCurrency, todayStr, getGreeting, getDaysUntilDue, getBillDueLabel, getCategoryEmoji, getMedicationEntries, getMedicationTakenCount } from "@/lib/utils";
import Link from "next/link";

const MOOD_EMOJI = ["", "😞", "😕", "😐", "🙂", "😊"];

function formatSleep(value?: number) {
  if (value == null || Number.isNaN(value)) return "Not logged";
  const totalMinutes = Math.round(value * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export default function HomePage() {
  const { settings } = useAppStore();
  const today = todayStr();

  const recentTx   = useLiveQuery(() => db.transactions.orderBy("date").reverse().limit(6).toArray(), []);
  const bills      = useLiveQuery(() => db.bills.toArray(), []);
  const accounts   = useLiveQuery(() => db.accounts.toArray(), []);
  const todayLog   = useLiveQuery(() => db.healthLogs.get({ date: today }), [today]);
  const tasks      = useLiveQuery(() => db.tasks.where("completed").equals(0).toArray(), []);
  const debts      = useLiveQuery(() => db.debts.toArray(), []);
  const allTx      = useLiveQuery(() => db.transactions.orderBy("date").reverse().toArray(), []);

  const cur  = settings?.primaryCurrency ?? "USD";
  const rate = settings?.dopRate ?? 59.5;

  const cv = (amount: number, from: "USD" | "DOP") =>
    from === cur ? amount : cur === "USD" ? amount / rate : amount * rate;

  const totalBalance = (accounts ?? []).reduce((s, a) => s + cv(a.balance, a.currency), 0);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthTx   = (allTx ?? []).filter(t => t.date.startsWith(thisMonth));
  const income    = monthTx.filter(t => t.type === "income").reduce((s, t) => s + cv(t.amount, t.currency), 0);
  const spent     = monthTx.filter(t => t.type === "expense").reduce((s, t) => s + cv(t.amount, t.currency), 0);
  const totalDebt = (debts ?? []).reduce((s, d) => s + cv(d.currentBalance, d.currency), 0);

  const upcomingBills = (bills ?? [])
    .filter(b => b.status !== "paid")
    .sort((a, b) => getDaysUntilDue(a.dueDay) - getDaysUntilDue(b.dueDay))
    .slice(0, 4);

  const openTasks = (tasks ?? []).filter(t => !t.completed);
  const overdueTasks = openTasks.filter(t => t.dueDate && t.dueDate < today);

  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
  const medications = getMedicationEntries(todayLog);
  const medsTakenCount = getMedicationTakenCount(todayLog);

  return (
    <div className="animate-fadeIn select-none">
      {/* Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="font-serif text-3xl text-nova-text">{getGreeting()}</h1>
          <p className="text-nova-muted text-sm mt-0.5">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-nova-muted">
          <span className="w-2 h-2 rounded-full bg-health inline-block animate-pulse" />
          All systems synced
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-12 gap-3 auto-rows-[76px]">

        {/* ── Money tile (spans 4 cols × 3 rows) ─────────────────────── */}
        <Link href="/money" className="col-span-4 row-span-3 group">
          <div className="h-full bg-white border border-nova-border rounded-2xl shadow-card p-5 flex flex-col justify-between overflow-hidden relative hover:shadow-md hover:scale-[1.01] transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-money/8 to-transparent pointer-events-none rounded-2xl" />
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-money">💰 Money</span>
                <span className="text-xs text-nova-muted opacity-0 group-hover:opacity-100 transition-opacity">Open →</span>
              </div>
              <p className="font-serif text-3xl text-nova-text leading-none">{formatCurrency(totalBalance, cur)}</p>
              <p className="text-xs text-nova-muted mt-1">Net worth</p>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-nova-muted">Income</span>
                <span className="font-medium text-health">{formatCurrency(income, cur)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-nova-muted">Spent</span>
                <span className="font-medium text-nova-text">{formatCurrency(spent, cur)}</span>
              </div>
              {totalDebt > 0 && (
                <div className="flex justify-between text-xs pt-1 border-t border-nova-border">
                  <span className="text-nova-muted">Debt</span>
                  <span className="font-medium text-danger">{formatCurrency(totalDebt, cur)}</span>
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* ── Health tile (spans 4 cols × 3 rows) ─────────────────────── */}
        <Link href="/health" className="col-span-4 row-span-3 group">
          <div className="h-full bg-white border border-nova-border rounded-2xl shadow-card p-5 flex flex-col justify-between overflow-hidden relative hover:shadow-md hover:scale-[1.01] transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-health/8 to-transparent pointer-events-none rounded-2xl" />
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-health">🌿 Health</span>
                <span className="text-xs text-nova-muted opacity-0 group-hover:opacity-100 transition-opacity">Open →</span>
              </div>
              <p className="font-serif text-3xl text-nova-text leading-none">
                {todayLog
                  ? (medsTakenCount > 0 ? "On track" : "Check in")
                  : "Not logged"}
              </p>
              <p className="text-xs text-nova-muted mt-1">Today's status</p>
            </div>
            <div className="space-y-1.5">
              {todayLog?.mood && (
                <div className="flex justify-between text-xs">
                  <span className="text-nova-muted">Mood</span>
                  <span className="font-medium">{MOOD_EMOJI[todayLog.mood]} {["","Low","Meh","Okay","Good","Great"][todayLog.mood]}</span>
                </div>
              )}
              {todayLog?.sleep != null && (
                <div className="flex justify-between text-xs">
                  <span className="text-nova-muted">Sleep</span>
                  <span className="font-medium">{formatSleep(todayLog.sleep)}</span>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                {medications.slice(0, 3).map((medication) => (
                  <span
                    key={medication.id}
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      medication.taken ? "bg-health/15 text-health" : "bg-nova-bg text-nova-muted"
                    }`}
                  >
                    {medication.name || "Medication"}
                  </span>
                ))}
                {medications.length === 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-nova-bg text-nova-muted">
                    Add medications
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>

        {/* ── Life tile (spans 4 cols × 3 rows) ───────────────────────── */}
        <Link href="/life" className="col-span-4 row-span-3 group">
          <div className="h-full bg-white border border-nova-border rounded-2xl shadow-card p-5 flex flex-col justify-between overflow-hidden relative hover:shadow-md hover:scale-[1.01] transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-life/8 to-transparent pointer-events-none rounded-2xl" />
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-life">🗂 Life</span>
                <span className="text-xs text-nova-muted opacity-0 group-hover:opacity-100 transition-opacity">Open →</span>
              </div>
              <p className="font-serif text-3xl text-nova-text leading-none">{openTasks.length}</p>
              <p className="text-xs text-nova-muted mt-1">open task{openTasks.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="space-y-1.5">
              {overdueTasks.length > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-nova-muted">Overdue</span>
                  <span className="font-medium text-danger">{overdueTasks.length}</span>
                </div>
              )}
              {openTasks.slice(0, 2).map(t => (
                <div key={t.id} className="flex items-center gap-1.5 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    t.priority === "high" ? "bg-danger" : t.priority === "medium" ? "bg-life" : "bg-nova-muted"
                  }`} />
                  <span className="text-nova-text truncate">{t.title}</span>
                </div>
              ))}
              {!openTasks.length && <p className="text-xs text-nova-muted">All clear 🎉</p>}
            </div>
          </div>
        </Link>

        {/* ── Recent Transactions (8 cols × 3 rows) ───────────────────── */}
        <Link href="/money" className="col-span-8 row-span-3 group">
          <div className="h-full bg-white border border-nova-border rounded-2xl shadow-card px-5 py-4 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-nova-muted">Recent Transactions</p>
              <span className="text-xs text-nova-muted opacity-0 group-hover:opacity-100 transition-opacity">See all →</span>
            </div>
            <div className="flex-1 space-y-0 overflow-hidden">
              {(recentTx ?? []).slice(0, 4).map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-nova-border last:border-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">{getCategoryEmoji(tx.category)}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description}</p>
                      <p className="text-xs text-nova-muted">{tx.category} · {tx.date}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold shrink-0 ml-3 ${tx.type === "income" ? "text-health" : ""}`}>
                    {tx.type === "income" ? "+" : "−"}{formatCurrency(tx.amount, tx.currency)}
                  </span>
                </div>
              ))}
              {!(recentTx?.length) && (
                <p className="text-nova-muted text-sm text-center py-6">No transactions yet</p>
              )}
            </div>
          </div>
        </Link>

        {/* ── Upcoming Bills (4 cols × 3 rows) ────────────────────────── */}
        <Link href="/money" className="col-span-4 row-span-3 group">
          <div className="h-full bg-white border border-nova-border rounded-2xl shadow-card px-5 py-4 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-nova-muted">Upcoming Bills</p>
              <span className="text-xs text-nova-muted opacity-0 group-hover:opacity-100 transition-opacity">All →</span>
            </div>
            <div className="flex-1 space-y-2 overflow-hidden">
              {upcomingBills.length === 0 && (
                <p className="text-xs text-nova-muted text-center py-4">All clear 🎉</p>
              )}
              {upcomingBills.map(bill => {
                const days = getDaysUntilDue(bill.dueDay);
                return (
                  <div key={bill.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{bill.name}</p>
                      <p className="text-xs text-nova-muted">{getBillDueLabel(bill.dueDay)}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-sm font-semibold">{formatCurrency(bill.amount, bill.currency)}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        days <= 3 ? "bg-danger/10 text-danger" : days <= 7 ? "bg-amber-50 text-amber-600" : "bg-nova-bg text-nova-muted"
                      }`}>
                        {days === 0 ? "Today" : `${days}d`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Link>

      </div>
    </div>
  );
}
