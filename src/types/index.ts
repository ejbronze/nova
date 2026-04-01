// ─── SHARED ───────────────────────────────────────────────────────────────────
export type Currency = "USD" | "DOP";
export type Pillar = "money" | "health" | "life";

// ─── MONEY ────────────────────────────────────────────────────────────────────
export type TransactionType = "income" | "expense" | "withdrawal";
export type PaymentMethod = "cash" | "debit" | "credit" | "transfer" | "other";
export type AccountType =
  | "checking"
  | "savings"
  | "credit"
  | "cash"
  | "investment"
  | "ira"
  | "retirement"
  | "mortgage"
  | "loan"
  | "line_of_credit"
  | "hsa";
export type BillStatus = "paid" | "unpaid" | "upcoming";

export interface Transaction {
  id: string;
  date: string; // ISO YYYY-MM-DD
  type: TransactionType;
  amount: number;
  currency: Currency;
  category: string;
  tags: string[];
  paymentMethod: PaymentMethod;
  accountId: string;
  description: string;
  notes?: string;
  isRecurring: boolean;
  createdAt: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  dueDay: number; // 1-31
  status: BillStatus;
  category: string;
  isRecurring: boolean;
  accountId: string;
  lastPaidDate?: string;
  notes?: string;
  createdAt: string;
}

export type DebtCategory = "credit_card" | "collection" | "mortgage" | "other";

export interface Debt {
  id: string;
  name: string;
  originalAmount: number;
  currentBalance: number;
  currency: Currency;
  interestRate?: number;
  minimumPayment?: number;
  dueDay?: number;
  accountId?: string;
  debtCategory?: DebtCategory;
  notes?: string;
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: Currency;
  color: string;
  notes?: string;
  createdAt: string;
}

// ─── HEALTH ───────────────────────────────────────────────────────────────────
export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface HealthLog {
  id: string;
  date: string; // YYYY-MM-DD — one per day
  hivMed: boolean;
  hivMedTime?: string;
  adderall: boolean;
  adderallTime?: string;
  weed: boolean;
  weedNotes?: string;
  mood?: MoodLevel;
  sleep?: number; // hours
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── LIFE ADMIN ───────────────────────────────────────────────────────────────
export type TaskCategory = "home" | "health" | "work" | "finance" | "personal" | "other";
export type RecurringInterval = "daily" | "weekly" | "monthly" | "yearly";
export type NoteCategory = "home" | "health" | "work" | "finance" | "personal" | "other";

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  dueDate?: string;
  isRecurring: boolean;
  recurringInterval?: RecurringInterval;
  completed: boolean;
  completedAt?: string;
  notes?: string;
  priority: "low" | "medium" | "high";
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: NoteCategory;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuickLink {
  id: string;
  name: string;
  url: string;
  emoji: string;
  category: string;
  sortOrder: number;
}

export interface HouseEntry {
  id: string;
  title: string;
  content: string;
  category: "appliance" | "utility" | "rule" | "maintenance" | "contact" | "other";
  emoji: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  name: string;
  initials: string;
  role: string;
  phone?: string;
  email?: string;
  category: string;
  color: string;
  notes?: string;
  createdAt: string;
}

// ─── GYM ──────────────────────────────────────────────────────────────────────
export type CardioType = "run" | "bike" | "elliptical" | "swim" | "rowing" | "other";

export interface GymSession {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  isCardio: boolean;
  cardioType?: CardioType;
  duration?: number; // minutes
  distance?: number; // miles
  notes?: string;
  createdAt: string;
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
import type { ZodiacSign } from "@/lib/themes";

export interface Settings {
  dopRate: number;
  dopRateUpdatedAt: string;
  primaryCurrency: Currency;
  theme: "light" | "dark";
  zodiacTheme?: ZodiacSign;
}

// ─── UI HELPERS ───────────────────────────────────────────────────────────────
export interface DashboardAlert {
  id: string;
  type: "danger" | "warning" | "info";
  title: string;
  subtitle: string;
  pillar: Pillar;
  actionLabel?: string;
  actionHref?: string;
}
