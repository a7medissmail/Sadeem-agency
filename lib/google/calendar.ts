import "server-only";
import { createSign, randomUUID } from "crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

type TokenCache = {
  token: string;
  expiresAt: number;
};

type BusyInterval = {
  start: string;
  end: string;
};

type CalendarEventInput = {
  summary: string;
  description: string;
  start: string;
  end: string;
  timeZone: string;
  attendees?: string[];
};

type CalendarEventResult = {
  id: string;
  meetLink: string | null;
  htmlLink: string | null;
};

let tokenCache: TokenCache | null = null;

function serviceAccountEmail() {
  return process.env.GOOGLE_SA_EMAIL?.trim() || "";
}

function privateKey() {
  return process.env.GOOGLE_SA_PRIVATE_KEY?.replace(/\\n/g, "\n").trim() || "";
}

function calendarId() {
  return process.env.GOOGLE_CALENDAR_ID?.trim() || "";
}

export function bookingTimeZone() {
  return process.env.GOOGLE_BOOKING_TIMEZONE?.trim() || "Asia/Riyadh";
}

export function isGoogleCalendarConfigured() {
  return Boolean(serviceAccountEmail() && privateKey() && calendarId());
}

function base64url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function getAccessToken(): Promise<string | null> {
  if (!isGoogleCalendarConfigured()) return null;
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.expiresAt - 60 > now) return tokenCache.token;

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss: serviceAccountEmail(),
      scope: CALENDAR_SCOPE,
      aud: TOKEN_URL,
      exp: now + 3600,
      iat: now,
    }),
  );
  const input = `${header}.${payload}`;
  const signature = createSign("RSA-SHA256").update(input).sign(privateKey());
  const assertion = `${input}.${base64url(signature)}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const json = (await response.json()) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!response.ok || !json.access_token) {
    throw new Error(json.error_description || "Google Calendar authentication failed");
  }

  tokenCache = {
    token: json.access_token,
    expiresAt: now + (json.expires_in ?? 3600),
  };
  return tokenCache.token;
}

async function googleFetch<T>(path: string, init: RequestInit): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new Error("Google Calendar is not configured");

  const response = await fetch(`${CALENDAR_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const json = (await response.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(json.error?.message || "Google Calendar request failed");
  return json;
}

export async function getGoogleBusyIntervals(timeMin: string, timeMax: string): Promise<BusyInterval[]> {
  if (!isGoogleCalendarConfigured()) return [];

  const response = await googleFetch<{ calendars?: Record<string, { busy?: BusyInterval[] }> }>("/freeBusy", {
    method: "POST",
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: [{ id: calendarId() }],
    }),
  });

  return response.calendars?.[calendarId()]?.busy ?? [];
}

export async function createGoogleCalendarEvent(input: CalendarEventInput): Promise<CalendarEventResult | null> {
  if (!isGoogleCalendarConfigured()) return null;

  const response = await googleFetch<{
    id: string;
    hangoutLink?: string;
    htmlLink?: string;
    conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] };
  }>(`/calendars/${encodeURIComponent(calendarId())}/events?conferenceDataVersion=1&sendUpdates=all`, {
    method: "POST",
    body: JSON.stringify({
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.start, timeZone: input.timeZone },
      end: { dateTime: input.end, timeZone: input.timeZone },
      attendees: input.attendees?.filter(Boolean).map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    }),
  });

  const meetLink =
    response.hangoutLink ??
    response.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri ??
    null;

  return {
    id: response.id,
    meetLink,
    htmlLink: response.htmlLink ?? null,
  };
}
