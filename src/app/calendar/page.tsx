"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { CalendarDays, RefreshCw, Link2, Pencil, Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { fetchGoogleCalendarStatus, pushPendingCalendarEvents, syncGoogleCalendarFromRemote } from "@/lib/google-calendar";
import { useAppStore } from "@/lib/store";
import { generateId } from "@/lib/utils";
import type { CalendarEvent } from "@/types";
import { Badge, Button, Card, CardHeader, CardTitle, EmptyState, PageHeader } from "@/components/ui";

function toInputDateTime(value: string) {
  const date = new Date(value);
  const tzOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

function fromInputDateTime(value: string) {
  return new Date(value).toISOString();
}

function nextDay(dateOnly: string) {
  const date = new Date(`${dateOnly}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function formatEventWindow(event: CalendarEvent) {
  if (event.allDay) {
    return new Date(event.start).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return new Date(event.start).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const INITIAL_FORM = {
  title: "",
  date: new Date().toISOString().slice(0, 10),
  startTime: "09:00",
  endTime: "10:00",
  allDay: false,
  description: "",
  location: "",
};

export default function CalendarPage() {
  const { settings, patchSettings } = useAppStore();
  const events = useLiveQuery(() => db.calendarEvents.orderBy("start").toArray(), []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const status = await fetchGoogleCalendarStatus();
        await patchSettings({
          googleCalendarConnected: status.connected,
          googleCalendarEmail: status.email,
          googleCalendarCalendarId: status.calendarId,
          googleCalendarCalendarName: status.calendarName,
        });
      } catch {
        // Ignore here; settings page gives deeper feedback.
      }
    };
    void loadStatus();
  }, [patchSettings]);

  const sortedEvents = useMemo(() => (events ?? []).slice().sort((a, b) => a.start.localeCompare(b.start)), [events]);
  const upcomingCount = sortedEvents.filter((event) => new Date(event.end) >= new Date()).length;
  const dirtyCount = sortedEvents.filter((event) => event.syncStatus !== "synced").length;

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (event: CalendarEvent) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    setEditingId(event.id);
    setForm({
      title: event.title,
      date: event.start.slice(0, 10),
      startTime: event.allDay ? "09:00" : start.toTimeString().slice(0, 5),
      endTime: event.allDay ? "10:00" : end.toTimeString().slice(0, 5),
      allDay: event.allDay,
      description: event.description || "",
      location: event.location || "",
    });
    setShowForm(true);
  };

  const saveEvent = async () => {
    if (!form.title.trim()) return;

    const now = new Date().toISOString();
    const existing = editingId ? await db.calendarEvents.get(editingId) : undefined;
    const allDayStart = `${form.date}T00:00:00.000Z`;
    const allDayEnd = `${nextDay(form.date)}T00:00:00.000Z`;
    const timedStart = fromInputDateTime(`${form.date}T${form.startTime}`);
    const timedEnd = fromInputDateTime(`${form.date}T${form.endTime}`);

    const event: CalendarEvent = {
      id: existing?.id || generateId("cal"),
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      location: form.location.trim() || undefined,
      start: form.allDay ? allDayStart : timedStart,
      end: form.allDay ? allDayEnd : timedEnd,
      allDay: form.allDay,
      source: existing?.source || "local",
      googleEventId: existing?.googleEventId,
      googleCalendarId: existing?.googleCalendarId || settings.googleCalendarCalendarId,
      lastSyncedAt: existing?.lastSyncedAt,
      syncStatus: existing?.googleEventId ? "pending_push" : "local_only",
      syncError: undefined,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    await db.calendarEvents.put(event);
    resetForm();
    setMessage(existing ? "Event updated locally. Run sync to push it." : "Event saved locally.");
  };

  const deleteEvent = async (event: CalendarEvent) => {
    if (event.googleEventId) {
      await db.calendarEvents.update(event.id, {
        syncStatus: "pending_delete",
        updatedAt: new Date().toISOString(),
      });
      setMessage("Event marked for deletion. Run sync to remove it from Google Calendar.");
      return;
    }

    await db.calendarEvents.delete(event.id);
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const push = await pushPendingCalendarEvents();
      const pulled = await syncGoogleCalendarFromRemote();
      const summary = `Synced ${push.created + push.updated + push.deleted} local change${push.created + push.updated + push.deleted === 1 ? "" : "s"} and pulled ${pulled} event${pulled === 1 ? "" : "s"}.`;
      setMessage(push.errors.length ? `${summary} ${push.errors.length} event sync failed.` : summary);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Calendar sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="animate-fadeIn space-y-6">
      <PageHeader title="📅 Calendar" subtitle="Local events with two-way Google Calendar sync">
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowForm((value) => !value)}>
          {showForm ? "Close" : "Add Event"}
        </Button>
      </PageHeader>

      <div className="grid gap-5 md:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-5">
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingId ? "Edit Event" : "New Event"}</CardTitle>
              </CardHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-sm text-nova-muted block mb-1">Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                    className="w-full rounded-xl border border-nova-border px-4 py-2 text-sm"
                    placeholder="Doctor visit, flight, rent reminder..."
                  />
                </div>
                <div>
                  <label className="text-sm text-nova-muted block mb-1">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((current) => ({ ...current, date: e.target.value }))}
                    className="w-full rounded-xl border border-nova-border px-4 py-2 text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <label className="inline-flex items-center gap-2 text-sm text-nova-text">
                    <input
                      type="checkbox"
                      checked={form.allDay}
                      onChange={(e) => setForm((current) => ({ ...current, allDay: e.target.checked }))}
                    />
                    All-day event
                  </label>
                </div>
                {!form.allDay && (
                  <>
                    <div>
                      <label className="text-sm text-nova-muted block mb-1">Start</label>
                      <input
                        type="time"
                        value={form.startTime}
                        onChange={(e) => setForm((current) => ({ ...current, startTime: e.target.value }))}
                        className="w-full rounded-xl border border-nova-border px-4 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-nova-muted block mb-1">End</label>
                      <input
                        type="time"
                        value={form.endTime}
                        onChange={(e) => setForm((current) => ({ ...current, endTime: e.target.value }))}
                        className="w-full rounded-xl border border-nova-border px-4 py-2 text-sm"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="text-sm text-nova-muted block mb-1">Location</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))}
                    className="w-full rounded-xl border border-nova-border px-4 py-2 text-sm"
                    placeholder="Optional"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm text-nova-muted block mb-1">Notes</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                    className="w-full rounded-xl border border-nova-border px-4 py-2 text-sm min-h-[96px]"
                    placeholder="Optional details"
                  />
                </div>
                <div className="sm:col-span-2 flex gap-2">
                  <Button variant="primary" onClick={() => void saveEvent()}>Save Event</Button>
                  <Button variant="outline" onClick={resetForm}>Cancel</Button>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              {sortedEvents.map((event) => (
                <div key={event.id} className="rounded-2xl border border-nova-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-nova-text">{event.title}</p>
                        <Badge variant={event.syncStatus === "synced" ? "health" : event.syncStatus === "error" ? "danger" : "warning"}>
                          {event.syncStatus.replace("_", " ")}
                        </Badge>
                        <Badge variant="muted">{event.source === "google" ? "Google" : "Nova"}</Badge>
                      </div>
                      <p className="text-sm text-nova-muted mt-1">{formatEventWindow(event)}</p>
                      {event.location && <p className="text-sm text-nova-muted mt-1">{event.location}</p>}
                      {event.description && <p className="text-sm text-nova-text mt-2 whitespace-pre-wrap">{event.description}</p>}
                      {event.syncError && <p className="text-xs text-danger mt-2">{event.syncError}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(event)} className="rounded-lg p-2 text-nova-muted hover:bg-nova-bg hover:text-nova-text">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => void deleteEvent(event)} className="rounded-lg p-2 text-nova-muted hover:bg-danger/10 hover:text-danger">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!sortedEvents.length && (
                <EmptyState emoji="🗓️" title="No calendar events yet" subtitle="Create one locally, then sync it to Google Calendar." />
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Sync Status</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={settings.googleCalendarConnected ? "health" : "muted"}>
                  {settings.googleCalendarConnected ? "Google connected" : "Google not connected"}
                </Badge>
                {settings.googleCalendarCalendarName && <Badge variant="muted">{settings.googleCalendarCalendarName}</Badge>}
              </div>
              {settings.googleCalendarEmail && <p className="text-sm text-nova-muted">{settings.googleCalendarEmail}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-nova-bg p-4">
                  <p className="text-xs uppercase tracking-wide text-nova-muted">Upcoming</p>
                  <p className="mt-1 text-2xl font-semibold">{upcomingCount}</p>
                </div>
                <div className="rounded-2xl bg-nova-bg p-4">
                  <p className="text-xs uppercase tracking-wide text-nova-muted">Pending Sync</p>
                  <p className="mt-1 text-2xl font-semibold">{dirtyCount}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="primary"
                  icon={<RefreshCw size={16} />}
                  onClick={() => void handleSync()}
                  disabled={!settings.googleCalendarConnected || syncing}
                >
                  {syncing ? "Syncing..." : "Run Sync"}
                </Button>
                <Button variant="outline" icon={<Link2 size={16} />} onClick={() => { window.location.href = "/settings"; }}>
                  Connection Settings
                </Button>
              </div>
              {settings.googleCalendarLastSyncAt && (
                <p className="text-xs text-nova-muted">
                  Last sync {new Date(settings.googleCalendarLastSyncAt).toLocaleString()}
                </p>
              )}
              {message && <p className="text-sm text-nova-muted">{message}</p>}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How This Works</CardTitle>
            </CardHeader>
            <div className="space-y-3 text-sm text-nova-muted">
              <div className="flex gap-2">
                <CalendarDays size={16} className="mt-0.5 text-[#4067ff]" />
                <p>Nova stores calendar events locally first, then syncs them to your selected Google Calendar.</p>
              </div>
              <div className="flex gap-2">
                <RefreshCw size={16} className="mt-0.5 text-[#4067ff]" />
                <p>Google-side edits are pulled back into Nova when you run sync.</p>
              </div>
              <div className="flex gap-2">
                <Plus size={16} className="mt-0.5 text-[#4067ff]" />
                <p>New or edited events stay marked as pending until they successfully sync.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
