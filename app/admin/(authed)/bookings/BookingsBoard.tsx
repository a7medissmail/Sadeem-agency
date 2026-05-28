"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { Input, Select } from "@/components/admin/ui/Field";
import { bookingStatuses } from "@/lib/validation/booking";
import type { BookingStatus } from "@/types/database";
import {
  createAvailabilityRuleAction,
  deleteAvailabilityRuleAction,
  sendBookingDetailsAction,
  updateAvailabilityRuleAction,
  updateBookingDetailsAction,
  updateBookingStatusAction,
} from "./actions";

export type BookingBoardRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  topic: string | null;
  slot_start: string;
  slot_end: string;
  status: BookingStatus;
  meet_link: string | null;
  google_event_id: string | null;
  created_at: string;
};

export type AvailabilityRuleRow = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  buffer_minutes: number;
  active: boolean;
};

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

const statusNotes: Record<BookingStatus, string> = {
  scheduled: "Live conversation",
  completed: "Closed meeting",
  cancelled: "Removed from plan",
  no_show: "Missed session",
};

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dateFmt = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });
const dayFmt = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", hour12: true });

function minutesBetween(start: string, end: string) {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
}

function isFutureSlot(booking: BookingBoardRow) {
  return new Date(booking.slot_start).getTime() >= Date.now();
}

function meetingState(booking: BookingBoardRow) {
  if (booking.google_event_id && booking.meet_link) return "Google + meet";
  if (booking.google_event_id) return "Google event";
  if (booking.meet_link) return "Manual meet";
  return "Needs link";
}

function bookingSignal(booking: BookingBoardRow) {
  let score = 42;
  if (booking.phone) score += 8;
  if (booking.topic && booking.topic.length > 80) score += 16;
  if (booking.google_event_id) score += 14;
  if (booking.meet_link) score += 14;
  if (booking.status === "completed") score += 12;
  if (booking.status === "cancelled" || booking.status === "no_show") score -= 18;
  return Math.max(10, Math.min(98, score));
}

