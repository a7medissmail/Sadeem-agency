"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { ConfirmSubmitButton } from "@/components/admin/ui/ConfirmSubmitButton";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { Input, Select } from "@/components/admin/ui/Field";
import { QuickBriefPanel, type BriefFormLite } from "@/components/admin/ui/QuickBrief";
import { FilterChip, MetricCard } from "@/components/admin/ui/Stats";
import { UserValue } from "@/components/admin/ui/UserValue";
import { statusLadders } from "@/lib/admin/status";
import { bookingStatuses } from "@/lib/validation/booking";
import type { BookingStatus } from "@/types/database";
import {
  createBriefFromBookingAction,
  sendBookingDetailsAction,
  updateBookingMeetingAction,
} from "./actions";
import type { BookingBoardRow } from "./types";

/**
 * Schedule view — the operational half of /admin/bookings.
 *
 * The redesign's premise: this page was doing two unrelated jobs in one scroll.
 * Running today's consultations and configuring the booking engine are done by
 * the same person but never in the same minute, so they are two tabs now and
 * this file only owns the first one.
 *
 * Within the schedule itself, the two changes that matter:
 *  • The list is grouped by day (Today / Tomorrow / date) and ordered forwards.
 *    A flat newest-first list buried "what is happening today" in the middle of
 *    the page and repeated the date on every single card.
 *  • The dossier column only exists once a booking is selected. It used to hold
 *    430px of "Select a booking to see the full meeting dossier" on every load.
 */

const statusLabels: Record<BookingStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

const statusTones = statusLadders.booking;

function minutesBetween(start: string, end: string) {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
}

function meetingState(booking: BookingBoardRow) {
  if (booking.google_event_id && booking.meet_link) return "Google + Meet";
  if (booking.google_event_id) return "Google event";
  if (booking.meet_link) return "Manual link";
  return "No link yet";
}

/**
 * Every time on this page is a time in the business's booking zone, not in the
 * admin's browser zone. Formatting locally is how "today" ends up wrong for
 * anyone travelling — which would break the day grouping this view is built on.
 * One factory, one zone, shared by the list and the dossier.
 */
function formatters(timeZone: string) {
  return {
    dayKey: new Intl.DateTimeFormat("en-CA", { timeZone }),
    dayLong: new Intl.DateTimeFormat("en", { weekday: "long", month: "short", day: "numeric", timeZone }),
    time: new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", hour12: true, timeZone }),
    full: new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone }),
  };
}

type Fmt = ReturnType<typeof formatters>;

function BookingRow({
  booking,
  selected,
  onOpen,
  fmt,
}: {
  booking: BookingBoardRow;
  selected: boolean;
  onOpen: () => void;
  fmt: Fmt;
}) {
  const start = new Date(booking.slot_start);
  const needsLink = booking.status === "scheduled" && !booking.meet_link;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-pressed={selected}
      className={`grid w-full grid-cols-[84px_minmax(0,1fr)] items-center gap-x-4 gap-y-2 rounded-[var(--sdm-radius-md)] border px-4 py-3 text-start transition-colors outline-none focus-visible:shadow-[shadow:var(--sdm-ring)] md:grid-cols-[84px_minmax(0,1fr)_auto] ${
        selected
          ? "border-[var(--sdm-border-selected)] bg-[var(--sdm-surface-selected)]"
          : "border-[var(--sdm-border-default)] bg-[var(--admin-panel)] hover:border-[var(--sdm-border-strong)] hover:bg-[var(--admin-panel-hover)]"
      }`}
    >
      <div className="self-start">
        <p className="sdm-body-small font-semibold tabular-nums text-[var(--admin-text)]">
          {fmt.time.format(start)}
        </p>
        <p className="sdm-caption mt-0.5 text-[var(--sdm-text-tertiary)]">
          {minutesBetween(booking.slot_start, booking.slot_end)} min
        </p>
      </div>

      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="sdm-body-small truncate font-semibold text-[var(--admin-text)]">
            <UserValue>{booking.name}</UserValue>
          </span>
          {booking.status !== "scheduled" ? (
            <Badge tone={statusTones[booking.status]}>{statusLabels[booking.status]}</Badge>
          ) : null}
          {needsLink ? <Badge tone="warning">Needs link</Badge> : null}
        </div>
        <p className="sdm-caption mt-1 truncate text-[var(--admin-muted)]">
          {booking.topic || "No topic submitted"}
        </p>
      </div>

      <p className="sdm-metadata col-span-2 truncate text-[var(--sdm-text-tertiary)] md:col-span-1 md:text-end">
        {booking.email}
      </p>
    </button>
  );
}

