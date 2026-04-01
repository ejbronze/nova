"use client";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { todayStr, calculateStreak, generateId } from "@/lib/utils";
import { Card, CardHeader, CardTitle, PageHeader, Badge, Button, EmptyState } from "@/components/ui";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { HealthLog, MoodLevel } from "@/types";

const TABS = ["Today", "Calendar", "Streaks", "Notes"] as const;
type Tab = typeof TABS[number];

const MOOD_LABELS: Record<number, string> = { 1: "😞 Low", 2: "😕 Meh", 3: "😐 Okay", 4: "🙂 Good", 5: "😊 Great" };

function TodayLog() {
  const today = todayStr();
  const log = useLiveQuery(() => db.healthLogs.get({ date: today }), [today]);
  const [saving, setSaving] = useState(false);

  const update = async (patch: Partial<HealthLog>) => {
    setSaving(true);
    const existing = await db.healthLogs.get({ date: today });
    const now = new Date().toISOString();
    if (existing) {
      await db.healthLogs.update(existing.id, { ...patch, updatedAt: now });
    } else {
      await db.healthLogs.add({
        id: generateId(),
        date: today,
        hivMed: false,
        adderall: false,
        weed: false,
        createdAt: now,
        updatedAt: now,
        ...patch,
      });
    }
    setSaving(false);
  };

  const toggle = (field: "hivMed" | "adderall" | "weed") => {
    const newVal = !(log?.[field] ?? false);
    const timeField = field === "hivMed" ? "hivMedTime" : field === "adderall" ? "adderallTime" : null;
    const patch: Partial<HealthLog> = { [field]: newVal };
    if (timeField) patch[timeField] = newVal ? new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : undefined;
    update(patch);
  };

  const meds = [
    { key: "hivMed" as const, label: "HIV Medication", emoji: "💊", timeKey: "hivMedTime" as const, color: "text-health" },
    { key: "adderall" as const, label: "Adderall", emoji: "🧠", timeKey: "adderallTime" as const, color: "text-money" },
    { key: "weed" as const, label: "Cannabis", emoji: "🌿", timeKey: null, color: "text-life" },
  ];

  return (
    <div className="grid grid-cols-[1fr_1fr] gap-5">
      <Card>
        <CardHeader><CardTitle>Medications</CardTitle>
          {saving && <span className="text-xs text-nova-muted">Saving…</span>}
        </CardHeader>
        <div className="space-y-4">
          {meds.map(med => (
            <div key={med.key} className={`flex items-center justify-between p-3 rounded-xl transition-all ${log?.[med.key] ? "bg-nova-bg" : "bg-white"}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{med.emoji}</span>
                <div>
                  <p className="font-medium text-sm">{med.label}</p>
                  {med.timeKey && log?.[med.timeKey] && (
                    <p className="text-xs text-nova-muted">Logged at {log[med.timeKey]}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => toggle(med.key)}
                className={`w-12 h-6 rounded-full transition-all relative ${log?.[med.key] ? "bg-health" : "bg-nova-border"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${log?.[med.key] ? "left-6" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Mood</CardTitle></CardHeader>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5].map(m => (
              <button
                key={m}
                onClick={() => update({ mood: m as MoodLevel })}
                className={`flex-1 py-2 rounded-xl border-2 text-lg transition-all ${log?.mood === m ? "border-health bg-health/10" : "border-nova-border hover:border-health/50"}`}
              >
                {MOOD_LABELS[m].split(" ")[0]}
              </button>
            ))}
          </div>
          {log?.mood && <p className="text-sm text-center mt-2 text-nova-muted">{MOOD_LABELS[log.mood]}</p>}
        </Card>

        <Card>
          <CardHeader><CardTitle>Sleep</CardTitle></CardHeader>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0} max={24} step={0.5}
              value={log?.sleep ?? ""}
              onChange={e => update({ sleep: parseFloat(e.target.value) || undefined })}
              placeholder="Hours"
              className="w-24 px-3 py-2 rounded-lg border border-nova-border text-sm outline-none focus:border-health"
            />
            <span className="text-sm text-nova-muted">hours last night</span>
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <textarea
            value={log?.notes ?? ""}
            onChange={e => update({ notes: e.target.value })}
            placeholder="How are you feeling today?"
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-nova-border text-sm outline-none focus:border-health resize-none"
          />
        </Card>
      </div>
    </div>
  );
}

function HealthCalendar() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const logs = useLiveQuery(() => db.healthLogs.where("date").startsWith(month).toArray(), [month]);

  const logMap: Record<string, HealthLog> = {};
  (logs ?? []).forEach(l => { logMap[l.date] = l; });

  const [year, mon] = month.split("-").map(Number);
  const firstDay = new Date(year, mon - 1, 1).getDay();
  const daysInMonth = new Date(year, mon, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${month}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, log: logMap[dateStr] });
  }

  const prevMonth = () => {
    const d = new Date(`${month}-01`);
    d.setMonth(d.getMonth() - 1);
    setMonth(d.toISOString().slice(0, 7));
  };
  const nextMonth = () => {
    const d = new Date(`${month}-01`);
    d.setMonth(d.getMonth() + 1);
    setMonth(d.toISOString().slice(0, 7));
  };

  const getColor = (log?: HealthLog) => {
    if (!log) return "bg-nova-bg";
    if (log.hivMed && log.adderall) return "bg-health text-white";
    if (log.hivMed || log.adderall) return "bg-life/60";
    return "bg-danger/30";
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 hover:bg-nova-bg rounded-lg">←</button>
        <h3 className="font-semibold">
          {new Date(`${month}-01`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h3>
        <button onClick={nextMonth} className="p-1 hover:bg-nova-bg rounded-lg">→</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-nova-muted mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => (
          <div key={i} className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium ${cell ? getColor(cell.log) : ""}`}>
            {cell?.day}
            {cell?.log?.mood && <span className="text-[8px]">{["", "😞", "😕", "😐", "🙂", "😊"][cell.log.mood]}</span>}
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-4 text-xs text-nova-muted">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-health inline-block" /> All meds</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-life/60 inline-block" /> Partial</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-danger/30 inline-block" /> Logged only</span>
      </div>
    </Card>
  );
}

function Streaks() {
  const allLogs = useLiveQuery(() => db.healthLogs.orderBy("date").toArray(), []);
  const dates = (allLogs ?? []).map(l => l.date);
  const hivDates = (allLogs ?? []).filter(l => l.hivMed).map(l => l.date);
  const adderallDates = (allLogs ?? []).filter(l => l.adderall).map(l => l.date);

  const moodData = (allLogs ?? []).slice(-30).map(l => ({
    date: l.date.slice(5),
    mood: l.mood ?? 0,
    sleep: l.sleep ?? 0,
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "HIV Meds Streak", dates: hivDates, emoji: "💊" },
          { label: "Adderall Streak", dates: adderallDates, emoji: "🧠" },
          { label: "Logging Streak", dates, emoji: "📝" },
        ].map(s => {
          const streak = calculateStreak(s.dates);
          return (
            <Card key={s.label} className="text-center">
              <p className="text-4xl mb-1">{s.emoji}</p>
              <p className="text-3xl font-bold text-health">{streak}</p>
              <p className="text-sm text-nova-muted">{s.label}</p>
              <p className="text-xs text-nova-muted mt-1">day streak</p>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>Mood over time</CardTitle></CardHeader>
        {moodData.length > 1 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={moodData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
              <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10 }} width={20} />
              <Tooltip formatter={(v: number) => MOOD_LABELS[v] ?? v} />
              <Line type="monotone" dataKey="mood" stroke="#5BB88A" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-nova-muted text-sm text-center py-8">Log a few days to see your mood trend</p>
        )}
      </Card>
    </div>
  );
}

export default function HealthPage() {
  const [tab, setTab] = useState<Tab>("Today");

  return (
    <div className="animate-fadeIn">
      <PageHeader title="🌿 Health" subtitle="Daily wellness tracking" />

      <div className="flex gap-1 mb-6 bg-white border border-nova-border rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-health text-white shadow-sm" : "text-nova-muted hover:text-nova-text"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Today" && <TodayLog />}
      {tab === "Calendar" && <HealthCalendar />}
      {tab === "Streaks" && <Streaks />}
      {tab === "Notes" && (
        <EmptyState emoji="📝" title="Health Notes" subtitle="Coming soon — journal your health observations" />
      )}
    </div>
  );
}
