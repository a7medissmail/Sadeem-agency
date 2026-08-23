import { Suspense } from "react";
import Link from "next/link";
import { AdminPagination } from "@/components/admin/ui/AdminPagination";
import { Button } from "@/components/admin/ui/Button";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { SearchBar } from "@/components/admin/ui/SearchBar";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { bookingTimeZone } from "@/lib/google/calendar";
import { defaultBookingSettings } from "@/lib/booking/settings";
import {
  BookingsBoard,
  type AvailabilityRuleRow,
  type BookingBlackoutRow,
  type BookingBoardRow,
  type BookingSettingsRow,
} from "./BookingsBoard";
import type { BriefFormLite } from "@/components/admin/ui/QuickBrief";
import { InlineAlert } from "@/components/admin/ui/Feedback";

export const metadata = { title: "Bookings - SADEEM Admin" };

const PAGE_SIZE = 50;

function sp(val: string | string[] | undefined): string {
  return Array.isArray(val) ? (val[0] ?? "") : (val ?? "");
}

// Same defaults as migration 0035 — used when the row (or the table) is missing.
const fallbackSettings: BookingSettingsRow = {
  max_per_week: defaultBookingSettings.maxPerWeek,
  max_per_day: defaultBookingSettings.maxPerDay,
  min_notice_hours: defaultBookingSettings.minNoticeHours,
  max_advance_days: defaultBookingSettings.maxAdvanceDays,
  week_starts_on: defaultBookingSettings.weekStartsOn,
};

async function loadData(q: string, page: number) {
  try {
    const admin = getSupabaseAdmin();
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let bookingsQuery = admin
      .from("bookings")
      .select(
        "id, name, email, phone, topic, slot_start, slot_end, status, meet_link, google_event_id, created_at",
        { count: "exact" },
      )
      .order("slot_start", { ascending: false })
      .range(from, to);

    if (q) {
      bookingsQuery = bookingsQuery.or(
        `name.ilike.%${q}%,email.ilike.%${q}%,topic.ilike.%${q}%`,
      );
    }

    const [bookingsResult, rulesResult, formsResult, settingsResult, blackoutsResult] = await Promise.all([
      bookingsQuery,
      admin
        .from("availability_rules")
        .select("id, weekday, start_time, end_time, slot_minutes, buffer_minutes, active")
        .order("weekday", { ascending: true })
        .order("start_time", { ascending: true }),
      admin
        .from("forms")
        .select("id, name")
        .eq("purpose", "proposal")
        .order("name", { ascending: true }),
      admin
        .from("booking_settings")
        .select("max_per_week, max_per_day, min_notice_hours, max_advance_days, week_starts_on")
        .eq("id", true)
        .maybeSingle(),
      admin
        .from("booking_blackouts")
        .select("id, starts_on, ends_on, reason")
        .order("starts_on", { ascending: true }),
    ]);

    if (bookingsResult.error) throw bookingsResult.error;
    if (rulesResult.error) throw rulesResult.error;

    const totalCount = bookingsResult.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    return {
      bookings: (bookingsResult.data ?? []) as BookingBoardRow[],
      rules: (rulesResult.data ?? []) as AvailabilityRuleRow[],
      forms: (formsResult.data ?? []) as BriefFormLite[],
      // Capacity config is optional — an un-pushed migration 0035 must not take
      // the whole bookings page down.
      settings: (settingsResult.data as BookingSettingsRow | null) ?? fallbackSettings,
      blackouts: (blackoutsResult.data ?? []) as BookingBlackoutRow[],
      totalCount,
      totalPages,
      error: null as string | null,
    };
  } catch (err) {
    return {
      bookings: [] as BookingBoardRow[],
      rules: [] as AvailabilityRuleRow[],
      forms: [] as BriefFormLite[],
      settings: fallbackSettings,
      blackouts: [] as BookingBlackoutRow[],
      totalCount: 0,
      totalPages: 1,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export default async function BookingsAdminPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await requireRole(["admin", "editor", "viewer"]);
  const q = sp(searchParams.q).trim();
  const page = Math.max(1, parseInt(sp(searchParams.page) || "1", 10));

  const { bookings, rules, forms, settings, blackouts, totalCount, totalPages, error } = await loadData(q, page);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="CONSULTATION"
        title="Bookings"
        description="Manage consultation requests, calendar readiness, and public availability windows."
        actions={
          <div className="flex items-center gap-2">
            <a
              href="/api/admin/export/bookings"
              className="inline-flex items-center justify-center gap-2.5 sdm-eyebrow transition-colors border border-[var(--admin-accent)] text-[var(--admin-accent)] hover:bg-[var(--admin-accent-soft)] px-3 py-1.5 text-[10px]"
            >
              Export CSV
            </a>
            <Link href="/admin/bookings/new">
              <Button>New booking</Button>
            </Link>
          </div>
        }
      />

      {error ? (
        <InlineAlert tone="warning">
          Couldn&apos;t load bookings: <code>{error}</code>
        </InlineAlert>
      ) : null}

      {/* Server-side search — debounced URL update triggers full page re-fetch */}
      <Suspense>
        <SearchBar placeholder="Name, email, topic…" />
      </Suspense>

      {totalCount > 0 ? (
        <p className="text-[12px] text-[var(--admin-muted)]">
          {totalCount} booking{totalCount !== 1 ? "s" : ""}
          {q ? ` matching "${q}"` : ""}{" "}
          {totalPages > 1 ? `— page ${page} of ${totalPages}` : ""}
        </p>
      ) : null}

      <BookingsBoard
        bookings={bookings}
        rules={rules}
        forms={forms}
        settings={settings}
        blackouts={blackouts}
        timeZone={bookingTimeZone()}
      />

      <AdminPagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/bookings"
        queryParams={q ? { q } : {}}
      />
    </div>
  );
}
