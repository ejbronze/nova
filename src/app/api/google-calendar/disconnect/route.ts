import { NextResponse } from "next/server";
import { clearGoogleCookies } from "@/lib/google-calendar-server";

export async function POST() {
  await clearGoogleCookies();
  return NextResponse.json({ ok: true });
}
