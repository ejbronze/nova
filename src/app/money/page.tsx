"use client";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useAppStore } from "@/lib/store";
import { formatCurrency, getDaysUntilDue, getBillDueLabel, getCategoryEmoji, todayStr } from "@/lib/utils";
import { Card, CardHeader, CardTitle, StatCard, Badge, PageHeader, Button, ProgressBar, EmptyState } from "@/components/ui";
import { AddTransactionModal, type AddTransactionDraft } from "@/components/money/AddTransactionModal";
import { AccountModal, ACCOUNT_TYPE_META } from "@/components/money/AccountModal";
import { FXConverter } from "@/components/shared/FXConverter";
import { PillarLabel } from "@/components/shared/PillarIcon";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Plus, DollarSign, TrendingDown, Wallet, ArrowRight, Lightbulb, Sparkles, PartyPopper } from "lucide-react";
import type { Bill, DebtCategory, Account } from "@/types";

const TABS = ["Overview", "Transactions", "Bills", "Debt", "Accounts"] as const;
type Tab = typeof TABS[number];

const CHART_COLORS = ["#4F7CFF", "#5BB88A", "#F5A623", "#F25F5C", "#A78BFA", "#34D399", "#F87171", "#60A5FA"];

const MONEY_FACTS = [
  "People who review spending weekly are more likely to notice small leaks before they become monthly habits.",
  "Giving every incoming dollar a job can make budgeting feel calmer because fewer decisions pile up later.",
  "Tiny recurring charges often feel harmless, but they are usually the easiest budget wins to trim.",
  "Logging a purchase right away makes the rest of your dashboard much more useful by the end of the week.",
];

