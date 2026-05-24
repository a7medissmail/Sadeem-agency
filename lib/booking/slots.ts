import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { bookingTimeZone, getGoogleBusyIntervals } from "@/lib/google/calendar";

export type ConsultationSlot = {
  start: string;
  end: string;
  dayKey: string;
  dateLabel: string;
  weekdayLabel: string;
  timeLabel: string;
};

type AvailabilityRule = {
  id?: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  buffer_minutes: number;
  active: boolean;
};

type BusyInterval = {
  start: string;
  end: string;
};

const DEFAULT_RULES: AvailabilityRule[] = [1, 2, 3, 4].map((weekday) => ({
  weekday,
  start_time: "10:00",
  end_time: "16:00",
  slot_minutes: 45,
  buffer_minutes: 15,
  active: true,
}));

const weekdayLookup: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function partsInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "00";
  const hour = value("hour") === "24" ? "00" : value("hour");

  return {
    year: Number(value("year")),
    month: Number(value("month")),
    day: Number(value("day")),
    hour: Number(hour),
    minute: Number(value("minute")),
    second: Number(value("second")),
  };
}

function offsetMs(timeZone: string, date: Date) {
  const parts = partsInZone(date, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - date.getTime();
}

function zonedTimeToUtc(dayKey: string, time: string, timeZone: string) {
  const [year, month, day] = dayKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const guessedUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  const firstOffset = offsetMs(timeZone, new Date(guessedUtc));
  let utcDate = new Date(guessedUtc - firstOffset);
  const secondOffset = offsetMs(timeZone, utcDate);
  if (secondOffset !== firstOffset) utcDate = new Date(guessedUtc - secondOffset);
  return utcDate;
}

function dateKeyInZone(date: Date, timeZone: string) {
  const parts = partsInZone(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function addDays(dayKey: string, days: number) {
  const [year, month, day] = dayKey.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

function weekday(dayKey: string, timeZone: string) {
  const noon = zonedTimeToUtc(dayKey, "12:00", timeZone);
  const label = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(noon);
  return weekdayLookup[label] ?? 0;
}

function overlaps(slotStart: Date, slotEnd: Date, busy: BusyInterval, bufferMinutes: number) {
  const bufferMs = bufferMinutes * 60 * 1000;
  const busyStart = new Date(busy.start).getTime() - bufferMs;
  const busyEnd = new Date(busy.end).getTime() + bufferMs;
  return slotStart.getTime() < busyEnd && slotEnd.getTime() > busyStart;
}

function labels(start: Date, timeZone: string) {
  return {
    dateLabel: new Intl.DateTimeFormat("en", { timeZone, month: "short", day: "numeric" }).format(start),
    weekdayLabel: new Intl.DateTimeFormat("en", { timeZone, weekday: "long" }).format(start),
    timeLabel: new Intl.DateTimeFormat("en", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(start),
  };
}

async function loadRules(): Promise<AvailabilityRule[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("availability_rules")
    .select("id, weekday, start_time, end_time, slot_minutes, buffer_minutes, active")
    .eq("active", true)
    .order("weekday", { ascending: true })
    .order("start_time", { ascending: true });

  if (error || !data?.length) return DEFAULT_RULES;
  return data;
}

async function loadLocalBusy(timeMin: Date, timeMax: Date): Promise<BusyInterval[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("bookings")
    .select("slot_start, slot_end")
    .eq("status", "scheduled")
    .gte("slot_start", timeMin.toISOString())
    .lt("slot_start", timeMax.toISOString());

  if (error) return [];
  return (data ?? []).map((booking) => ({ start: booking.slot_start, end: booking.slot_end }));
}

export async function getConsultationSlots(days = 21): Promise<{ timeZone: string; slots: ConsultationSlot[] }> {
  const timeZone = bookingTimeZone();
  const now = new Date();
  const minimumStart = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const today = dateKeyInZone(now, timeZone);
  const lastDay = addDays(today, days);
  const windowStart = zonedTimeToUtc(today, "00:00", timeZone);
  const windowEnd = zonedTimeToUtc(lastDay, "23:59", timeZone);

  const [rules, localBusy, googleBusy] = await Promise.all([
    loadRules(),
    loadLocalBusy(windowStart, windowEnd),
    getGoogleBusyIntervals(windowStart.toISOString(), windowEnd.toISOString()),
  ]);
  const busy = [...localBusy, ...googleBusy];
  const slots: ConsultationSlot[] = [];

  for (let dayOffset = 0; dayOffset < days; dayOffset += 1) {
    const dayKey = addDays(today, dayOffset);
    const dayWeekday = weekday(dayKey, timeZone);
    const dayRules = rules.filter((rule) => rule.active && rule.weekday === dayWeekday);

    for (const rule of dayRules) {
      const startOfWindow = zonedTimeToUtc(dayKey, rule.start_time.slice(0, 5), timeZone);
      const endOfWindow = zonedTimeToUtc(dayKey, rule.end_time.slice(0, 5), timeZone);
      const durationMs = rule.slot_minutes * 60 * 1000;
      const stepMs = (rule.slot_minutes + rule.buffer_minutes) * 60 * 1000;

      for (let cursor = startOfWindow.getTime(); cursor + durationMs <= endOfWindow.getTime(); cursor += stepMs) {
        const slotStart = new Date(cursor);
        const slotEnd = new Date(cursor + durationMs);
        if (slotStart < minimumStart) continue;
        if (busy.some((interval) => overlaps(slotStart, slotEnd, interval, rule.buffer_minutes))) continue;

        const slotLabels = labels(slotStart, timeZone);
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          dayKey,
          ...slotLabels,
        });
      }
    }
  }

  return { timeZone, slots: slots.slice(0, 80) };
}
