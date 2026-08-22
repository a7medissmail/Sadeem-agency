import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type BookingSettings = {
  /** 0 = unlimited */
  maxPerWeek: number;
  /** 0 = unlimited */
  maxPerDay: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
  /** 0 = Sunday (Riyadh business week), 1 = Monday */
  weekStartsOn: number;
};

export type BookingBlackout = {
  id: string;
  startsOn: string; // "YYYY-MM-DD"
  endsOn: string; // "YYYY-MM-DD", inclusive
  reason: string | null;
};

/**
 * Matches the column defaults in migration 0035 — and the values that were
 * hardcoded in slots.ts before it. If the table is missing (migration not yet
 * pushed) the calendar behaves exactly as it did before.
 */
export const defaultBookingSettings: BookingSettings = {
  maxPerWeek: 0,
  maxPerDay: 0,
  minNoticeHours: 2,
  maxAdvanceDays: 21,
  weekStartsOn: 0,
};

export async function getBookingSettings(): Promise<BookingSettings> {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("booking_settings")
      .select("max_per_week, max_per_day, min_notice_hours, max_advance_days, week_starts_on")
      .eq("id", true)
      .maybeSingle();

    if (error || !data) return defaultBookingSettings;

    return {
      maxPerWeek: data.max_per_week ?? defaultBookingSettings.maxPerWeek,
      maxPerDay: data.max_per_day ?? defaultBookingSettings.maxPerDay,
      minNoticeHours: data.min_notice_hours ?? defaultBookingSettings.minNoticeHours,
      maxAdvanceDays: data.max_advance_days ?? defaultBookingSettings.maxAdvanceDays,
      weekStartsOn: data.week_starts_on ?? defaultBookingSettings.weekStartsOn,
    };
  } catch {
    return defaultBookingSettings;
  }
}

export async function getBookingBlackouts(): Promise<BookingBlackout[]> {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("booking_blackouts")
      .select("id, starts_on, ends_on, reason")
      .order("starts_on", { ascending: true });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      startsOn: row.starts_on,
      endsOn: row.ends_on,
      reason: row.reason,
    }));
  } catch {
    return [];
  }
}

/**
 * ISO day keys sort lexically, so a plain string compare is a correct
 * inclusive range test.
 */
export function isBlackedOut(dayKey: string, blackouts: BookingBlackout[]) {
  return blackouts.some((blackout) => dayKey >= blackout.startsOn && dayKey <= blackout.endsOn);
}

/**
 * Start-of-week day key for a calendar date, respecting the configured first
 * day of the week. Uses UTC noon to stay clear of DST edges — the input is
 * already a wall-clock calendar date in the booking timezone.
 */
export function weekKey(dayKey: string, weekStartsOn: number) {
  const [year, month, day] = dayKey.split("-").map(Number);
  const noon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const back = (noon.getUTCDay() - weekStartsOn + 7) % 7;
  noon.setUTCDate(noon.getUTCDate() - back);
  return noon.toISOString().slice(0, 10);
}
