import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { Input, Select } from "@/components/admin/ui/Field";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { EmptyState, TableShell } from "@/components/admin/ui/Table";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { bookingStatuses } from "@/lib/validation/booking";
import type { BookingStatus } from "@/types/database";
import {
  createAvailabilityRuleAction,
  deleteAvailabilityRuleAction,
  updateAvailabilityRuleAction,
  updateBookingStatusAction,
} from "./actions";

export const metadata = { title: "Bookings - SADEEM Admin" };

const statusLabels: Record<BookingStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

const statusTones: Record<BookingStatus, "blue" | "green" | "red" | "amber"> = {
  scheduled: "blue",
  completed: "green",
  cancelled: "red",
  no_show: "amber",
};

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

async function loadData() {
  try {
    const admin = getSupabaseAdmin();
    const [bookings, rules] = await Promise.all([
      admin
        .from("bookings")
        .select("id, name, email, phone, topic, slot_start, slot_end, status, meet_link, google_event_id, created_at")
        .order("slot_start", { ascending: false })
        .limit(200),
      admin
        .from("availability_rules")
        .select("id, weekday, start_time, end_time, slot_minutes, buffer_minutes, active")
        .order("weekday", { ascending: true })
        .order("start_time", { ascending: true }),
    ]);

    if (bookings.error) throw bookings.error;
    if (rules.error) throw rules.error;

    return { bookings: bookings.data ?? [], rules: rules.data ?? [], error: null as string | null };
  } catch (err) {
    return { bookings: [], rules: [], error: err instanceof Error ? err.message : "Unknown error" };
  }
}

function RuleFields({
  rule,
}: {
  rule?: {
    weekday: number;
    start_time: string;
    end_time: string;
    slot_minutes: number;
    buffer_minutes: number;
    active: boolean;
  };
}) {
  return (
    <>
      <Select name="weekday" defaultValue={String(rule?.weekday ?? 1)}>
        {weekdays.map((weekday, index) => (
          <option key={weekday} value={index}>
            {weekday}
          </option>
        ))}
      </Select>
      <Input name="start_time" type="time" defaultValue={(rule?.start_time ?? "10:00").slice(0, 5)} required />
      <Input name="end_time" type="time" defaultValue={(rule?.end_time ?? "16:00").slice(0, 5)} required />
      <Input name="slot_minutes" type="number" min={15} max={180} defaultValue={rule?.slot_minutes ?? 45} required />
      <Input name="buffer_minutes" type="number" min={0} max={120} defaultValue={rule?.buffer_minutes ?? 15} required />
      <label className="flex items-center gap-2 text-[12.5px] text-white/75">
        <input type="checkbox" name="active" defaultChecked={rule?.active ?? true} className="h-4 w-4 accent-[#ff6a00]" />
        Active
      </label>
    </>
  );
}

export default async function BookingsAdminPage() {
  await requireRole(["admin", "editor", "viewer"]);
  const { bookings, rules, error } = await loadData();
  const dateFmt = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="CONSULTATION"
        title="Bookings"
        description="Manage consultation requests, calendar links, and public availability windows."
      />

      {error ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200">
          Couldn&apos;t load bookings: <code>{error}</code>
        </div>
      ) : null}

      <TableShell>
        <div
          style={{ gridTemplateColumns: "1.2fr 1.2fr 1fr 0.85fr 0.7fr 0.55fr" }}
          className="grid gap-4 border-b border-white/10 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45"
        >
          <div>Visitor</div>
          <div>When</div>
          <div>Topic</div>
          <div>Status</div>
          <div>Meet</div>
          <div></div>
        </div>

        {bookings.length === 0 ? (
          <EmptyState title="No bookings yet." hint="Consultation requests will appear here once visitors reserve a slot." />
        ) : (
          bookings.map((booking) => (
            <div
              key={booking.id}
              style={{ gridTemplateColumns: "1.2fr 1.2fr 1fr 0.85fr 0.7fr 0.55fr" }}
              className="grid items-center gap-4 border-b border-white/5 px-5 py-3 text-[13.5px] last:border-0"
            >
              <div className="min-w-0">
                <div className="truncate text-white/95">{booking.name}</div>
                <a href={`mailto:${booking.email}`} className="block truncate font-mono text-[11px] text-white/45 hover:text-[#ff6a00]">
                  {booking.email}
                </a>
                {booking.phone ? <div className="truncate font-mono text-[11px] text-white/35">{booking.phone}</div> : null}
              </div>
              <div className="text-white/70">{dateFmt.format(new Date(booking.slot_start))}</div>
              <div className="line-clamp-3 text-[12.5px] leading-relaxed text-white/55">{booking.topic || "-"}</div>
              <form action={updateBookingStatusAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={booking.id} />
                <Badge tone={statusTones[booking.status]}>{statusLabels[booking.status]}</Badge>
                <Select name="status" defaultValue={booking.status} className="px-2 py-1 text-[12px]">
                  {bookingStatuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </Select>
                <Button type="submit" variant="ghost" size="sm">Save</Button>
              </form>
              <div>
                {booking.meet_link ? (
                  <a
                    href={booking.meet_link}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ff6a00] hover:text-[#ff8c3a]"
                  >
                    Open
                  </a>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">Pending</span>
                )}
              </div>
              <div className="font-mono text-[10px] text-white/30">{booking.google_event_id ? "Google" : "Local"}</div>
            </div>
          ))
        )}
      </TableShell>

      <section className="flex flex-col gap-4">
        <PageHeader eyebrow="AVAILABILITY" title="Public slots" description="These rules define the bookable windows shown on the consultation page." />

        <form
          action={createAvailabilityRuleAction}
          className="grid grid-cols-[1fr_0.7fr_0.7fr_0.7fr_0.7fr_0.55fr_auto] items-end gap-3 rounded-md border border-white/10 bg-white/[0.025] p-4"
        >
          <RuleFields />
          <Button type="submit" variant="outline">Add</Button>
        </form>

        <div className="flex flex-col gap-3">
          {rules.map((rule) => (
            <div key={rule.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-white/10 bg-white/[0.02] p-4">
              <form
                action={updateAvailabilityRuleAction}
                className="grid grid-cols-[1fr_0.7fr_0.7fr_0.7fr_0.7fr_0.55fr_auto] items-end gap-3"
              >
                <input type="hidden" name="id" value={rule.id} />
                <RuleFields rule={rule} />
                <Button type="submit" variant="ghost">Save</Button>
              </form>
              <form action={deleteAvailabilityRuleAction}>
                <input type="hidden" name="id" value={rule.id} />
                <Button type="submit" variant="danger">Del</Button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
