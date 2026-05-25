import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { BookingsBoard, type AvailabilityRuleRow, type BookingBoardRow } from "./BookingsBoard";

export const metadata = { title: "Bookings - SADEEM Admin" };

async function loadData() {
  try {
    const admin = getSupabaseAdmin();
    const [bookings, rules] = await Promise.all([
      admin
        .from("bookings")
        .select("id, name, email, phone, topic, slot_start, slot_end, status, meet_link, google_event_id, created_at")
        .order("slot_start", { ascending: false })
        .limit(300),
      admin
        .from("availability_rules")
        .select("id, weekday, start_time, end_time, slot_minutes, buffer_minutes, active")
        .order("weekday", { ascending: true })
        .order("start_time", { ascending: true }),
    ]);

    if (bookings.error) throw bookings.error;
    if (rules.error) throw rules.error;

    return {
      bookings: (bookings.data ?? []) as BookingBoardRow[],
      rules: (rules.data ?? []) as AvailabilityRuleRow[],
      error: null as string | null,
    };
  } catch (err) {
    return {
      bookings: [] as BookingBoardRow[],
      rules: [] as AvailabilityRuleRow[],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export default async function BookingsAdminPage() {
  await requireRole(["admin", "editor", "viewer"]);
  const { bookings, rules, error } = await loadData();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="CONSULTATION"
        title="Bookings"
        description="Manage consultation requests, calendar readiness, and public availability windows."
      />

      {error ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200">
          Couldn&apos;t load bookings: <code>{error}</code>
        </div>
      ) : null}

      <BookingsBoard bookings={bookings} rules={rules} />
    </div>
  );
}
