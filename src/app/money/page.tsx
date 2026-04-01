"use client";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useAppStore } from "@/lib/store";
import { formatCurrency, getDaysUntilDue, getBillDueLabel, TRANSACTION_CATEGORIES, getCategoryEmoji, generateId, todayStr } from "@/lib/utils";
import { Card, CardHeader, CardTitle, StatCard, Badge, PageHeader, Button, ProgressBar, Toggle, EmptyState } from "@/components/ui";
import { AddTransactionModal } from "@/components/money/AddTransactionModal";
import { FXConverter } from "@/components/shared/FXConverter";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Plus, DollarSign, TrendingDown, CreditCard, Wallet } from "lucide-react";
import type { Bill } from "@/types";

const TABS = ["Overview", "Transactions", "Bills", "Debt", "Accounts"] as const;
type Tab = typeof TABS[number];

const CHART_COLORS = ["#4F7CFF", "#5BB88A", "#F5A623", "#F25F5C", "#A78BFA", "#34D399", "#F87171", "#60A5FA"];

export default function MoneyPage() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [showAddModal, setShowAddModal] = useState(false);
  const [txSearch, setTxSearch] = useState("");
  const [txFilter, setTxFilter] = useState<"all" | "income" | "expense">("all");
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

  // Spending by category for donut
  const catMap: Record<string, number> = {};
  monthTx.filter(t => t.type === "expense").forEach(t => {
    catMap[t.category] = (catMap[t.category] ?? 0) + convert(t.amount, t.currency);
  });
  const pieData = Object.entries(catMap).map(([name, value]) => ({ name, value: Math.round(value) }));

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

  const markBillPaid = async (bill: Bill) => {
    await db.bills.update(bill.id, { status: "paid", lastPaidDate: todayStr() });
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader title="💰 Money" subtitle="Track income, expenses & debt">
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
                  <p className="text-xs text-nova-muted">{tx.currency}</p>
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

      {tab === "Debt" && (
        <div className="space-y-4">
          {(debts ?? []).map(debt => {
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
          {!debts?.length && <EmptyState emoji="🎉" title="No debt tracked" subtitle="Add debts to track payoff progress" />}
        </div>
      )}

      {tab === "Accounts" && (
        <div className="grid grid-cols-2 gap-4">
          {(accounts ?? []).map(acc => (
            <Card key={acc.id} style={{ borderLeft: `4px solid ${acc.color}` }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold">{acc.name}</p>
                  <p className="text-xs text-nova-muted capitalize">{acc.type}</p>
                </div>
                <CreditCard size={20} className="text-nova-muted" />
              </div>
              <p className="text-2xl font-bold">{formatCurrency(acc.balance, acc.currency)}</p>
              <p className="text-xs text-nova-muted mt-1">{acc.currency}</p>
            </Card>
          ))}
          {!accounts?.length && <EmptyState emoji="🏦" title="No accounts" subtitle="Add bank accounts to track balances" />}
        </div>
      )}

      {showAddModal && <AddTransactionModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
