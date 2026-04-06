import { NextResponse } from "next/server";
import { createGoogleAuthUrl, setOAuthStateCookie } from "@/lib/google-calendar-server";

export async function GET() {
  try {
    const { url, state } = createGoogleAuthUrl();
    await setOAuthStateCookie(state);
    return NextResponse.redirect(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start Google Calendar connection.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
