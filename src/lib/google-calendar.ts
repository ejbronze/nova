import { db, getSettings, updateSettings } from "@/lib/db";
import type { CalendarEvent } from "@/types";

export interface GoogleCalendarStatus {
  connected: boolean;
  email?: string;
  calendarId?: string;
  calendarName?: string;
}

export interface RemoteCalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  allDay: boolean;
  updated?: string;
}

export interface SyncPushResult {
  created: number;
  updated: number;
  deleted: number;
  errors: Array<{ localId: string; message: string }>;
}

function eventToPayload(event: CalendarEvent) {
  if (event.allDay) {
    return {
      summary: event.title,
      description: event.description || undefined,
      location: event.location || undefined,
      start: { date: event.start.slice(0, 10) },
      end: { date: event.end.slice(0, 10) },
    };
  }

  return {
    summary: event.title,
    description: event.description || undefined,
    location: event.location || undefined,
    start: { dateTime: event.start },
    end: { dateTime: event.end },
  };
}

export function remoteEventToLocal(remote: RemoteCalendarEvent): CalendarEvent {
  const now = new Date().toISOString();
  return {
    id: `gcal-${remote.id}`,
    title: remote.title,
    description: remote.description,
    location: remote.location,
    start: remote.start,
    end: remote.end,
    allDay: remote.allDay,
    source: "google",
    googleEventId: remote.id,
    googleCalendarId: remote.calendarId,
    lastSyncedAt: now,
    syncStatus: "synced",
    createdAt: now,
    updatedAt: remote.updated ?? now,
  };
}

export async function fetchGoogleCalendarStatus(): Promise<GoogleCalendarStatus> {
  const res = await fetch("/api/google-calendar/status", { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Unable to load Google Calendar status.");
  }
  return res.json();
}

export async function disconnectGoogleCalendar(): Promise<void> {
  const res = await fetch("/api/google-calendar/disconnect", {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("Unable to disconnect Google Calendar.");
  }

  await updateSettings({
    googleCalendarConnected: false,
    googleCalendarEmail: undefined,
    googleCalendarCalendarId: undefined,
    googleCalendarCalendarName: undefined,
  });
}

export async function syncGoogleCalendarFromRemote(): Promise<number> {
  const settings = await getSettings();
  const params = new URLSearchParams();
  if (settings.googleCalendarCalendarId) {
    params.set("calendarId", settings.googleCalendarCalendarId);
  }

  const res = await fetch(`/api/google-calendar/sync?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Unable to pull events from Google Calendar.");
  }

  const body = (await res.json()) as { events: RemoteCalendarEvent[]; calendarId: string };
  const existing = await db.calendarEvents.toArray();
  const remoteIds = new Set(body.events.map((event) => event.id));
  const now = new Date().toISOString();

  await db.transaction("rw", db.calendarEvents, async () => {
    for (const remote of body.events) {
      const local = existing.find((item) => item.googleEventId === remote.id);
      const nextBase = remoteEventToLocal(remote);

      if (local) {
        await db.calendarEvents.put({
          ...local,
          ...nextBase,
          id: local.id,
          createdAt: local.createdAt,
        });
      } else {
        await db.calendarEvents.put(nextBase);
      }
    }

    for (const event of existing) {
      if (
        event.source === "google" &&
        event.googleCalendarId === body.calendarId &&
        event.googleEventId &&
        !remoteIds.has(event.googleEventId)
      ) {
        await db.calendarEvents.delete(event.id);
      }
    }
  });

  await updateSettings({
    googleCalendarConnected: true,
    googleCalendarCalendarId: body.calendarId,
    googleCalendarLastSyncAt: now,
  });

  return body.events.length;
}

export async function pushPendingCalendarEvents(): Promise<SyncPushResult> {
  const settings = await getSettings();
  const calendarId = settings.googleCalendarCalendarId || "primary";
  const events = await db.calendarEvents.toArray();
  const pending = events.filter((event) => event.syncStatus === "local_only" || event.syncStatus === "pending_push");
  const deletions = events.filter((event) => event.syncStatus === "pending_delete" && event.googleEventId);
  const result: SyncPushResult = { created: 0, updated: 0, deleted: 0, errors: [] };

  for (const event of pending) {
    const method = event.googleEventId ? "PATCH" : "POST";
    const endpoint = event.googleEventId
      ? `/api/google-calendar/sync?calendarId=${encodeURIComponent(calendarId)}&eventId=${encodeURIComponent(event.googleEventId)}`
      : `/api/google-calendar/sync?calendarId=${encodeURIComponent(calendarId)}`;

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventToPayload(event)),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message = body.error || "Sync failed";
      result.errors.push({ localId: event.id, message });
      await db.calendarEvents.update(event.id, {
        syncStatus: "error",
        syncError: message,
        updatedAt: new Date().toISOString(),
      });
      continue;
    }

    const body = (await res.json()) as { event: RemoteCalendarEvent };
    const now = new Date().toISOString();
    await db.calendarEvents.update(event.id, {
      googleEventId: body.event.id,
      googleCalendarId: body.event.calendarId,
      syncStatus: "synced",
      syncError: undefined,
      source: event.source === "google" ? "google" : "local",
      lastSyncedAt: now,
      updatedAt: now,
    });
    if (method === "POST") result.created += 1;
    else result.updated += 1;
  }

  for (const event of deletions) {
    const res = await fetch(
      `/api/google-calendar/sync?calendarId=${encodeURIComponent(calendarId)}&eventId=${encodeURIComponent(event.googleEventId!)}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      result.errors.push({ localId: event.id, message: body.error || "Delete failed" });
      continue;
    }

    await db.calendarEvents.delete(event.id);
    result.deleted += 1;
  }

  if (!result.errors.length) {
    await updateSettings({ googleCalendarLastSyncAt: new Date().toISOString() });
  }

  return result;
}
