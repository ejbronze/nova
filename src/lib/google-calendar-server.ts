import { cookies } from "next/headers";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const SCOPES = ["openid", "email", "profile", "https://www.googleapis.com/auth/calendar"];

const STATE_COOKIE = "nova_google_oauth_state";
const REFRESH_COOKIE = "nova_google_refresh_token";
const ACCESS_COOKIE = "nova_google_access_token";
const ACCESS_EXP_COOKIE = "nova_google_access_token_expires";

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }
  return value;
}

export function getGoogleRedirectUri() {
  return getRequiredEnv("GOOGLE_REDIRECT_URI");
}

export function getGoogleClientId() {
  return getRequiredEnv("GOOGLE_CLIENT_ID");
}

function getGoogleClientSecret() {
  return getRequiredEnv("GOOGLE_CLIENT_SECRET");
}

export function createGoogleAuthUrl() {
  const state = crypto.randomUUID();
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", getGoogleClientId());
  url.searchParams.set("redirect_uri", getGoogleRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", state);
  return { url: url.toString(), state };
}

export async function setOAuthStateCookie(state: string) {
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
}

export async function verifyOAuthState(state?: string | null) {
  const cookieStore = await cookies();
  const saved = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);
  return Boolean(state && saved && state === saved);
}

async function exchangeToken(params: URLSearchParams) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || "Google token exchange failed.");
  }

  return res.json() as Promise<{
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    token_type: string;
    scope: string;
  }>;
}

async function persistTokens(accessToken: string, expiresIn: number, refreshToken?: string) {
  const cookieStore = await cookies();
  const shared = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };

  cookieStore.set(ACCESS_COOKIE, accessToken, shared);
  cookieStore.set(ACCESS_EXP_COOKIE, String(Date.now() + expiresIn * 1000), shared);

  if (refreshToken) {
    cookieStore.set(REFRESH_COOKIE, refreshToken, {
      ...shared,
      maxAge: 60 * 60 * 24 * 180,
    });
  }
}

export async function clearGoogleCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(STATE_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(ACCESS_EXP_COOKIE);
}

export async function exchangeCodeForTokens(code: string) {
  const params = new URLSearchParams({
    code,
    client_id: getGoogleClientId(),
    client_secret: getGoogleClientSecret(),
    redirect_uri: getGoogleRedirectUri(),
    grant_type: "authorization_code",
  });

  const tokens = await exchangeToken(params);
  await persistTokens(tokens.access_token, tokens.expires_in, tokens.refresh_token);
  return tokens;
}

export async function getGoogleAccessToken() {
  const cookieStore = await cookies();
  const current = cookieStore.get(ACCESS_COOKIE)?.value;
  const expiresAt = Number(cookieStore.get(ACCESS_EXP_COOKIE)?.value || "0");

  if (current && Date.now() < expiresAt - 30_000) {
    return current;
  }

  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    throw new Error("Google Calendar is not connected.");
  }

  const params = new URLSearchParams({
    client_id: getGoogleClientId(),
    client_secret: getGoogleClientSecret(),
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const tokens = await exchangeToken(params);
  await persistTokens(tokens.access_token, tokens.expires_in);
  return tokens.access_token;
}

async function googleRequest(path: string, init?: RequestInit) {
  const accessToken = await getGoogleAccessToken();
  const headers = new Headers(init?.headers || {});
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${GOOGLE_CALENDAR_API}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || "Google Calendar request failed.");
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function getPrimaryCalendar() {
  const body = await googleRequest("/users/me/calendarList");
  const items = body.items || [];
  const primary = items.find((item: { primary?: boolean }) => item.primary) || items[0];

  return primary
    ? {
        id: primary.id as string,
        summary: primary.summary as string,
        email: (body.items?.find((item: { primary?: boolean }) => item.primary)?.id || primary.id) as string,
      }
    : null;
}

function normalizeGoogleEvent(event: {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
  updated?: string;
 }, calendarId: string) {
  const allDay = Boolean(event.start?.date);
  return {
    id: event.id,
    calendarId,
    title: event.summary || "Untitled event",
    description: event.description,
    location: event.location,
    start: event.start?.dateTime || `${event.start?.date}T00:00:00.000Z`,
    end: event.end?.dateTime || `${event.end?.date}T00:00:00.000Z`,
    allDay,
    updated: event.updated,
  };
}

export async function listCalendarEvents(calendarId: string, timeMin?: string, timeMax?: string) {
  const url = new URL(`${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "250");
  url.searchParams.set("showDeleted", "false");
  url.searchParams.set("timeMin", timeMin || new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString());
  url.searchParams.set("timeMax", timeMax || new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString());

  const accessToken = await getGoogleAccessToken();
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || "Failed to list Google Calendar events.");
  }

  const body = await res.json();
  return (body.items || []).map((item: Record<string, unknown>) =>
    normalizeGoogleEvent(item as never, calendarId)
  );
}

export async function insertCalendarEvent(calendarId: string, payload: unknown) {
  const event = await googleRequest(`/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return normalizeGoogleEvent(event, calendarId);
}

export async function patchCalendarEvent(calendarId: string, eventId: string, payload: unknown) {
  const event = await googleRequest(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return normalizeGoogleEvent(event, calendarId);
}

export async function deleteCalendarEvent(calendarId: string, eventId: string) {
  await googleRequest(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: "DELETE",
  });
}
