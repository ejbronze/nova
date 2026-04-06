import { NextResponse } from "next/server";
import { exchangeCodeForTokens, verifyOAuthState } from "@/lib/google-calendar-server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/settings?googleCalendar=${encodeURIComponent(error)}`, url.origin));
  }

  const validState = await verifyOAuthState(state);
  if (!validState || !code) {
    return NextResponse.redirect(new URL("/settings?googleCalendar=state_error", url.origin));
  }

  try {
    await exchangeCodeForTokens(code);
    return NextResponse.redirect(new URL("/settings?googleCalendar=connected", url.origin));
  } catch (exchangeError) {
    const message = exchangeError instanceof Error ? exchangeError.message : "oauth_error";
    return NextResponse.redirect(new URL(`/settings?googleCalendar=${encodeURIComponent(message)}`, url.origin));
  }
}
