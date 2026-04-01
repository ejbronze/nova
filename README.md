# Nova — Your Personal Life OS

A private, local-first app for managing **money**, **health**, and **life admin** in one place. Built for clarity, speed, and ADHD-friendly UX.

## Stack

- **Next.js 14** (App Router)
- **TypeScript** + strict mode
- **Tailwind CSS** — custom design tokens
- **Dexie.js** — IndexedDB, all data stays in your browser
- **Recharts** — spending & mood charts
- **Zustand** — app-wide settings state
- **React Hook Form + Zod** — validated forms
- **DM Serif Display + DM Sans** — fonts

## Features

### 💰 Money
- Track income, expenses & withdrawals across multiple accounts (USD + DOP)
- Bills tracker with due-date countdown
- Debt payoff progress bars
- Monthly income vs expenses bar chart
- Spending by category donut chart
- Live USD ↔ DOP converter with editable rate

### 🌿 Health
- Daily medication log (HIV med, Adderall, cannabis) with timestamps
- Mood tracker (1–5 scale) + sleep logging
- 31-day calendar view color-coded by compliance
- Streak counter for each medication
- 30-day mood trend chart

### 🗂 Life Admin
- Task manager with priority levels and categories
- Quick links grid (organized by category)
- House manual (appliances, utilities, rules)
- Key contacts
- Pinnable notes

### ⚙️ Settings
- Switch primary currency (USD / DOP)
- Update exchange rate
- Full JSON export/import backup
- One-click data reset

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

The app seeds realistic sample data on first load. All data is stored in IndexedDB — nothing leaves your device.

## Data & Privacy

Nova is 100% local-first. There is no backend, no analytics, no accounts. Your data lives in your browser's IndexedDB. Use **Settings → Export** to back up regularly.

## Customising

- **Exchange rate** — update anytime in Settings or via the FX Converter card
- **Add transactions** — click "Add Transaction" on the Money page
- **Log health** — the Health → Today tab auto-creates or updates today's entry as you tap
- **Tasks** — add inline from the Tasks tab; check off to complete

## Build

```bash
npm run build
npm start
```

Or export as a static site:

```bash
# next.config.mjs — add: output: 'export'
npm run build
# serves from /out
```
