import { NextResponse } from "next/server";
import { clearGoogleCookies, getPrimaryCalendar } from "@/lib/google-calendar-server";

export async function GET() {
  try {
    const primary = await getPrimaryCalendar();
    if (!primary) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      email: primary.email,
      calendarId: primary.id,
      calendarName: primary.summary,
    });
  } catch {
    await clearGoogleCookies();
    return NextResponse.json({ connected: false });
  }
}
