import Dexie, { type Table } from "dexie";
import type {
  Transaction,
  Bill,
  Debt,
  Account,
  HealthLog,
  MoodLevel,
  Task,
  Note,
  QuickLink,
  HouseEntry,
  Contact,
  Settings,
  GymSession,
} from "@/types";

export class NovaDatabase extends Dexie {
  transactions!: Table<Transaction>;
  bills!: Table<Bill>;
  debts!: Table<Debt>;
  accounts!: Table<Account>;
  healthLogs!: Table<HealthLog>;
  tasks!: Table<Task>;
  notes!: Table<Note>;
  quickLinks!: Table<QuickLink>;
  houseEntries!: Table<HouseEntry>;
  contacts!: Table<Contact>;
  settings!: Table<Settings & { id: number }>;
  gymSessions!: Table<GymSession>;

  constructor() {
    super("NovaDB");

    this.version(1).stores({
      transactions: "id, date, type, category, accountId, currency, createdAt",
      bills: "id, dueDay, status, category, accountId, createdAt",
      debts: "id, currency, createdAt",
      accounts: "id, type, currency, createdAt",
      healthLogs: "id, date, createdAt",
      tasks: "id, category, dueDate, completed, priority, createdAt",
      notes: "id, category, isPinned, createdAt, updatedAt",
      quickLinks: "id, category, sortOrder",
      houseEntries: "id, category, createdAt",
      contacts: "id, category, createdAt",
      settings: "id",
    });

    this.version(2).stores({
      gymSessions: "id, date, isCardio, createdAt",
    });
  }
}

export const db = new NovaDatabase();

// ─── SETTINGS HELPERS ─────────────────────────────────────────────────────────
export async function getSettings(): Promise<Settings> {
  const row = await db.settings.get(1);
  if (row) {
    const { id: _id, ...settings } = row;
    return settings;
  }
  const defaults: Settings = {
    dopRate: 59.5,
    dopRateUpdatedAt: new Date().toISOString(),
    primaryCurrency: "USD",
    theme: "light",
  };
  await db.settings.put({ id: 1, ...defaults });
  return defaults;
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await db.settings.put({ id: 1, ...current, ...patch });
}

