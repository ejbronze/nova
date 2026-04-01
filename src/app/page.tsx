"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useAppStore } from "@/lib/store";
import { formatCurrency, todayStr, getGreeting, getDaysUntilDue, getBillDueLabel } from "@/lib/utils";
import { Card, CardHeader, CardTitle, StatCard, Badge, AlertBanner, PageHeader } from "@/components/ui";
import { FXConverter } from "@/components/shared/FXConverter";
import Link from "next/link";
import { TrendingUp, TrendingDown, Heart, CheckSquare, AlertTriangle } from "lucide-react";

export default function HomePage() {
  const { settings } = useAppStore();
  const today = todayStr();

  const recentTx = useLiveQuery(() =>
    db.transactions.orderBy("date").reverse().limit(5).toArray(), []);

  const bills = useLiveQuery(() => db.bills.toArray(), []);
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const todayLog = useLiveQuery(() => db.healthLogs.get({ date: today }), [today]);
  const tasks = useLiveQuery(() =>
    db.tasks.where("completed").equals(0).limit(5).toArray(), []);
  const debts = useLiveQuery(() => db.debts.toArray(), []);

  const cur = settings?.primaryCurrency ?? "USD";
  const rate = settings?.dopRate ?? 59.5;

  // Compute totals
  const totalBalance = (accounts ?? []).reduce((s, a) => {
    const bal = a.currency === cur ? a.balance : cur === "USD" ? a.balance / rate : a.balance * rate;
    return s + bal;
  }, 0);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthTx = (recentTx ?? []).filter(t => t.date.startsWith(thisMonth));
  const income = monthTx.filter(t => t.type === "income").reduce((s, t) => s + (t.currency === cur ? t.amount : cur === "USD" ? t.amount / rate : t.amount * rate), 0);
  const spent = monthTx.filter(t => t.type === "expense").reduce((s, t) => s + (t.currency === cur ? t.amount : cur === "USD" ? t.amount / rate : t.amount * rate), 0);

  const upcomingBills = (bills ?? [])
    .filter(b => b.status !== "paid")
    .sort((a, b) => getDaysUntilDue(a.dueDay) - getDaysUntilDue(b.dueDay))
    .slice(0, 4);

  const totalDebt = (debts ?? []).reduce((s, d) => s + (d.currency === cur ? d.currentBalance : cur === "USD" ? d.currentBalance / rate : d.currentBalance * rate), 0);

  // Alerts
  const alerts = [];
  const overdueBills = (bills ?? []).filter(b => getDaysUntilDue(b.dueDay) <= 3 && b.status !== "paid");
  if (overdueBills.length > 0) {
    alerts.push({ type: "danger" as const, title: `${overdueBills.length} bill${overdueBills.length > 1 ? "s" : ""} due soon`, subtitle: overdueBills.map(b => b.name).join(", ") });
  }
  if (todayLog && !todayLog.hivMed) {
    alerts.push({ type: "warning" as const, title: "HIV medication not logged", subtitle: "Tap Health to log today's dose" });
  }

  const moodEmoji = ["", "😞", "😕", "😐", "🙂", "😊"];

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title={getGreeting()}
        subtitle={new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      />

      {alerts.map((a, i) => (
        <AlertBanner key={i} type={a.type} title={a.title} subtitle={a.subtitle} className="mb-3" />
      ))}

      {/* Pillar stat row */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <Link href="/money">
          <StatCard
            label="Net Worth"
            value={formatCurrency(totalBalance, cur)}
            sub={`${formatCurrency(income, cur)} in · ${formatCurrency(spent, cur)} out this month`}
            accent="money"
            icon={<TrendingUp size={18} />}
          />
        </Link>
        <Link href="/health">
          <StatCard
            label="Today's Health"
            value={todayLog ? (todayLog.hivMed && todayLog.adderall ? "✅ On track" : "⚠️ Check meds") : "Not logged"}
            sub={todayLog?.mood ? `Mood ${moodEmoji[todayLog.mood]} · Sleep ${todayLog.sleep ?? "—"}h` : "Tap to log today"}
            accent="health"
            icon={<Heart size={18} />}
          />
        </Link>
        <Link href="/life">
          <StatCard
            label="Open Tasks"
            value={String((tasks ?? []).length)}
            sub="pending items"
            accent="life"
            icon={<CheckSquare size={18} />}
          />
        </Link>
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-5 mb-5">
        {/* Recent transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <Link href="/money" className="text-sm text-money font-medium hover:underline">See all →</Link>
          </CardHeader>
          <div className="space-y-1">
            {(recentTx ?? []).slice(0, 5).map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-nova-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{tx.type === "income" ? "💚" : "💸"}</span>
                  <div>
                    <p className="text-sm font-medium text-nova-text">{tx.description}</p>
                    <p className="text-xs text-nova-muted">{tx.category} · {tx.date}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${tx.type === "income" ? "text-health" : "text-nova-text"}`}>
                  {tx.type === "income" ? "+" : "−"}{formatCurrency(tx.amount, tx.currency)}
                </span>
              </div>
            ))}
            {!(recentTx?.length) && <p className="text-nova-muted text-sm py-4 text-center">No transactions yet</p>}
          </div>
        </Card>

        {/* Bills sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Bills</CardTitle>
              <Link href="/money" className="text-sm text-money font-medium hover:underline">All →</Link>
            </CardHeader>
            <div className="space-y-2">
              {upcomingBills.map(bill => {
                const days = getDaysUntilDue(bill.dueDay);
                return (
                  <div key={bill.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{bill.name}</p>
                      <p className="text-xs text-nova-muted">{getBillDueLabel(bill.dueDay)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(bill.amount, bill.currency)}</p>
                      <Badge variant={days <= 3 ? "danger" : days <= 7 ? "warning" : "muted"}>
                        {days === 0 ? "Today" : `${days}d`}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {!upcomingBills.length && <p className="text-nova-muted text-sm text-center py-2">All clear 🎉</p>}
            </div>
          </Card>

          {totalDebt > 0 && (
            <Card>
              <CardHeader><CardTitle>Total Debt</CardTitle></CardHeader>
              <p className="text-2xl font-bold text-danger">{formatCurrency(totalDebt, cur)}</p>
              <p className="text-xs text-nova-muted mt-1">across {debts?.length} balance{debts?.length !== 1 ? "s" : ""}</p>
            </Card>
          )}
        </div>
      </div>

      {/* FX Converter */}
      <FXConverter />
    </div>
  );
}
