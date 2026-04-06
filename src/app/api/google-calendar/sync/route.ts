import { NextResponse } from "next/server";
import {
  deleteCalendarEvent,
  getPrimaryCalendar,
  insertCalendarEvent,
  listCalendarEvents,
  patchCalendarEvent,
} from "@/lib/google-calendar-server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const primary = await getPrimaryCalendar();
    const calendarId = url.searchParams.get("calendarId") || primary?.id || "primary";
    const timeMin = url.searchParams.get("timeMin") || undefined;
    const timeMax = url.searchParams.get("timeMax") || undefined;
    const events = await listCalendarEvents(calendarId, timeMin, timeMax);
    return NextResponse.json({ calendarId, events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch Google Calendar events.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const primary = await getPrimaryCalendar();
    const calendarId = url.searchParams.get("calendarId") || primary?.id || "primary";
    const body = await request.json();
    const event = await insertCalendarEvent(calendarId, body);
    return NextResponse.json({ calendarId, event });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create Google Calendar event.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const url = new URL(request.url);
    const primary = await getPrimaryCalendar();
    const calendarId = url.searchParams.get("calendarId") || primary?.id || "primary";
    const eventId = url.searchParams.get("eventId");
    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId." }, { status: 400 });
    }

    const body = await request.json();
    const event = await patchCalendarEvent(calendarId, eventId, body);
    return NextResponse.json({ calendarId, event });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update Google Calendar event.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const primary = await getPrimaryCalendar();
    const calendarId = url.searchParams.get("calendarId") || primary?.id || "primary";
    const eventId = url.searchParams.get("eventId");
    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId." }, { status: 400 });
    }

    await deleteCalendarEvent(calendarId, eventId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete Google Calendar event.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
