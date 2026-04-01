import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import type { Currency } from "@/types";

// ─── CLASSNAMES ────────────────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── CURRENCY ─────────────────────────────────────────────────────────────────
export function formatCurrency(
  amount: number,
  currency: Currency = "USD",
  compact = false
): string {
  if (currency === "DOP") {
    return compact && Math.abs(amount) >= 1000
      ? `RD$${(amount / 1000).toFixed(1)}k`
      : `RD$${amount.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (compact && Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function convertUSDtoDOP(usd: number, rate: number): number {
  return usd * rate;
}

export function convertDOPtoUSD(dop: number, rate: number): number {
  return dop / rate;
}

// ─── DATES ─────────────────────────────────────────────────────────────────────
export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "MMM d");
  } catch {
    return dateStr;
  }
}

export function formatTime(timeStr: string): string {
  // timeStr = "HH:mm"
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function getBillDueLabel(dueDay: number): string {
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay);
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
  const target = thisMonth < today ? nextMonth : thisMonth;

  if (isToday(target)) return "Due today";
  if (isTomorrow(target)) return "Due tomorrow";
  if (isPast(target)) return "Overdue";
  return `Due ${format(target, "MMM d")}`;
}

export function getDaysUntilDue(dueDay: number): number {
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay);
  const target = thisMonth <= today
    ? new Date(today.getFullYear(), today.getMonth() + 1, dueDay)
    : thisMonth;
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getMonthRange(monthsBack = 0): { start: string; end: string } {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack);
  const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
  return { start, end };
}

// ─── ID GENERATION ────────────────────────────────────────────────────────────
export function generateId(prefix = "id"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── STREAK CALCULATION ───────────────────────────────────────────────────────
export function calculateStreak(
  logs: string[] | { date: string; value: boolean }[]
): number {
  const isStrArr = logs.length === 0 || typeof logs[0] === "string";
  const dates: string[] = isStrArr
    ? (logs as string[])
    : (logs as { date: string; value: boolean }[]).filter((l) => l.value).map((l) => l.date);
  const sorted = [...dates].sort((a, b) => b.localeCompare(a)); // newest first

  if (sorted.length === 0) return 0;

  let streak = 0;
  let check = todayStr();
  // Allow today OR yesterday as streak start (don't break if today not yet logged)
  const latest = sorted[0]!;
  if (latest !== check) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split("T")[0];
    if (latest !== yStr) return 0;
    check = yStr;
  }

  for (const date of sorted) {
    if (date === check) {
      streak++;
      const prev = new Date(check);
      prev.setDate(prev.getDate() - 1);
      check = prev.toISOString().split("T")[0];
    } else if (date < check) {
      break;
    }
  }
  return streak;
}

// ─── EXPORT HELPERS ───────────────────────────────────────────────────────────
export function downloadJSON(data: string, filename: string): void {
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadCSV(rows: Record<string, unknown>[], filename: string): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── CATEGORY HELPERS ─────────────────────────────────────────────────────────
export const TRANSACTION_CATEGORIES = [
  "Housing", "Groceries", "Food & Dining", "Transport", "Health",
  "Subscriptions", "Entertainment", "Clothing", "Utilities",
  "Personal Care", "Education", "Freelance", "Salary", "Other",
];

export const CATEGORY_EMOJIS: Record<string, string> = {
  Housing: "🏠", Groceries: "🛒", "Food & Dining": "🍕", Transport: "🚗",
  Health: "💊", Subscriptions: "🎬", Entertainment: "🎮", Clothing: "👕",
  Utilities: "⚡", "Personal Care": "🪴", Education: "📚",
  Freelance: "💵", Salary: "💼", Other: "📦",
};

export function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJIS[category] ?? "💸";
}

export const PILLAR_COLORS = {
  money: { text: "text-money", bg: "bg-money-bg", border: "border-money-border", hex: "#4F7CFF" },
  health: { text: "text-health", bg: "bg-health-bg", border: "border-health-border", hex: "#5BB88A" },
  life: { text: "text-life", bg: "bg-life-bg", border: "border-life-border", hex: "#F5A623" },
} as const;
