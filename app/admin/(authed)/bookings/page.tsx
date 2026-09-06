import { Suspense } from "react";
import Link from "next/link";
import { AdminPagination } from "@/components/admin/ui/AdminPagination";
import { Button } from "@/components/admin/ui/Button";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { SearchBar } from "@/components/admin/ui/SearchBar";
import { InlineAlert } from "@/components/admin/ui/Feedback";
import { requirePermission } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { bookingTimeZone } from "@/lib/google/calendar";
import { defaultBookingSettings } from "@/lib/booking/settings";
import type { BriefFormLite } from "@/components/admin/ui/QuickBrief";
import { ScheduleBoard } from "./ScheduleBoard";
import { AvailabilityPanel } from "./AvailabilityPanel";
import type {
  AvailabilityRuleRow,
  BookingBlackoutRow,
  BookingBoardRow,
  BookingSettingsRow,
} from "./types";

export const metadata = { title: "Bookings - SADEEM Admin" };

const PAGE_SIZE = 50;

/**
 * Two jobs, two tabs.
 *
 * This page used to stack the day's consultations, the weekly availability
 * editor, the capacity caps and the blackout calendar into one scroll — eight
 * top-level sections, seven stat tiles and, with five availability rules, more
 * than forty form controls on first paint. Running a meeting and configuring
 * the booking engine are different jobs at different cadences, so they are
 * separate views and each one loads only what it needs.
 */
type Tab = "schedule" | "availability";

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

async function loadSchedule(q: string, page: number) {
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
      bookingsQuery = bookingsQuery.or(`name.ilike.%${q}%,email.ilike.%${q}%,topic.ilike.%${q}%`);
    }

    const [bookingsResult, formsResult] = await Promise.all([
      bookingsQuery,
      admin
        .from("forms")
        .select("id, name")
        .eq("purpose", "proposal")
        .order("name", { ascending: true }),
    ]);

    if (bookingsResult.error) throw bookingsResult.error;

    const totalCount = bookingsResult.count ?? 0;
    return {
      bookings: (bookingsResult.data ?? []) as BookingBoardRow[],
      forms: (formsResult.data ?? []) as BriefFormLite[],
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
      error: null as string | null,
    };
  } catch (err) {
    return {
      bookings: [] as BookingBoardRow[],
      forms: [] as BriefFormLite[],
      totalCount: 0,
      totalPages: 1,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function loadAvailability() {
  try {
    const admin = getSupabaseAdmin();

    // The cap readout used to count whatever happened to be on the current page
    // of the bookings list, so a search or page 2 quietly changed the numbers.
    // It gets its own window instead: everything still scheduled from the start
    // of last week to five weeks out.
    const windowStart = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const windowEnd = new Date(Date.now() + 35 * 86_400_000).toISOString();

    const [rulesResult, settingsResult, blackoutsResult, slotsResult] = await Promise.all([
      admin
        .from("availability_rules")
        .select("id, weekday, start_time, end_time, slot_minutes, buffer_minutes, active")
        .order("weekday", { ascending: true })
        .order("start_time", { ascending: true }),
      admin
        .from("booking_settings")
        .select("max_per_week, max_per_day, min_notice_hours, max_advance_days, week_starts_on")
        .eq("id", true)
        .maybeSingle(),
      admin
        .from("booking_blackouts")
        .select("id, starts_on, ends_on, reason")
        .order("starts_on", { ascending: true }),
      admin
        .from("bookings")
        .select("slot_start")
        .eq("status", "scheduled")
        .gte("slot_start", windowStart)
        .lte("slot_start", windowEnd),
    ]);

    if (rulesResult.error) throw rulesResult.error;

    return {
      rules: (rulesResult.data ?? []) as AvailabilityRuleRow[],
      // Capacity config is optional — an un-pushed migration 0035 must not take
      // the whole bookings page down.
      settings: (settingsResult.data as BookingSettingsRow | null) ?? fallbackSettings,
      blackouts: (blackoutsResult.data ?? []) as BookingBlackoutRow[],
      upcomingSlots: (slotsResult.data ?? []).map((row) => row.slot_start as string),
      error: null as string | null,
    };
  } catch (err) {
    return {
      rules: [] as AvailabilityRuleRow[],
      settings: fallbackSettings,
      blackouts: [] as BookingBlackoutRow[],
      upcomingSlots: [] as string[],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

function TabLink({ tab, active, children }: { tab: Tab; active: boolean; children: string }) {
  return (
    <Link
      href={tab === "schedule" ? "/admin/bookings" : `/admin/bookings?tab=${tab}`}
      aria-current={active ? "page" : undefined}
      className={`sdm-nav-item -mb-px border-b-2 px-1 py-3 transition-colors ${
        active
          ? "border-[var(--admin-accent)] text-[var(--admin-text)]"
          : "border-transparent text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function BookingsAdminPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await requirePermission("bookings:view");
  const tab: Tab = sp(searchParams.tab) === "availability" ? "availability" : "schedule";
  const q = sp(searchParams.q).trim();
  const page = Math.max(1, parseInt(sp(searchParams.page) || "1", 10));
  const timeZone = bookingTimeZone();

  const schedule = tab === "schedule" ? await loadSchedule(q, page) : null;
  const availability = tab === "availability" ? await loadAvailability() : null;
  const error = schedule?.error ?? availability?.error ?? null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="CONSULTATION"
        title="Bookings"
        description="Run the consultations that are booked, and set what the public calendar is allowed to offer."
        actions={
          <div className="flex items-center gap-2">
            <a
              href="/api/admin/export/bookings"
              className="sdm-button-label inline-flex h-[var(--sdm-control-md)] items-center justify-center rounded-[var(--sdm-radius-md)] border border-[var(--sdm-border-default)] px-4 text-[var(--sdm-text-secondary)] transition-colors hover:bg-[var(--sdm-surface-hover)] hover:text-[var(--admin-text)]"
            >
              Export CSV
            </a>
            <Link href="/admin/bookings/new">
              <Button>New booking</Button>
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--sdm-border-default)]">
        <nav className="flex items-center gap-6" aria-label="Bookings views">
          <TabLink tab="schedule" active={tab === "schedule"}>
            Schedule
          </TabLink>
          <TabLink tab="availability" active={tab === "availability"}>
            Availability
          </TabLink>
        </nav>
        {/* Every time on this page is in the booking zone, not the viewer's. */}
        <span className="sdm-metadata pb-3 text-[var(--sdm-text-tertiary)]">
          Times in {timeZone.replace("_", " ")}
        </span>
      </div>

      {error ? (
        <InlineAlert tone="warning">
          Couldn&apos;t load bookings: <code>{error}</code>
        </InlineAlert>
      ) : null}

      {tab === "schedule" && schedule ? (
        <>
          <ScheduleBoard
            bookings={schedule.bookings}
            forms={schedule.forms}
            timeZone={timeZone}
            query={q}
            search={
              <Suspense>
                <SearchBar placeholder="Name, email, topic…" />
              </Suspense>
            }
          />
          <AdminPagination
            page={page}
            totalPages={schedule.totalPages}
            basePath="/admin/bookings"
            total={schedule.totalCount}
            pageSize={PAGE_SIZE}
            unit="consultations"
            queryParams={q ? { q } : {}}
          />
        </>
      ) : null}

      {tab === "availability" && availability ? (
        <AvailabilityPanel
          rules={availability.rules}
          settings={availability.settings}
          blackouts={availability.blackouts}
          upcomingSlots={availability.upcomingSlots}
          timeZone={timeZone}
        />
      ) : null}
    </div>
  );
}