function MetricCard({ label, value, hint }: { label: string; value: number | string; hint: string }) {
  return (
    <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">{label}</p>
      <div className="mt-3 text-[30px] font-semibold leading-none text-[var(--admin-text)]">{value}</div>
      <p className="mt-3 text-[12.5px] text-[var(--admin-muted)]">{hint}</p>
    </div>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${
        active
          ? "border-[var(--admin-accent)] bg-[var(--admin-accent-soft)] text-[var(--admin-text)]"
          : "border-[var(--admin-border)] text-[var(--admin-muted)] hover:border-[var(--admin-accent)] hover:text-[var(--admin-text)]"
      }`}
    >
      {children}
    </button>
  );
}

function BookingCard({
  booking,
  selected,
  onOpen,
}: {
  booking: BookingBoardRow;
  selected: boolean;
  onOpen: () => void;
}) {
  const start = new Date(booking.slot_start);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`grid w-full gap-4 border bg-[var(--admin-panel)] p-4 text-left transition-colors md:grid-cols-[116px_1fr_auto] md:items-center ${
        selected ? "border-[var(--admin-accent)]" : "border-[var(--admin-border)] hover:border-[var(--admin-accent)] hover:bg-[var(--admin-panel-hover)]"
      }`}
    >
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--admin-accent)]">{dayFmt.format(start)}</p>
        <p className="mt-2 text-[24px] font-semibold leading-none text-[var(--admin-text)]">{timeFmt.format(start)}</p>
        <p className="mt-2 text-[11px] text-[var(--admin-subtle)]">{minutesBetween(booking.slot_start, booking.slot_end)} min</p>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-[16px] font-semibold text-[var(--admin-text)]">{booking.name}</p>
          <Badge tone={statusTones[booking.status]}>{statusLabels[booking.status]}</Badge>
        </div>
        <p className="mt-1 truncate font-mono text-[11px] text-[var(--admin-subtle)]">{booking.email}</p>
        <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-[var(--admin-muted)]">{booking.topic || "No topic submitted."}</p>
      </div>

      <div className="flex flex-row items-center justify-between gap-4 md:flex-col md:items-end">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">{meetingState(booking)}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-accent)]/70 transition-colors group-hover:text-[var(--admin-accent)]">Open →</span>
      </div>
    </button>
  );
}

function BookingDossier({ booking }: { booking: BookingBoardRow | null }) {
  if (!booking) {
    return (
      <aside className="border border-dashed border-[var(--admin-border)] bg-[var(--admin-panel)] p-6 text-[13px] text-[var(--admin-muted)]">
        Select a booking to see the full meeting dossier.
      </aside>
    );
  }

  const signal = bookingSignal(booking);
  const timeline = [
    { label: "Reserved", detail: dateFmt.format(new Date(booking.created_at)), done: true },
    { label: "Slot", detail: `${dateFmt.format(new Date(booking.slot_start))} - ${timeFmt.format(new Date(booking.slot_end))}`, done: true },
    { label: "Calendar", detail: booking.google_event_id ? "Google event created" : "Local booking only", done: Boolean(booking.google_event_id) },
    { label: "Meeting link", detail: booking.meet_link || "Pending manual link", done: Boolean(booking.meet_link) },
  ];

  return (
    <aside className="xl:sticky xl:top-24">
      <div className="border border-[var(--admin-border)] bg-[var(--admin-surface-strong)] shadow-[var(--admin-shadow)]">
        <header className="border-b border-[var(--admin-border)] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--admin-accent)]">Meeting dossier</p>
          <h2 className="mt-2 text-[30px] font-semibold leading-none tracking-tight text-[var(--admin-text)]">{booking.name}</h2>
          <p className="mt-2 text-[13.5px] text-[var(--admin-muted)]">{dateFmt.format(new Date(booking.slot_start))}</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <MetricCard label="Signal" value={`${signal}%`} hint="Session readiness" />
            <MetricCard label="State" value={statusLabels[booking.status]} hint={statusNotes[booking.status]} />
          </div>
        </header>

        <div className="space-y-5 p-5">
          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Visitor</h3>
            <div className="mt-3 space-y-2 text-[13px]">
              <a href={`mailto:${booking.email}`} className="block break-all text-[var(--admin-text)] hover:text-[var(--admin-accent)]">
                {booking.email}
              </a>
              {booking.phone ? (
                <a href={`tel:${booking.phone}`} className="block text-[var(--admin-muted)] hover:text-[var(--admin-accent)]">
                  {booking.phone}
                </a>
              ) : null}
            </div>
          </section>

          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Topic</h3>
            <p className="mt-3 whitespace-pre-wrap text-[13.5px] leading-relaxed text-[var(--admin-muted)]">{booking.topic || "No topic submitted."}</p>
          </section>

          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Timeline</h3>
            <div className="mt-3 space-y-3">
              {timeline.map((item) => (
                <div key={item.label} className="grid grid-cols-[18px_1fr] gap-3">
                  <span className={`mt-1 h-2 w-2 rounded-full ${item.done ? "bg-[var(--admin-accent)]" : "bg-[var(--admin-border)]"}`} />
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--admin-text)]">{item.label}</p>
                    <p className="mt-1 break-words text-[12.5px] text-[var(--admin-muted)]">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Meeting controls</h3>
            <form action={updateBookingStatusAction} className="mt-4 space-y-3">
              <input type="hidden" name="id" value={booking.id} />
              <Select name="status" defaultValue={booking.status} className="w-full">
                {bookingStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </Select>
              <Button type="submit" variant="outline" className="w-full justify-center">
                Save status
              </Button>
            </form>

            <form action={updateBookingDetailsAction} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={booking.id} />
              <Input name="meet_link" type="url" placeholder="https://meet.google.com/..." defaultValue={booking.meet_link ?? ""} className="w-full" />
              <Button type="submit" variant="ghost" className="w-full justify-center">
                Save meeting link
              </Button>
            </form>

            <form action={sendBookingDetailsAction} className="mt-3">
              <input type="hidden" name="id" value={booking.id} />
              <Button type="submit" variant="primary" className="w-full justify-center">
                Email details
              </Button>
            </form>
          </section>
        </div>
      </div>
    </aside>
  );
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
      <label className="flex min-h-[42px] items-center gap-2 text-[12.5px] text-[var(--admin-muted)]">
        <input type="checkbox" name="active" defaultChecked={rule?.active ?? true} className="h-4 w-4 accent-[var(--admin-accent)]" />
        Active
      </label>
    </>
  );
}

function AvailabilityRules({ rules }: { rules: AvailabilityRuleRow[] }) {
  const activeRules = rules.filter((rule) => rule.active).length;
  return (
    <section className="flex flex-col gap-4">
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1fr]">
        <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--admin-accent)]">Availability</p>
          <h2 className="mt-2 max-w-[12ch] text-[32px] font-semibold leading-[1.04] tracking-tight text-[var(--admin-text)]">
            Public slots with guardrails.
          </h2>
          <p className="mt-4 text-[14px] leading-relaxed text-[var(--admin-muted)]">
            These rules define the bookable windows shown on the consultation page. Keep them lean and predictable.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Rules" value={rules.length} hint="Configured windows" />
          <MetricCard label="Active" value={activeRules} hint="Shown publicly" />
          <MetricCard label="Default" value="45m" hint="Recommended slot length" />
        </div>
      </div>

      <form action={createAvailabilityRuleAction} className="grid gap-3 border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4 xl:grid-cols-[1fr_0.7fr_0.7fr_0.7fr_0.7fr_0.55fr_auto] xl:items-end">
        <RuleFields />
        <Button type="submit" variant="outline" className="justify-center">
          Add
        </Button>
      </form>

      <div className="grid gap-3">
        {rules.map((rule) => (
          <div key={rule.id} className="grid gap-3 border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4 2xl:grid-cols-[1fr_auto]">
            <form action={updateAvailabilityRuleAction} className="grid gap-3 xl:grid-cols-[1fr_0.7fr_0.7fr_0.7fr_0.7fr_0.55fr_auto] xl:items-end">
              <input type="hidden" name="id" value={rule.id} />
              <RuleFields rule={rule} />
              <Button type="submit" variant="ghost" className="justify-center">
                Save
              </Button>
            </form>
            <form
              action={deleteAvailabilityRuleAction}
              onSubmit={(e) => {
                if (!window.confirm("Delete this availability rule? This cannot be undone.")) e.preventDefault();
              }}
            >
              <input type="hidden" name="id" value={rule.id} />
              <Button type="submit" variant="danger" className="w-full justify-center 2xl:w-auto">
                Delete
              </Button>
            </form>
          </div>
        ))}
      </div>
    </section>
  );
}

export function BookingsBoard({ bookings, rules }: { bookings: BookingBoardRow[]; rules: AvailabilityRuleRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  // Drawer stays closed on mount — auto-opening the first booking was
  // disorienting (especially on a fresh page load).
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      const haystack = `${booking.name} ${booking.email} ${booking.phone ?? ""} ${booking.topic ?? ""} ${meetingState(booking)}`.toLowerCase();
      return (!needle || haystack.includes(needle)) && (status === "all" || booking.status === status);
    });
  }, [bookings, query, status]);

  const selected = bookings.find((booking) => booking.id === selectedId) ?? null;
  const upcomingCount = bookings.filter((booking) => isFutureSlot(booking) && booking.status === "scheduled").length;
  const needsLinkCount = bookings.filter((booking) => !booking.meet_link && booking.status === "scheduled").length;
  const googleCount = bookings.filter((booking) => booking.google_event_id).length;
  const completedCount = bookings.filter((booking) => booking.status === "completed").length;

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--admin-accent)]">Scheduling OS</p>
          <h2 className="mt-2 max-w-[14ch] text-[34px] font-semibold leading-[1.02] tracking-tight text-[var(--admin-text)]">
            Keep every conversation ready before it starts.
          </h2>
          <p className="mt-4 max-w-[68ch] text-[14.5px] leading-relaxed text-[var(--admin-muted)]">
            Bookings now show the time, state, meeting readiness, visitor context, and manual follow-up controls in one command view.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Upcoming" value={upcomingCount} hint="Scheduled ahead" />
          <MetricCard label="Needs link" value={needsLinkCount} hint="Manual link pending" />
          <MetricCard label="Google" value={googleCount} hint="Calendar synced" />
          <MetricCard label="Completed" value={completedCount} hint="Finished sessions" />
        </div>
      </section>

      <section className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
          <label className="flex min-h-[44px] items-center gap-3 border border-[var(--admin-border)] bg-[var(--admin-surface-strong)] px-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-accent)]">Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, email, phone, topic"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-subtle)]"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <FilterChip active={status === "all"} onClick={() => setStatus("all")}>All</FilterChip>
            {bookingStatuses.map((bookingStatus) => (
              <FilterChip key={bookingStatus} active={status === bookingStatus} onClick={() => setStatus(bookingStatus)}>
                {statusLabels[bookingStatus]}
              </FilterChip>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="flex flex-col gap-3">
          {filtered.length === 0 ? (
            <div className="border border-dashed border-[var(--admin-border)] bg-[var(--admin-panel)] px-5 py-12 text-center text-[13px] text-[var(--admin-subtle)]">
              No bookings match this view.
            </div>
          ) : (
            filtered.map((booking) => (
              <BookingCard key={booking.id} booking={booking} selected={booking.id === selectedId} onOpen={() => setSelectedId(booking.id)} />
            ))
          )}
        </div>
        <BookingDossier booking={selected} />
      </section>

      <AvailabilityRules rules={rules} />
    </div>
  );
}