// ─── SEED DATA ────────────────────────────────────────────────────────────────
export async function seedIfEmpty(): Promise<void> {
  const count = await db.accounts.count();
  if (count > 0) return;

  const now = new Date().toISOString();
  const today = new Date().toISOString().split("T")[0];

  // Accounts
  await db.accounts.bulkAdd([
    { id: "acc-1", name: "Chase Checking", type: "checking", balance: 3240, currency: "USD", color: "#4F7CFF", createdAt: now },
    { id: "acc-2", name: "Chase Savings", type: "savings", balance: 1720, currency: "USD", color: "#5BB88A", createdAt: now },
    { id: "acc-3", name: "Banco Popular", type: "checking", balance: 24000, currency: "DOP", color: "#F5A623", createdAt: now },
    { id: "acc-4", name: "Amex Credit", type: "credit", balance: -1240, currency: "USD", color: "#F25F5C", createdAt: now },
  ]);

  // Transactions
  const txDates = [0, 1, 1, 2, 3, 3, 5, 6, 7, 8].map((d) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - d);
    return dt.toISOString().split("T")[0];
  });

  await db.transactions.bulkAdd([
    { id: "tx-1", date: txDates[0], type: "expense", amount: 67.4, currency: "USD", category: "Groceries", tags: ["food"], paymentMethod: "debit", accountId: "acc-1", description: "Trader Joe's", isRecurring: false, createdAt: now },
    { id: "tx-2", date: txDates[1], type: "income", amount: 2400, currency: "USD", category: "Freelance", tags: ["work"], paymentMethod: "transfer", accountId: "acc-1", description: "Client Invoice #12", isRecurring: false, createdAt: now },
    { id: "tx-3", date: txDates[2], type: "expense", amount: 24.99, currency: "USD", category: "Food & Dining", tags: ["food"], paymentMethod: "credit", accountId: "acc-4", description: "Domino's", isRecurring: false, createdAt: now },
    { id: "tx-4", date: txDates[3], type: "expense", amount: 15.49, currency: "USD", category: "Subscriptions", tags: ["entertainment"], paymentMethod: "credit", accountId: "acc-4", description: "Netflix", isRecurring: true, createdAt: now },
    { id: "tx-5", date: txDates[4], type: "expense", amount: 52.0, currency: "USD", category: "Transport", tags: [], paymentMethod: "debit", accountId: "acc-1", description: "Shell Gas", isRecurring: false, createdAt: now },
    { id: "tx-6", date: txDates[5], type: "expense", amount: 28.0, currency: "USD", category: "Health", tags: ["pharmacy"], paymentMethod: "debit", accountId: "acc-1", description: "CVS Pharmacy", isRecurring: false, createdAt: now },
    { id: "tx-7", date: txDates[6], type: "expense", amount: 1450.0, currency: "USD", category: "Housing", tags: ["rent"], paymentMethod: "transfer", accountId: "acc-1", description: "Rent", isRecurring: true, createdAt: now },
    { id: "tx-8", date: txDates[7], type: "expense", amount: 10.99, currency: "USD", category: "Subscriptions", tags: ["music"], paymentMethod: "credit", accountId: "acc-4", description: "Spotify", isRecurring: true, createdAt: now },
    { id: "tx-9", date: txDates[8], type: "income", amount: 1730, currency: "USD", category: "Freelance", tags: ["work"], paymentMethod: "transfer", accountId: "acc-1", description: "Client Invoice #11", isRecurring: false, createdAt: now },
    { id: "tx-10", date: txDates[9], type: "expense", amount: 89.0, currency: "USD", category: "Groceries", tags: ["food"], paymentMethod: "debit", accountId: "acc-1", description: "Whole Foods", isRecurring: false, createdAt: now },
  ]);

  // Bills
  await db.bills.bulkAdd([
    { id: "bill-1", name: "Rent", amount: 1450, currency: "USD", dueDay: 1, status: "unpaid", category: "Housing", isRecurring: true, accountId: "acc-1", createdAt: now },
    { id: "bill-2", name: "Internet", amount: 59.99, currency: "USD", dueDay: 5, status: "unpaid", category: "Utilities", isRecurring: true, accountId: "acc-1", createdAt: now },
    { id: "bill-3", name: "Spotify", amount: 10.99, currency: "USD", dueDay: 8, status: "upcoming", category: "Subscriptions", isRecurring: true, accountId: "acc-4", createdAt: now },
    { id: "bill-4", name: "Netflix", amount: 15.49, currency: "USD", dueDay: 12, status: "upcoming", category: "Subscriptions", isRecurring: true, accountId: "acc-4", createdAt: now },
    { id: "bill-5", name: "Electric", amount: 78.0, currency: "USD", dueDay: 15, status: "paid", category: "Utilities", isRecurring: true, accountId: "acc-1", lastPaidDate: today, createdAt: now },
    { id: "bill-6", name: "Phone", amount: 45.0, currency: "USD", dueDay: 20, status: "paid", category: "Utilities", isRecurring: true, accountId: "acc-1", lastPaidDate: today, createdAt: now },
  ]);

  // Debts
  await db.debts.bulkAdd([
    { id: "debt-1", name: "Credit Card (Amex)", originalAmount: 3200, currentBalance: 1240, currency: "USD", interestRate: 19.99, minimumPayment: 35, createdAt: now },
    { id: "debt-2", name: "Student Loan", originalAmount: 20000, currentBalance: 8400, currency: "USD", interestRate: 5.5, minimumPayment: 220, createdAt: now },
    { id: "debt-3", name: "Personal Loan", originalAmount: 3000, currentBalance: 500, currency: "USD", interestRate: 8.0, minimumPayment: 100, createdAt: now },
  ]);

  // Health logs (last 30 days)
  const healthLogs: HealthLog[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const isMissed = i === 6 || i === 14; // two missed days
    const adderallTaken = i < 10; // started adderall 10 days ago
    healthLogs.push({
      id: `hl-${i}`,
      date: dateStr,
      hivMed: !isMissed,
      hivMedTime: !isMissed ? "08:30" : undefined,
      adderall: adderallTaken && !isMissed,
      adderallTime: adderallTaken && !isMissed ? "09:00" : undefined,
      weed: Math.random() > 0.6,
      mood: ([3, 4, 3, 5, 4, 5, 3, 4, 4, 3] as MoodLevel[])[i % 10],
      sleep: 6.5 + Math.random() * 2,
      notes: i === 3 ? "Good focus today. Medication helping." : undefined,
      createdAt: d.toISOString(),
      updatedAt: d.toISOString(),
    });
  }
  await db.healthLogs.bulkAdd(healthLogs);

  // Tasks
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 2);

  await db.tasks.bulkAdd([
    { id: "task-1", title: "Call landlord about leak", category: "home", dueDate: yesterday.toISOString().split("T")[0], isRecurring: false, completed: false, priority: "high", createdAt: now },
    { id: "task-2", title: "Pay Rent online", category: "finance", dueDate: (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + 1); return d.toISOString().split("T")[0]; })(), isRecurring: false, completed: false, priority: "high", createdAt: now },
    { id: "task-3", title: "Schedule dentist appointment", category: "health", isRecurring: false, completed: false, priority: "medium", createdAt: now },
    { id: "task-4", title: "Buy groceries", category: "home", isRecurring: false, completed: true, completedAt: today, priority: "low", createdAt: now },
    { id: "task-5", title: "Take out trash", category: "home", dueDate: today, isRecurring: true, recurringInterval: "weekly", completed: false, priority: "low", createdAt: now },
  ]);

  // Quick links
  await db.quickLinks.bulkAdd([
    { id: "ql-1", name: "Chase", url: "https://chase.com", emoji: "🏦", category: "Finance", sortOrder: 0 },
    { id: "ql-2", name: "Amex", url: "https://americanexpress.com", emoji: "💳", category: "Finance", sortOrder: 1 },
    { id: "ql-3", name: "MyChart", url: "https://mychart.com", emoji: "🏥", category: "Health", sortOrder: 2 },
    { id: "ql-4", name: "Gmail", url: "https://gmail.com", emoji: "📧", category: "Productivity", sortOrder: 3 },
    { id: "ql-5", name: "Netflix", url: "https://netflix.com", emoji: "🎬", category: "Entertainment", sortOrder: 4 },
    { id: "ql-6", name: "Spotify", url: "https://spotify.com", emoji: "🎵", category: "Entertainment", sortOrder: 5 },
    { id: "ql-7", name: "iCloud", url: "https://icloud.com", emoji: "☁️", category: "Productivity", sortOrder: 6 },
    { id: "ql-8", name: "GitHub", url: "https://github.com", emoji: "🐙", category: "Work", sortOrder: 7 },
  ]);

  // House entries
  await db.houseEntries.bulkAdd([
    { id: "he-1", title: "Circuit Breaker", content: "Basement utility room, left side panel · Code: 2847", category: "utility", emoji: "🔌", createdAt: now, updatedAt: now },
    { id: "he-2", title: "Water Shutoff", content: "Under kitchen sink, blue valve. Turn clockwise to close.", category: "utility", emoji: "🔧", createdAt: now, updatedAt: now },
    { id: "he-3", title: "Trash Day", content: "Tuesday & Friday pickups. Recycling every other Wednesday.", category: "rule", emoji: "🗑️", createdAt: now, updatedAt: now },
    { id: "he-4", title: "Thermostat", content: "Nest thermostat · App: Nest · Max heat: 74°F per building rules", category: "appliance", emoji: "🌡️", createdAt: now, updatedAt: now },
    { id: "he-5", title: "Packages", content: "Mailroom code: 1234. Hours 8am–8pm. Call super after hours.", category: "rule", emoji: "📦", createdAt: now, updatedAt: now },
    { id: "he-6", title: "WiFi", content: "Network: ApartmentWifi5G · Password: sunshine2024!", category: "utility", emoji: "📶", createdAt: now, updatedAt: now },
  ]);

  // Contacts
  await db.contacts.bulkAdd([
    { id: "con-1", name: "Super (Mike)", initials: "SM", role: "Building maintenance", phone: "(212) 555-0142", category: "Home", color: "#4F7CFF", createdAt: now },
    { id: "con-2", name: "Dr. Reyes", initials: "DR", role: "Primary care physician", phone: "(646) 555-0198", email: "dr.reyes@clinic.com", category: "Health", color: "#5BB88A", createdAt: now },
    { id: "con-3", name: "Landlord (Lisa)", initials: "LL", role: "Rent & apartment issues", phone: "(718) 555-0167", category: "Home", color: "#F5A623", createdAt: now },
  ]);

  // Notes
  await db.notes.bulkAdd([
    { id: "note-1", title: "Moving checklist 2025", content: "- Change address at USPS\n- Update bank address\n- Transfer utilities\n- Forward mail", tags: ["moving", "life"], category: "personal", isPinned: true, createdAt: now, updatedAt: now },
    { id: "note-2", title: "Appliance warranties", content: "Fridge: Samsung RF23, expires 2026\nWasher: LG WM3, expires 2025\nAC: Frigidaire, expires 2027", tags: ["home", "appliances"], category: "home", isPinned: false, createdAt: now, updatedAt: now },
    { id: "note-3", title: "Doctor visit notes", content: "Mar 5: Labs look good. Continue current meds. Follow up in 3 months.", tags: ["health", "doctor"], category: "health", isPinned: false, createdAt: now, updatedAt: now },
  ]);
}

