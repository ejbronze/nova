# Nova — Your Personal Life OS

> A private, local-first personal operating system for **money**, **health**, and **life admin**. Everything in one place, nothing leaves your device.

---

## What it does

Nova replaces the scattered spreadsheets, note apps, and habit trackers with a single, fast, beautifully designed dashboard. It's built for real life — with dual-currency support (USD + DOP), medication tracking, gym logging, debt payoff, and a task system that doesn't get in your way.

The latest pass adds a zodiac-powered personalization layer, a more fluid masonry home dashboard, a weather snapshot, and a branded startup animation so the app feels more like a living personal cockpit than a static tracker.

---

## Features

### 💰 Money
- Track income, expenses & withdrawals across multiple accounts (USD + DOP)
- DOP → USD auto-conversion when logging transactions (editable rate)
- Transactions list shows USD equivalents for DOP entries
- Bills tracker with due-date countdown and one-click mark-paid
- Debt view with animated category filter (Credit Card, Collections, Mortgage, Other)
- Monthly income vs expenses bar chart + spending by category donut
- Live USD ↔ DOP FX converter with editable rate
- Guided prompts to log expenses, income, and recurring charges faster
- Budget nudges, small-win celebrations, and rotating money notes on the overview

### 🌿 Health
- Daily medication log (HIV med, Adderall, cannabis) with time stamps
- Explicit edit, save, and clear controls for medication details and daily notes
- Mood tracker (1–5) + sleep logging in hours and minutes
- Gym session logger — workout name, cardio toggle, type / duration / distance
- Gym tab with cardio history bar charts (duration + distance)
- 31-day calendar view color-coded by medication compliance
- Streak counters per medication + logging streak
- 30-day mood trend chart

### 🗂 Life Admin
- Task manager with priority levels and categories
- Quick links grid with real site/company logos derived from each link URL
- House manual (appliances, utilities, rules)
- Key contacts
- Pinnable notes

### ⚙️ Settings
- Switch primary currency (USD / DOP)
- Update exchange rate manually
- Pick a zodiac sign theme that customizes nav colors, accent styling, and dashboard layout emphasis
- Rearrange dashboard cards, resize them, and reset the layout
- Full JSON export / import backup
- One-click data reset

### ✨ Personalization
- 12 zodiac theme presets with custom palette tokens and sign metadata
- Theme-aware navigation, buttons, and settings states powered by CSS variables
- Masonry-style home dashboard with drag arrangement mode and saved card sizing
- Weather widget on the home screen for a quick local conditions snapshot
- Animated black intro screen where the three logo nodes bounce into place before sign-in

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
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app seeds realistic sample data on first load. All data lives in your browser's IndexedDB — no backend, no accounts, nothing sent anywhere.

If Google Fonts are unavailable in your network environment, local development still works, but a production `next build` may fail until those font assets can be fetched.

---

## Deploy

Deployed on Vercel. The `vercel.json` at the root sets the framework to `nextjs` and output directory to `.next`.

```bash
npm run build   # local build check
```

---

## Data & Privacy

Nova is 100% local-first. There is no server, no analytics, no user accounts. Use **Settings → Export** to back up your data as JSON, and **Import** to restore it on any device.

---

## Home Dashboard

The home screen is designed as a single personal command surface rather than a list of separate pages. In normal use it renders as a masonry board so the cards feel more fluid and tablet-like. In arrange mode, users can:

- drag cards by handle to change position
- cycle card size through small, medium, and large
- reset the layout back to its default state

The chosen layout is persisted locally and restored on refresh.

---

## Logo

Three constellation nodes — **blue** (money), **green** (health), **orange** (life) — connected by subtle lines on a dark background. Represents the three interconnected pillars of your personal OS.
