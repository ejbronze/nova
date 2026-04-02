"use client";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useAppStore } from "@/lib/store";
import { todayStr, calculateStreak, generateId, getMedicationEntries, getMedicationTakenCount, getZodiacReward } from "@/lib/utils";
import { Card, CardHeader, CardTitle, PageHeader, Badge, Button, EmptyState } from "@/components/ui";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import type { HealthLog, MoodLevel, GymSession, CardioType, MedicationEntry } from "@/types";

const TABS = ["Today", "Calendar", "Streaks", "Gym", "Notes"] as const;
type Tab = typeof TABS[number];

const CARDIO_EMOJI: Record<string, string> = {
  run: "🏃", bike: "🚴", elliptical: "⚙️", swim: "🏊", rowing: "🚣", other: "🏋️",
};
const CARDIO_OPTIONS: [CardioType, string][] = [
  ["run", "🏃 Run"], ["bike", "🚴 Bike"], ["elliptical", "⚙️ Elliptical"],
  ["swim", "🏊 Swim"], ["rowing", "🚣 Rowing"], ["other", "🏋️ Other"],
];

function formatSleepDuration(value?: number) {
  if (value == null || Number.isNaN(value)) return "Not logged";
  const totalMinutes = Math.round(value * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function calculateZodiacPoints(log: HealthLog | undefined, gymCount: number) {
  const medsTaken = getMedicationTakenCount(log);
  let total = medsTaken * 12;
  if (log?.mood) total += 8;
  if ((log?.sleep ?? 0) >= 7) total += 10;
  if (log?.notes?.trim()) total += 4;
  if (gymCount > 0) total += 12;
  return total;
}

function GymSessionModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [isCardio, setIsCardio] = useState(false);
  const [cardioType, setCardioType] = useState<CardioType>("run");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await db.gymSessions.add({
      id: generateId(),
      date: todayStr(),
      name: name.trim(),
      isCardio,
      cardioType: isCardio ? cardioType : undefined,
      duration: duration ? parseFloat(duration) : undefined,
      distance: distance ? parseFloat(distance) : undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl">Log Gym Session</h2>
          <button onClick={onClose} className="text-nova-muted hover:text-nova-text text-lg leading-none">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-nova-muted mb-1 block">What was the workout?</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Upper body, Leg day, 5k run…"
              className="w-full px-3 py-2.5 border border-nova-border rounded-xl text-sm outline-none focus:border-health"
              autoFocus
              onKeyDown={e => e.key === "Enter" && save()}
            />
          </div>

          <div className={`flex items-center justify-between p-3 rounded-xl transition-all ${isCardio ? "bg-health/10" : "bg-nova-bg"}`}>
            <div className="flex items-center gap-2">
              <span>🏃</span>
              <span className="text-sm font-medium">Cardio session?</span>
            </div>
            <button
              onClick={() => setIsCardio(!isCardio)}
              className={`w-12 h-6 rounded-full transition-all relative ${isCardio ? "bg-health" : "bg-nova-border"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${isCardio ? "left-6" : "left-0.5"}`} />
            </button>
          </div>

          {isCardio && (
            <>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-nova-muted mb-1 block">Cardio Type</label>
                <select
                  value={cardioType}
                  onChange={e => setCardioType(e.target.value as CardioType)}
                  className="w-full px-3 py-2.5 border border-nova-border rounded-xl text-sm outline-none focus:border-health bg-white"
                >
                  {CARDIO_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-nova-muted mb-1 block">Duration (min)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    placeholder="45"
                    className="w-full px-3 py-2.5 border border-nova-border rounded-xl text-sm outline-none focus:border-health"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-nova-muted mb-1 block">Distance (mi)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={distance}
                    onChange={e => setDistance(e.target.value)}
                    placeholder="3.1"
                    className="w-full px-3 py-2.5 border border-nova-border rounded-xl text-sm outline-none focus:border-health"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-nova-muted mb-1 block">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="How did it go?"
              rows={2}
              className="w-full px-3 py-2 border border-nova-border rounded-xl text-sm outline-none focus:border-health resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-nova-border rounded-xl text-sm font-medium text-nova-muted hover:bg-nova-bg transition-colors">Cancel</button>
          <button
            onClick={save}
            disabled={!name.trim() || saving}
            className="flex-1 py-2.5 bg-health text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-health/90 transition-colors"
          >
            {saving ? "Saving…" : "Log Session"}
          </button>
        </div>
      </div>
    </div>
  );
}

const MOOD_LABELS: Record<number, string> = { 1: "😞 Low", 2: "😕 Meh", 3: "😐 Okay", 4: "🙂 Good", 5: "😊 Great" };

function TodayLog() {
  const { settings } = useAppStore();
  const today = todayStr();
  const log = useLiveQuery(() => db.healthLogs.get({ date: today }), [today]);
  const todayGymSessions = useLiveQuery(() => db.gymSessions.where("date").equals(today).toArray(), [today]);
  const [saving, setSaving] = useState(false);
  const [showGymModal, setShowGymModal] = useState(false);

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
        medications: [],
        createdAt: now,
        updatedAt: now,
        ...patch,
      });
    }
    setSaving(false);
  };
  const medications = getMedicationEntries(log);
  const zodiacReward = getZodiacReward(settings?.zodiacSign);
  const zodiacPoints = calculateZodiacPoints(log, (todayGymSessions ?? []).length);
  const sleepHours = log?.sleep != null ? Math.floor(log.sleep) : "";
  const sleepMinutes = log?.sleep != null ? Math.round((log.sleep - Math.floor(log.sleep)) * 60) : "";

  const saveMedications = async (nextMedications: MedicationEntry[]) => {
    await update({
      medications: nextMedications,
      hivMed: undefined,
      hivMedTime: undefined,
      adderall: undefined,
      adderallTime: undefined,
      weed: undefined,
      weedNotes: undefined,
    });
  };

  const updateMedication = (medId: string, patch: Partial<MedicationEntry>) => {
    const nextMedications = medications.map((med) => (med.id === medId ? { ...med, ...patch } : med));
    void saveMedications(nextMedications);
  };

  const addMedication = () => {
    const nextMedications = [
      ...medications,
      { id: generateId("med"), name: "", taken: false, time: "", notes: "" },
    ];
    void saveMedications(nextMedications);
  };

  const removeMedication = (medId: string) => {
    void saveMedications(medications.filter((med) => med.id !== medId));
  };

  const updateSleepPart = (part: "hours" | "minutes", rawValue: string) => {
    const currentHours = typeof sleepHours === "number" ? sleepHours : parseInt(String(sleepHours || "0"), 10) || 0;
    const currentMinutes = typeof sleepMinutes === "number" ? sleepMinutes : parseInt(String(sleepMinutes || "0"), 10) || 0;
    const nextHours = part === "hours" ? Math.max(0, parseInt(rawValue || "0", 10) || 0) : currentHours;
    const nextMinutesBase = part === "minutes" ? parseInt(rawValue || "0", 10) || 0 : currentMinutes;
    const nextMinutes = Math.min(59, Math.max(0, nextMinutesBase));
    if (!rawValue && part === "hours" && !nextMinutes) {
      void update({ sleep: undefined });
      return;
    }
    void update({ sleep: nextHours + nextMinutes / 60 });
  };

  return (
    <>
    {showGymModal && <GymSessionModal onClose={() => setShowGymModal(false)} />}
    <div className="grid grid-cols-[1fr_1fr] gap-5">
      <Card>
        <CardHeader><CardTitle>Medications</CardTitle>
          {saving && <span className="text-xs text-nova-muted">Saving…</span>}
        </CardHeader>
        <div className="space-y-4">
          {medications.length === 0 && (
            <div className="rounded-xl border border-dashed border-nova-border bg-nova-bg px-4 py-5 text-sm text-nova-muted">
              No medications added yet. Add the medications you actually want to track.
            </div>
          )}
          {medications.map((medication) => (
            <div key={medication.id} className="rounded-xl border border-nova-border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    value={medication.name}
                    onChange={(e) => updateMedication(medication.id, { name: e.target.value })}
                    placeholder="Medication name"
                    className="w-full rounded-lg border border-nova-border px-3 py-2 text-sm outline-none focus:border-health"
                  />
                  <div className="grid grid-cols-[150px_1fr] gap-3">
                    <input
                      type="time"
                      value={medication.time ?? ""}
                      onChange={(e) => updateMedication(medication.id, { time: e.target.value })}
                      className="rounded-lg border border-nova-border px-3 py-2 text-sm outline-none focus:border-health"
                    />
                    <input
                      type="text"
                      value={medication.notes ?? ""}
                      onChange={(e) => updateMedication(medication.id, { notes: e.target.value })}
                      placeholder="Notes or dosage"
                      className="rounded-lg border border-nova-border px-3 py-2 text-sm outline-none focus:border-health"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <button
                    onClick={() => updateMedication(medication.id, { taken: !medication.taken })}
                    className={`w-12 h-6 rounded-full transition-all relative ${medication.taken ? "bg-health" : "bg-nova-border"}`}
                    aria-label={`Mark ${medication.name || "medication"} as taken`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${medication.taken ? "left-6" : "left-0.5"}`} />
                  </button>
                  <button
                    onClick={() => removeMedication(medication.id)}
                    className="text-xs font-medium text-danger hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={addMedication}
            className="w-full rounded-xl border border-dashed border-health/40 bg-health/5 px-4 py-3 text-sm font-medium text-health transition-colors hover:bg-health/10"
          >
            + Add medication
          </button>
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>{zodiacReward.badge} Points</CardTitle></CardHeader>
          <div className="rounded-2xl bg-[linear-gradient(135deg,rgba(111,114,255,0.08),rgba(255,255,255,0.9))] p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-nova-muted">{zodiacReward.pointsName} earned today</p>
                <p className="mt-1 font-serif text-4xl text-nova-text">{zodiacPoints}</p>
              </div>
              <div className="rounded-full bg-life/10 px-3 py-1 text-xs font-medium text-life">
                {(settings?.zodiacSign ?? "nova").toUpperCase()}
              </div>
            </div>
            <p className="mt-3 text-sm text-nova-muted">{zodiacReward.ritual}</p>
          </div>
        </Card>

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
              min={0} max={24}
              value={sleepHours}
              onChange={e => updateSleepPart("hours", e.target.value)}
              placeholder="Hours"
              className="w-24 px-3 py-2 rounded-lg border border-nova-border text-sm outline-none focus:border-health"
            />
            <span className="text-sm text-nova-muted">hours</span>
            <input
              type="number"
              min={0} max={59}
              value={sleepMinutes}
              onChange={e => updateSleepPart("minutes", e.target.value)}
              placeholder="Minutes"
              className="w-24 px-3 py-2 rounded-lg border border-nova-border text-sm outline-none focus:border-health"
            />
            <span className="text-sm text-nova-muted">minutes</span>
          </div>
          <p className="mt-2 text-xs text-nova-muted">Current sleep: {formatSleepDuration(log?.sleep)}</p>
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

    <div className="mt-5">
      <Card>
        <CardHeader>
          <CardTitle>🏋️ Gym</CardTitle>
          <button
            onClick={() => setShowGymModal(true)}
            className="px-3 py-1.5 bg-health text-white text-xs font-medium rounded-lg hover:bg-health/90 transition-colors"
          >
            + Log Session
          </button>
        </CardHeader>
        {(todayGymSessions ?? []).length === 0 ? (
          <p className="text-sm text-nova-muted text-center py-3">No sessions logged today</p>
        ) : (
          <div className="space-y-2">
            {(todayGymSessions ?? []).map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-nova-bg">
                <span className="text-xl">{s.isCardio ? (CARDIO_EMOJI[s.cardioType ?? "other"]) : "💪"}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{s.name}</p>
                  {s.isCardio && (
                    <p className="text-xs text-nova-muted">
                      {s.duration && `${s.duration} min`}{s.duration && s.distance && " · "}{s.distance && `${s.distance} mi`}
                    </p>
                  )}
                </div>
                {s.isCardio && <span className="text-xs font-medium text-health bg-health/10 px-2 py-0.5 rounded-full">Cardio</span>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
    </>
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
    const takenCount = getMedicationTakenCount(log);
    const totalCount = getMedicationEntries(log).length;
    if (takenCount > 0 && takenCount === totalCount) return "bg-health text-white";
    if (takenCount > 0) return "bg-life/60";
    if (log.mood || log.notes || log.sleep != null) return "bg-danger/30";
    return "bg-nova-bg";
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
  const { settings } = useAppStore();
  const allLogs = useLiveQuery(() => db.healthLogs.orderBy("date").toArray(), []);
  const dates = (allLogs ?? []).map(l => l.date);
  const medicationDates = (allLogs ?? []).filter(l => getMedicationTakenCount(l) > 0).map(l => l.date);
  const fullRitualDates = (allLogs ?? []).filter(l => getMedicationTakenCount(l) > 0 && (l.sleep ?? 0) >= 7 && Boolean(l.mood)).map(l => l.date);
  const zodiacReward = getZodiacReward(settings?.zodiacSign);
  const weeklyPoints = (allLogs ?? []).slice(-7).reduce((sum, entry) => sum + calculateZodiacPoints(entry, 0), 0);

  const moodData = (allLogs ?? []).slice(-30).map(l => ({
    date: l.date.slice(5),
    mood: l.mood ?? 0,
    sleep: l.sleep ?? 0,
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Medication Streak", dates: medicationDates, emoji: "💊" },
          { label: "Full Ritual Streak", dates: fullRitualDates, emoji: "🏆" },
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
        <CardHeader><CardTitle>{zodiacReward.badge} Progress</CardTitle></CardHeader>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-nova-muted">Last 7 days</p>
            <p className="mt-1 font-serif text-4xl text-nova-text">{weeklyPoints}</p>
          </div>
          <Badge>{zodiacReward.pointsName} points</Badge>
        </div>
        <p className="mt-3 text-sm text-nova-muted">{zodiacReward.ritual}</p>
      </Card>

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

function GymHistory() {
  const sessions = useLiveQuery(() => db.gymSessions.orderBy("date").reverse().toArray(), []);
  const cardioSessions = (sessions ?? []).filter(s => s.isCardio);
  const chartData = cardioSessions.slice(0, 20).reverse().map(s => ({
    date: s.date.slice(5),
    duration: s.duration ?? 0,
    distance: s.distance ?? 0,
  }));

  return (
    <div className="space-y-5">
      {cardioSessions.length > 1 && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Cardio Duration (min)</CardTitle></CardHeader>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.floor(chartData.length / 5)} />
                <YAxis tick={{ fontSize: 10 }} width={30} />
                <Tooltip />
                <Bar dataKey="duration" fill="#5BB88A" radius={[4, 4, 0, 0]} name="Duration (min)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          {chartData.some(d => d.distance > 0) && (
            <Card>
              <CardHeader><CardTitle>Distance (mi)</CardTitle></CardHeader>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData.filter(d => d.distance > 0)}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis tick={{ fontSize: 10 }} width={30} />
                  <Tooltip />
                  <Bar dataKey="distance" fill="#4F7CFF" radius={[4, 4, 0, 0]} name="Distance (mi)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>All Sessions</CardTitle>
          <span className="text-xs text-nova-muted">{(sessions ?? []).length} logged</span>
        </CardHeader>
        {(sessions ?? []).length === 0 ? (
          <EmptyState emoji="🏋️" title="No sessions yet" subtitle="Log your first session from the Today tab" />
        ) : (
          <div className="space-y-2">
            {(sessions ?? []).map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-nova-bg">
                <span className="text-xl">{s.isCardio ? (CARDIO_EMOJI[s.cardioType ?? "other"]) : "💪"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-xs text-nova-muted">
                    {new Date(s.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    {s.isCardio && s.duration && ` · ${s.duration} min`}
                    {s.isCardio && s.distance && ` · ${s.distance} mi`}
                  </p>
                </div>
                {s.isCardio
                  ? <span className="text-xs font-medium text-health bg-health/10 px-2 py-0.5 rounded-full shrink-0">Cardio</span>
                  : <span className="text-xs font-medium text-life bg-life/10 px-2 py-0.5 rounded-full shrink-0">Strength</span>
                }
              </div>
            ))}
          </div>
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
      {tab === "Gym" && <GymHistory />}
      {tab === "Notes" && (
        <EmptyState emoji="📝" title="Health Notes" subtitle="Coming soon — journal your health observations" />
      )}
    </div>
  );
}