// ─── IMPORT / EXPORT ──────────────────────────────────────────────────────────
export async function exportAllData(): Promise<string> {
  const [
    transactions, bills, debts, accounts, healthLogs,
    tasks, notes, quickLinks, houseEntries, contacts,
  ] = await Promise.all([
    db.transactions.toArray(),
    db.bills.toArray(),
    db.debts.toArray(),
    db.accounts.toArray(),
    db.healthLogs.toArray(),
    db.tasks.toArray(),
    db.notes.toArray(),
    db.quickLinks.toArray(),
    db.houseEntries.toArray(),
    db.contacts.toArray(),
  ]);

  return JSON.stringify(
    { transactions, bills, debts, accounts, healthLogs, tasks, notes, quickLinks, houseEntries, contacts, exportedAt: new Date().toISOString() },
    null,
    2
  );
}

export async function importAllData(json: string): Promise<void> {
  const data = JSON.parse(json);
  await db.transaction("rw", [db.transactions, db.bills, db.debts, db.accounts, db.healthLogs, db.tasks, db.notes, db.quickLinks, db.houseEntries, db.contacts], async () => {
    if (data.transactions) { await db.transactions.clear(); await db.transactions.bulkAdd(data.transactions); }
    if (data.bills) { await db.bills.clear(); await db.bills.bulkAdd(data.bills); }
    if (data.debts) { await db.debts.clear(); await db.debts.bulkAdd(data.debts); }
    if (data.accounts) { await db.accounts.clear(); await db.accounts.bulkAdd(data.accounts); }
    if (data.healthLogs) { await db.healthLogs.clear(); await db.healthLogs.bulkAdd(data.healthLogs); }
    if (data.tasks) { await db.tasks.clear(); await db.tasks.bulkAdd(data.tasks); }
    if (data.notes) { await db.notes.clear(); await db.notes.bulkAdd(data.notes); }
    if (data.quickLinks) { await db.quickLinks.clear(); await db.quickLinks.bulkAdd(data.quickLinks); }
    if (data.houseEntries) { await db.houseEntries.clear(); await db.houseEntries.bulkAdd(data.houseEntries); }
    if (data.contacts) { await db.contacts.clear(); await db.contacts.bulkAdd(data.contacts); }
  });
}

