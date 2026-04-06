# Nova — Your Personal Life OS

> A private, local-first personal operating system for **money**, **health**, and **life admin**. Everything in one place, nothing leaves your device.

---

## What it does

Nova replaces the scattered spreadsheets, note apps, and habit trackers with a single, fast, beautifully designed dashboard. It's built for real life — with dual-currency support (USD + DOP), medication tracking, gym logging, debt payoff, and a task system that doesn't get in your way.

---

## Features

### 💰 Money
- Track income, expenses & withdrawals across multiple accounts (USD + DOP)
- DOP → USD auto-conversion when logging transactions (editable rate)
- Bills tracker with due-date countdown and one-click mark-paid
- Debt view with animated category filter (Credit Card, Collections, Mortgage, Other)
- Monthly income vs expenses bar chart + spending by category donut
- Live USD ↔ DOP FX converter with editable rate
- Financial incentive / streak system for staying on budget

### 🌿 Health
- Daily medication log (HIV med, Adderall, cannabis) with time stamps
- Mood tracker (1–5) + sleep logging (rounded to nearest tenth)
- Gym session logger — workout name, cardio toggle, type / duration / distance
- Gym tab with cardio history bar charts (duration + distance)
- 31-day calendar view color-coded by medication compliance
- Streak counters per medication + logging streak
- 30-day mood trend chart

### 🗂 Life Admin
- Task manager with priority levels and categories
- Quick links grid (organized by category)
- House manual (appliances, utilities, rules)
- Key contacts
- Pinnable notes
- Local calendar workspace with optional two-way Google Calendar sync

### ⚙️ Settings
- Switch primary currency (USD / DOP)
- Update exchange rate manually
- Full JSON export / import backup
- One-click data reset
- Google Calendar OAuth connection and sync controls

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + custom design tokens |
| Database | Dexie.js (IndexedDB — fully local) |
| Charts | Recharts |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Fonts | DM Serif Display + DM Sans |

---

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app seeds realistic sample data on first load. Most data lives in your browser's IndexedDB. If you enable Google Calendar sync, calendar events will sync with your Google account.

For Google Calendar sync, add these env vars to `.env.local`:

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback
```

---

## Deploy

Deployed on Vercel. The `vercel.json` at the root sets the framework to `nextjs` and output directory to `.next`.

```bash
npm run build   # local build check
```

---

## Data & Privacy

Nova is local-first by default. There is no app backend database, no analytics, and no user accounts. Use **Settings → Export** to back up your data as JSON, and **Import** to restore it on any device. If you connect Google Calendar, synced event data will flow between Nova and Google Calendar.

---

## Logo

Three constellation nodes — **blue** (money), **green** (health), **orange** (life) — connected by subtle lines on a dark background. Represents the three interconnected pillars of your personal OS.