function DayGroup({
  label,
  hint,
  tone,
  children,
}: {
  label: string;
  hint: string;
  tone?: "today";
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h3
          className={`sdm-eyebrow ${
            tone === "today" ? "text-[var(--admin-accent)]" : "text-[var(--sdm-text-tertiary)]"
          }`}
        >
          {label}
        </h3>
        <span className="sdm-metadata text-[var(--sdm-text-tertiary)]">{hint}</span>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function MetaRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 py-1.5">
      <dt className="sdm-metadata text-[var(--sdm-text-tertiary)]">{label}</dt>
      <dd className="sdm-caption break-words text-[var(--admin-muted)]">{value}</dd>
    </div>
  );
}

function BookingDossier({
  booking,
  forms,
  fmt,
  onClose,
}: {
  booking: BookingBoardRow;
  forms: BriefFormLite[];
  fmt: Fmt;
  onClose: () => void;
}) {
  const start = new Date(booking.slot_start);

  return (
    <aside className="order-first xl:order-none xl:sticky xl:top-24 xl:self-start">
      <div className="rounded-[var(--sdm-radius-lg)] border border-[var(--sdm-border-default)] bg-[var(--admin-surface-strong)]">
        <header className="border-b border-[var(--sdm-border-default)] p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="sdm-section-title truncate text-[var(--admin-text)]">
                <UserValue>{booking.name}</UserValue>
              </h2>
              <p className="sdm-body-small mt-1 text-[var(--admin-muted)]">
                {fmt.dayLong.format(start)} · {fmt.time.format(start)} ·{" "}
                {minutesBetween(booking.slot_start, booking.slot_end)} min
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone={statusTones[booking.status]}>{statusLabels[booking.status]}</Badge>
            <Badge tone={booking.meet_link ? "neutral" : "warning"}>{meetingState(booking)}</Badge>
          </div>
        </header>

        <div className="flex flex-col gap-5 p-5">
          <section>
            <h3 className="sdm-eyebrow text-[var(--sdm-text-tertiary)]">Visitor</h3>
            <div className="mt-2 flex flex-col gap-1">
              <a
                href={`mailto:${booking.email}`}
                className="sdm-body-small break-all text-[var(--admin-text)] hover:text-[var(--admin-accent)]"
              >
                {booking.email}
              </a>
              {booking.phone ? (
                <a
                  href={`tel:${booking.phone}`}
                  className="sdm-body-small text-[var(--admin-muted)] hover:text-[var(--admin-accent)]"
                >
                  {booking.phone}
                </a>
              ) : null}
            </div>
            <p className="sdm-body-small mt-3 whitespace-pre-wrap leading-relaxed text-[var(--admin-muted)]">
              {booking.topic || "No topic submitted."}
            </p>
          </section>

          {/*
            One form, one Save. The status select and the meeting link used to be
            two forms stacked on each other with two identical full-width
            buttons, so the obvious move — paste the link and mark it scheduled —
            took two round trips and neither button said which was which.
          */}
          <section className="rounded-[var(--sdm-radius-md)] border border-[var(--sdm-border-default)] bg-[var(--admin-panel)] p-4">
            <h3 className="sdm-eyebrow text-[var(--sdm-text-tertiary)]">Meeting</h3>
            <form action={updateBookingMeetingAction} className="mt-3 flex flex-col gap-3">
              <input type="hidden" name="id" value={booking.id} />
              <label className="flex flex-col gap-1.5">
                <span className="sdm-form-label text-[var(--sdm-text-secondary)]">Status</span>
                <Select name="status" defaultValue={booking.status} className="w-full">
                  {bookingStatuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="sdm-form-label text-[var(--sdm-text-secondary)]">Meeting link</span>
                <Input
                  name="meet_link"
                  type="url"
                  placeholder="https://meet.google.com/…"
                  defaultValue={booking.meet_link ?? ""}
                  className="w-full"
                />
              </label>
              {/* Secondary: the one primary in this column belongs to the
                  action that leaves the building, below. */}
              <Button type="submit" variant="secondary" className="justify-center">
                Save meeting
              </Button>
            </form>
          </section>

          {/*
            The two buttons that leave the building, under a heading that says
            so. Stacked with Save they read as three interchangeable full-width
            controls — which is how a reminder gets emailed by muscle memory.
          */}
          <section className="rounded-[var(--sdm-radius-md)] border border-[var(--sdm-border-default)] bg-[var(--admin-panel)] p-4">
            <h3 className="sdm-eyebrow text-[var(--sdm-text-tertiary)]">Send to visitor</h3>
            <p className="sdm-helper-text mt-2 text-[var(--admin-muted)]">
              Details sends the slot and a calendar invite. A brief collects the project scope before
              the call.
            </p>
            <ConfirmSubmitButton
              action={sendBookingDetailsAction}
              hidden={{ id: booking.id }}
              label="Email details"
              variant="primary"
              size="md"
              className="w-full justify-center"
              formClassName="mt-3"
              title="Email the meeting details?"
              body={
                booking.meet_link
                  ? `${booking.name} and the team each get the slot, the link, and a calendar invite.`
                  : `${booking.name} and the team each get the slot and a calendar invite — but this booking has no meeting link yet, so the email will say the link is still to follow.`
              }
              confirmLabel="Send details"
            />

            <QuickBriefPanel
              forms={forms}
              createBrief={(formId, days, emailNow, locale) =>
                createBriefFromBookingAction(booking.id, formId, days, emailNow, locale)
              }
            />
          </section>

          <section>
            <h3 className="sdm-eyebrow text-[var(--sdm-text-tertiary)]">Record</h3>
            <dl className="mt-2 divide-y divide-[var(--sdm-border-default)]">
              <MetaRow label="Reserved" value={fmt.full.format(new Date(booking.created_at))} />
              <MetaRow
                label="Calendar"
                value={booking.google_event_id ? "Synced to Google Calendar" : "Local booking only"}
              />
              <MetaRow
                label="Link"
                value={
                  booking.meet_link ? (
                    <a
                      href={booking.meet_link}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-[var(--admin-text)] hover:text-[var(--admin-accent)]"
                    >
                      {booking.meet_link}
                    </a>
                  ) : (
                    "Not set"
                  )
                }
              />
            </dl>
          </section>
        </div>
      </div>
    </aside>
  );
}

export function ScheduleBoard({
  bookings,
  forms,
  timeZone,
  search,
  query,
}: {
  bookings: BookingBoardRow[];
  forms: BriefFormLite[];
  timeZone: string;
  /** The server-rendered SearchBar, so search and the status filter share one bar. */
  search: ReactNode;
  query: string;
}) {
  const fmt = useMemo(() => formatters(timeZone), [timeZone]);
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const now = Date.now();
  const todayKey = fmt.dayKey.format(new Date(now));
  const tomorrowKey = fmt.dayKey.format(new Date(now + 86_400_000));

  const counts = useMemo(() => {
    const byStatus = { all: bookings.length } as Record<BookingStatus | "all", number>;
    for (const bookingStatus of bookingStatuses) {
      byStatus[bookingStatus] = bookings.filter((b) => b.status === bookingStatus).length;
    }
    return byStatus;
  }, [bookings]);

  const todayCount = bookings.filter(
    (b) => b.status === "scheduled" && fmt.dayKey.format(new Date(b.slot_start)) === todayKey,
  ).length;
  const upcomingCount = bookings.filter(
    (b) => b.status === "scheduled" && new Date(b.slot_start).getTime() >= now,
  ).length;
  // Only a meeting that has not happened yet can still be missing its link —
  // counting past ones turned a to-do tile into a permanent grievance.
  const needsLinkCount = bookings.filter(
    (b) => b.status === "scheduled" && !b.meet_link && new Date(b.slot_start).getTime() >= now,
  ).length;

  const filtered = useMemo(
    () => bookings.filter((booking) => status === "all" || booking.status === status),
    [bookings, status],
  );

  /**
   * Forwards for what is still to come, backwards for what already happened —
   * the order a schedule is actually read in. The server hands us the page
   * ordered slot_start desc; the grouping below is what makes it a calendar.
   */
  const { upcomingGroups, pastGroups } = useMemo(() => {
    const ahead: BookingBoardRow[] = [];
    const behind: BookingBoardRow[] = [];
    for (const booking of filtered) {
      (new Date(booking.slot_end).getTime() >= now ? ahead : behind).push(booking);
    }
    ahead.sort((a, b) => a.slot_start.localeCompare(b.slot_start));
    behind.sort((a, b) => b.slot_start.localeCompare(a.slot_start));

    const group = (rows: BookingBoardRow[], past: boolean) => {
      const out: { key: string; label: string; tone?: "today"; items: BookingBoardRow[] }[] = [];
      for (const row of rows) {
        const start = new Date(row.slot_start);
        const key = fmt.dayKey.format(start);
        let bucket = out.find((entry) => entry.key === key);
        if (!bucket) {
          // A meeting from this morning is still today — but it must not print
          // a second heading that says "Today" under the Earlier divider.
          const label = past
            ? key === todayKey
              ? "Earlier today"
              : fmt.dayLong.format(start)
            : key === todayKey
              ? "Today"
              : key === tomorrowKey
                ? "Tomorrow"
                : fmt.dayLong.format(start);
          bucket = { key, label, tone: !past && key === todayKey ? "today" : undefined, items: [] };
          out.push(bucket);
        }
        bucket.items.push(row);
      }
      return out;
    };

    return { upcomingGroups: group(ahead, false), pastGroups: group(behind, true) };
  }, [filtered, fmt, now, todayKey, tomorrowKey]);

  const selected = bookings.find((booking) => booking.id === selectedId) ?? null;
  const isNarrowed = Boolean(query) || status !== "all";

  return (
    <div className="flex flex-col gap-5">
      {/* Three across only once there is room for the hint line — at 375px the
          labels wrapped to four lines and the tiles grew taller than the list. */}
      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Today" value={todayCount} hint="Scheduled for today" />
        <MetricCard label="Upcoming" value={upcomingCount} hint="Scheduled ahead" />
        <MetricCard label="Needs link" value={needsLinkCount} hint="Future meetings with no link" />
      </section>

      {/* Search and the status filter are the same act of narrowing, so they are
          one bar now instead of two stacked panels. */}
      <section className="flex flex-col gap-3 rounded-[var(--sdm-radius-lg)] border border-[var(--sdm-border-default)] bg-[var(--admin-panel)] p-3 lg:flex-row lg:items-center">
        <div className="min-w-0 lg:w-[320px]">{search}</div>
        <div className="flex flex-wrap items-center gap-2 lg:ms-auto">
          <FilterChip active={status === "all"} count={counts.all} onClick={() => setStatus("all")}>
            All
          </FilterChip>
          {bookingStatuses.map((bookingStatus) => (
            <FilterChip
              key={bookingStatus}
              active={status === bookingStatus}
              count={counts[bookingStatus]}
              onClick={() => setStatus(bookingStatus)}
            >
              {statusLabels[bookingStatus]}
            </FilterChip>
          ))}
        </div>
      </section>

      <div className={`grid gap-5 ${selected ? "xl:grid-cols-[minmax(0,1fr)_400px]" : ""}`}>
        <div className="flex min-w-0 flex-col gap-6">
          {filtered.length === 0 ? (
            <EmptyState
              kind={isNarrowed ? "filtered" : "first-use"}
              title={isNarrowed ? "No consultations match this view" : "No consultations booked yet"}
              hint={
                isNarrowed
                  ? "Bookings exist — the search and the status filter just exclude them all."
                  : "When someone books a call from the site it lands here. You can also add one by hand."
              }
              action={
                status !== "all" ? (
                  <Button type="button" variant="secondary" onClick={() => setStatus("all")}>
                    Show all statuses
                  </Button>
                ) : null
              }
            />
          ) : (
            <>
              {upcomingGroups.map((group) => (
                <DayGroup
                  key={group.key}
                  label={group.label}
                  tone={group.tone}
                  hint={`${group.items.length} ${group.items.length === 1 ? "meeting" : "meetings"}`}
                >
                  {group.items.map((booking) => (
                    <BookingRow
                      key={booking.id}
                      booking={booking}
                      fmt={fmt}
                      selected={booking.id === selectedId}
                      onOpen={() => setSelectedId(booking.id === selectedId ? null : booking.id)}
                    />
                  ))}
                </DayGroup>
              ))}

              {pastGroups.length > 0 ? (
                <div className="flex items-center gap-3 pt-1">
                  <span className="sdm-eyebrow text-[var(--sdm-text-tertiary)]">Earlier</span>
                  <span className="h-px flex-1 bg-[var(--sdm-border-default)]" />
                </div>
              ) : null}

              {pastGroups.map((group) => (
                <DayGroup
                  key={group.key}
                  label={group.label}
                  hint={`${group.items.length} ${group.items.length === 1 ? "meeting" : "meetings"}`}
                >
                  {group.items.map((booking) => (
                    <BookingRow
                      key={booking.id}
                      booking={booking}
                      fmt={fmt}
                      selected={booking.id === selectedId}
                      onOpen={() => setSelectedId(booking.id === selectedId ? null : booking.id)}
                    />
                  ))}
                </DayGroup>
              ))}
            </>
          )}
        </div>

        {selected ? (
          /*
            Keyed by booking id on purpose. The dossier's form is uncontrolled —
            defaultValue only lands on mount — so without a key React reuses the
            same inputs when you switch bookings and the previous meeting's link
            and status stay sitting in the fields. It looked like every booking
            shared one link, and hitting Save made that true. A new key remounts
            the panel, so each booking opens on its own values.
          */
          <BookingDossier
            key={selected.id}
            booking={selected}
            forms={forms}
            fmt={fmt}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
      </div>
    </div>
  );
}