export default function MoneyPage() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [showAddModal, setShowAddModal] = useState(false);
  const [transactionDraft, setTransactionDraft] = useState<AddTransactionDraft | undefined>(undefined);
  const [txSearch, setTxSearch] = useState("");
  const [txFilter, setTxFilter] = useState<"all" | "income" | "expense">("all");
  const [debtView, setDebtView] = useState<"all" | DebtCategory>("all");
  const [debtFading, setDebtFading] = useState(false);
  const [accountModal, setAccountModal] = useState<{ open: boolean; account?: Account | null }>({ open: false });
  const { settings } = useAppStore();

  const cur = settings?.primaryCurrency ?? "USD";
  const rate = settings?.dopRate ?? 59.5;

  const transactions = useLiveQuery(() => db.transactions.orderBy("date").reverse().toArray(), []);
  const bills = useLiveQuery(() => db.bills.toArray(), []);
  const debts = useLiveQuery(() => db.debts.toArray(), []);
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);

  const convert = (amount: number, from: "USD" | "DOP") => {
    if (from === cur) return amount;
    return cur === "USD" ? amount / rate : amount * rate;
  };

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthTx = (transactions ?? []).filter(t => t.date.startsWith(thisMonth));
  const income = monthTx.filter(t => t.type === "income").reduce((s, t) => s + convert(t.amount, t.currency), 0);
  const spent = monthTx.filter(t => t.type === "expense").reduce((s, t) => s + convert(t.amount, t.currency), 0);
  const net = income - spent;
  const totalBalance = (accounts ?? []).reduce((s, a) => s + convert(a.balance, a.currency), 0);
  const totalDebt = (debts ?? []).reduce((s, d) => s + convert(d.currentBalance, d.currency), 0);
  const recentTransactions = transactions?.slice(0, 5) ?? [];
  const txCountThisMonth = monthTx.length;
  const expenseCountThisMonth = monthTx.filter(t => t.type === "expense").length;
  const incomeCountThisMonth = monthTx.filter(t => t.type === "income").length;

  // Spending by category for donut
  const catMap: Record<string, number> = {};
  monthTx.filter(t => t.type === "expense").forEach(t => {
    catMap[t.category] = (catMap[t.category] ?? 0) + convert(t.amount, t.currency);
  });
  const pieData = Object.entries(catMap).map(([name, value]) => ({ name, value: Math.round(value) }));
  const topCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0];
  const savingsRate = income > 0 ? Math.round((Math.max(net, 0) / income) * 100) : 0;
  const factOfTheMoment = MONEY_FACTS[(txCountThisMonth + recentTransactions.length) % MONEY_FACTS.length];

  const openTransactionPrompt = (draft?: AddTransactionDraft) => {
    setTransactionDraft(draft);
    setShowAddModal(true);
  };

  const promptCards: Array<{
    title: string;
    description: string;
    action: string;
    draft: AddTransactionDraft;
  }> = [
    {
      title: "Log a quick expense",
      description: "Capture what you just spent while it is still fresh.",
      action: "Add expense",
      draft: { type: "expense", category: topCategory ?? "Food", description: "" },
    },
    {
      title: "Record incoming money",
      description: "Paychecks, transfers, and reimbursements count too.",
      action: "Add income",
      draft: { type: "income", category: "Salary", description: "" },
    },
    {
      title: "Track a routine payment",
      description: "Small recurring charges are the easiest budget wins to spot.",
      action: "Add recurring",
      draft: { type: "expense", isRecurring: true, category: "Bills", description: "" },
    },
  ];

  const encouragement = !txCountThisMonth
    ? "One logged transaction is enough to get this month moving."
    : net >= 0 && txCountThisMonth >= 3
      ? `You are in the black this month. That ${formatCurrency(net, cur)} cushion is real progress.`
      : incomeCountThisMonth === 0
        ? "Adding income entries will make your budget picture much more honest."
        : "Every transaction you log sharpens your budget and makes the next decision easier.";

  const coachingTip = spent > income && income > 0
    ? "Spending is ahead of income this month. Try logging the next three purchases as they happen to find the pressure point."
    : topCategory
      ? `${topCategory} is your biggest spending category right now. A tiny trim there will usually matter more than cutting five smaller things.`
      : "Start simple: log meals, transport, and subscriptions first. Those usually tell the clearest story fast.";

  const celebration = net > 0
    ? `Saved ${formatCurrency(net, cur)} this month`
    : expenseCountThisMonth >= 5
      ? `${expenseCountThisMonth} expenses tracked this month`
      : `${recentTransactions.length} recent transaction${recentTransactions.length === 1 ? "" : "s"} captured`;

  // Monthly bar chart (last 6 months)
  const barData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const month = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString("en-US", { month: "short" });
    const txs = (transactions ?? []).filter(t => t.date.startsWith(month));
    return {
      month: label,
      Income: Math.round(txs.filter(t => t.type === "income").reduce((s, t) => s + convert(t.amount, t.currency), 0)),
      Expenses: Math.round(txs.filter(t => t.type === "expense").reduce((s, t) => s + convert(t.amount, t.currency), 0)),
    };
  });

  const filteredTx = (transactions ?? []).filter(t => {
    if (txFilter !== "all" && t.type !== txFilter) return false;
    if (txSearch && !t.description.toLowerCase().includes(txSearch.toLowerCase()) && !t.category.toLowerCase().includes(txSearch.toLowerCase())) return false;
    return true;
  });

  const getUsdDisplayAmount = (tx: { amount: number; currency: "USD" | "DOP"; usdAmount?: number }) => {
    if (tx.currency === "USD") return tx.amount;
    if (typeof tx.usdAmount === "number" && Number.isFinite(tx.usdAmount)) return tx.usdAmount;
    return Number((tx.amount / rate).toFixed(2));
  };

  const markBillPaid = async (bill: Bill) => {
    await db.bills.update(bill.id, { status: "paid", lastPaidDate: todayStr() });
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader title={<PillarLabel pillar="money" iconSize={20}>Money</PillarLabel>} subtitle="Track income, expenses & debt">
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowAddModal(true)}>
          Add Transaction
        </Button>
      </PageHeader>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white border border-nova-border rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-money text-white shadow-sm" : "text-nova-muted hover:text-nova-text"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <>
          <div className="grid grid-cols-4 gap-4 mb-5">
            <StatCard label="Net Worth" value={formatCurrency(totalBalance, cur)} accent="money" icon={<Wallet size={18} />} />
            <StatCard label="Income" value={formatCurrency(income, cur)} sub="this month" accent="money" icon={<TrendingDown size={18} className="rotate-180" />} />
            <StatCard label="Spent" value={formatCurrency(spent, cur)} sub="this month" accent="money" icon={<TrendingDown size={18} />} />
            <StatCard label="Saved" value={formatCurrency(net, cur)} sub={net >= 0 ? "🎉 great!" : "⚠️ over budget"} accent={net >= 0 ? "money" : undefined} icon={<DollarSign size={18} />} />
          </div>

          <div className="grid grid-cols-[1.6fr_1fr] gap-5 mb-5">
            <Card className="overflow-hidden border-money/20 bg-[linear-gradient(135deg,rgba(79,124,255,0.08),rgba(91,184,138,0.03))]">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-money mb-3">
                    <Sparkles size={13} />
                    Money Momentum
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-nova-text mb-2">Make budgeting feel easier to keep up with.</h2>
                  <p className="text-sm leading-6 text-nova-muted max-w-xl">{encouragement}</p>
                </div>
                <div className="shrink-0 rounded-2xl border border-money/15 bg-white/80 px-4 py-3 text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-nova-muted">Small Win</p>
                  <p className="text-base font-semibold text-money mt-1">{celebration}</p>
                  <p className="text-xs text-nova-muted mt-1">
                    {income > 0 ? `${savingsRate}% of income kept` : "Consistency beats intensity"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {promptCards.map((prompt) => (
                  <button
                    key={prompt.title}
                    type="button"
                    onClick={() => openTransactionPrompt(prompt.draft)}
                    className="group rounded-2xl border border-nova-border bg-white/90 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-money/40 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
                  >
                    <p className="text-sm font-semibold text-nova-text mb-1">{prompt.title}</p>
                    <p className="text-xs leading-5 text-nova-muted mb-4">{prompt.description}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-money">
                      {prompt.action}
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-start justify-between gap-3 rounded-2xl border border-money/15 bg-white/75 px-4 py-3">
                <div className="flex gap-3">
                  <div className="mt-0.5 rounded-xl bg-money/10 p-2 text-money">
                    <Lightbulb size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-nova-text">Budget nudge</p>
                    <p className="text-xs leading-5 text-nova-muted">{coachingTip}</p>
                  </div>
                </div>
                <Button variant="primary" className="shrink-0" onClick={() => openTransactionPrompt()}>
                  Log transaction
                </Button>
              </div>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Today&apos;s Money Note</CardTitle></CardHeader>
                <div className="flex gap-3">
                  <div className="rounded-xl bg-money/10 p-2.5 text-money h-fit">
                    <PartyPopper size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-nova-text mb-1">Celebrate the tiny wins.</p>
                    <p className="text-sm leading-6 text-nova-muted">{factOfTheMoment}</p>
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader><CardTitle>Quick Focus</CardTitle></CardHeader>
                <div className="space-y-3">
                  <div className="rounded-xl bg-nova-bg px-3 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-nova-muted mb-1">This month</p>
                    <p className="text-sm text-nova-text">
                      {txCountThisMonth
                        ? `${txCountThisMonth} transactions logged so far.`
                        : "No transactions logged yet this month."}
                    </p>
                  </div>
                  <div className="rounded-xl bg-nova-bg px-3 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-nova-muted mb-1">Next best move</p>
                    <p className="text-sm text-nova-text">
                      {recentTransactions.length
                        ? "Log the next purchase as soon as it happens so your dashboard stays trustworthy."
                        : "Start with one real transaction today. Momentum is easier once the page reflects real life."}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-[2fr_1fr] gap-5 mb-5">
            <Card>
              <CardHeader><CardTitle>Income vs Expenses</CardTitle></CardHeader>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} width={55} tickFormatter={v => `${cur === "DOP" ? "RD$" : "$"}${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v, cur)} />
                  <Bar dataKey="Income" fill="#5BB88A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#4F7CFF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <CardHeader><CardTitle>By Category</CardTitle></CardHeader>
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v, cur)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 mt-2">
                    {pieData.slice(0, 4).map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                          {d.name}
                        </span>
                        <span className="font-medium">{formatCurrency(d.value, cur)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-nova-muted text-sm text-center py-8">No expenses this month</p>
              )}
            </Card>
          </div>

          <FXConverter />
        </>
      )}

      {tab === "Transactions" && (
        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
            <div className="flex gap-2">
              {(["all", "income", "expense"] as const).map(f => (
                <button key={f} onClick={() => setTxFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${txFilter === f ? "bg-money text-white" : "bg-nova-bg text-nova-muted hover:text-nova-text"}`}>
                  {f}
                </button>
              ))}
            </div>
          </CardHeader>
          <input
            placeholder="Search transactions..."
            value={txSearch}
            onChange={e => setTxSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-nova-border text-sm mb-4 outline-none focus:border-money"
          />
          <div className="space-y-1">
            {filteredTx.slice(0, 50).map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-nova-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl w-8 text-center">{getCategoryEmoji(tx.category)}</span>
                  <div>
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-nova-muted">{tx.category} · {tx.date} · {tx.paymentMethod}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${tx.type === "income" ? "text-health" : ""}`}>
                    {tx.type === "income" ? "+" : "−"}{formatCurrency(tx.amount, tx.currency)}
                  </p>
                  <p className="text-xs text-nova-muted">
                    {tx.currency === "DOP" ? `${formatCurrency(getUsdDisplayAmount(tx), "USD")} USD` : tx.currency}
                  </p>
                </div>
              </div>
            ))}
            {!filteredTx.length && <EmptyState emoji="🔍" title="No transactions found" subtitle="Try adjusting your search or filter" />}
          </div>
        </Card>
      )}

      {tab === "Bills" && (
        <div className="space-y-3">
          {(bills ?? []).sort((a, b) => getDaysUntilDue(a.dueDay) - getDaysUntilDue(b.dueDay)).map(bill => {
            const days = getDaysUntilDue(bill.dueDay);
            return (
              <Card key={bill.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{bill.name}</p>
                    <p className="text-sm text-nova-muted">{getBillDueLabel(bill.dueDay)} · {bill.category}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(bill.amount, bill.currency)}</p>
                      <Badge variant={bill.status === "paid" ? "money" : days <= 3 ? "danger" : days <= 7 ? "warning" : "muted"}>
                        {bill.status === "paid" ? "Paid" : days === 0 ? "Due today" : `${days}d left`}
                      </Badge>
                    </div>
                    {bill.status !== "paid" && (
                      <Button variant="outline" onClick={() => markBillPaid(bill)}>Mark Paid</Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
          {!bills?.length && <EmptyState emoji="📋" title="No bills" subtitle="Add recurring bills to track them" />}
        </div>
      )}

      {tab === "Debt" && (() => {
        const DEBT_CATS: { key: "all" | DebtCategory; label: string; emoji: string }[] = [
          { key: "all", label: "Total", emoji: "📊" },
          { key: "credit_card", label: "Credit Card", emoji: "💳" },
          { key: "collection", label: "Collections", emoji: "⚠️" },
          { key: "mortgage", label: "Mortgage", emoji: "🏠" },
          { key: "other", label: "Other", emoji: "📁" },
        ];
        const allDebts = debts ?? [];
        const filteredDebts = debtView === "all"
          ? allDebts
          : allDebts.filter(d => (d.debtCategory ?? "other") === debtView);
        const viewTotal = filteredDebts.reduce((s, d) => s + convert(d.currentBalance, d.currency), 0);
        const catTotals: Record<string, number> = {};
        allDebts.forEach(d => {
          const cat = d.debtCategory ?? "other";
          catTotals[cat] = (catTotals[cat] ?? 0) + convert(d.currentBalance, d.currency);
        });

        const switchView = (v: typeof debtView) => {
          if (v === debtView) return;
          setDebtFading(true);
          setTimeout(() => { setDebtView(v); setDebtFading(false); }, 180);
        };

        return (
          <div className="space-y-4">
            {/* Summary card */}
            <Card>
              <div className={`transition-all duration-200 ${debtFading ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"}`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-nova-muted mb-1">
                  {DEBT_CATS.find(c => c.key === debtView)?.emoji} {DEBT_CATS.find(c => c.key === debtView)?.label} Debt
                </p>
                <p className="font-serif text-4xl text-danger">{formatCurrency(viewTotal, cur)}</p>
                {debtView === "all" && (
                  <p className="text-xs text-nova-muted mt-1">{allDebts.length} account{allDebts.length !== 1 ? "s" : ""} tracked</p>
                )}
              </div>
            </Card>

            {/* Category selector */}
            <div className="flex gap-2 flex-wrap">
              {DEBT_CATS.map(cat => {
                const amt = cat.key === "all" ? totalDebt : (catTotals[cat.key] ?? 0);
                const hasDebts = cat.key === "all" ? allDebts.length > 0 : (catTotals[cat.key] ?? 0) > 0;
                return (
                  <button
                    key={cat.key}
                    onClick={() => switchView(cat.key)}
                    className={`flex flex-col items-start px-4 py-2.5 rounded-xl border-2 transition-all text-left ${
                      debtView === cat.key
                        ? "border-danger bg-danger/5 text-danger"
                        : "border-nova-border text-nova-muted hover:border-danger/40 hover:text-nova-text"
                    }`}
                  >
                    <span className="text-xs font-semibold">{cat.emoji} {cat.label}</span>
                    {hasDebts && <span className="text-xs opacity-70">{formatCurrency(amt, cur)}</span>}
                  </button>
                );
              })}
            </div>

            {/* Debt list */}
            <div className={`space-y-3 transition-all duration-200 ${debtFading ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
              {filteredDebts.map(debt => {
                const pct = Math.round(((debt.originalAmount - debt.currentBalance) / debt.originalAmount) * 100);
                return (
                  <Card key={debt.id}>
                    <CardHeader>
                      <CardTitle>{debt.name}</CardTitle>
                      <span className="text-2xl font-bold text-danger">{formatCurrency(debt.currentBalance, debt.currency)}</span>
                    </CardHeader>
                    <div className="mt-2 mb-3">
                      <ProgressBar value={pct} color="money" />
                      <div className="flex justify-between text-xs text-nova-muted mt-1">
                        <span>{pct}% paid off</span>
                        <span>Original: {formatCurrency(debt.originalAmount, debt.currency)}</span>
                      </div>
                    </div>
                    {debt.interestRate && <p className="text-xs text-nova-muted">APR: {debt.interestRate}% · Min payment: {debt.minimumPayment ? formatCurrency(debt.minimumPayment, debt.currency) : "—"}</p>}
                  </Card>
                );
              })}
              {filteredDebts.length === 0 && (
                <EmptyState emoji="🎉" title={debtView === "all" ? "No debt tracked" : `No ${DEBT_CATS.find(c => c.key === debtView)?.label.toLowerCase()} debt`} subtitle={debtView === "all" ? "Add debts to track payoff progress" : "Nothing in this category"} />
              )}
            </div>
          </div>
        );
      })()}

      {tab === "Accounts" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-nova-muted">{(accounts ?? []).length} account{(accounts ?? []).length !== 1 ? "s" : ""}</p>
            <Button variant="primary" icon={<Plus size={15} />} onClick={() => setAccountModal({ open: true, account: null })}>
              Add Account
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {(accounts ?? []).map(acc => {
              const meta = ACCOUNT_TYPE_META[acc.type] ?? { label: acc.type, emoji: "🏦" };
              const isNegative = acc.balance < 0;
              return (
                <Card key={acc.id} style={{ borderLeft: `4px solid ${acc.color}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{meta.emoji}</span>
                      <div>
                        <p className="font-semibold text-sm leading-tight">{acc.name}</p>
                        <p className="text-xs text-nova-muted">{meta.label} · {acc.currency}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAccountModal({ open: true, account: acc })}
                      className="p-1.5 rounded-lg hover:bg-nova-bg text-nova-muted hover:text-nova-text transition-colors"
                      title="Edit account"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  </div>
                  <p className={`text-2xl font-bold font-serif ${isNegative ? "text-danger" : "text-nova-text"}`}>
                    {formatCurrency(acc.balance, acc.currency)}
                  </p>
                  {acc.notes && <p className="text-xs text-nova-muted mt-2 truncate">{acc.notes}</p>}
                </Card>
              );
            })}
          </div>
          {!accounts?.length && (
            <EmptyState emoji="🏦" title="No accounts yet" subtitle="Add your bank accounts, cards, loans, and investments" />
          )}
        </div>
      )}

      {showAddModal && (
        <AddTransactionModal
          initialValues={transactionDraft}
          onClose={() => {
            setShowAddModal(false);
            setTransactionDraft(undefined);
          }}
        />
      )}
      {accountModal.open && (
        <AccountModal
          account={accountModal.account}
          onClose={() => setAccountModal({ open: false })}
        />
      )}
    </div>
  );
}
