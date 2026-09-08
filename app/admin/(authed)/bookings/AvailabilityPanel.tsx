"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { ConfirmSubmitButton } from "@/components/admin/ui/ConfirmSubmitButton";
import { DeleteConfirmButton } from "@/components/admin/ui/DeleteConfirmButton";
import { Input, Select } from "@/components/admin/ui/Field";
import {
  createAvailabilityRuleAction,
  createBookingBlackoutAction,
  deleteAvailabilityRuleAction,
  deleteBookingBlackoutAction,
  saveBookingSettingsAction,
  updateAvailabilityRuleAction,
} from "./actions";
import type { AvailabilityRuleRow, BookingBlackoutRow, BookingSettingsRow } from "./types";

/**
 * Availability view — the configuration half of /admin/bookings.
 *
 * What made the old version the densest thing on the page: every rule was
 * rendered as a permanently open seven-field form, so five windows meant
 * thirty-five inputs and five identical Save buttons on screen — for settings
 * that change about once a month, sitting directly under the day's meetings.
 *
 * Here the week is a picture first (what the public calendar actually offers),
 * each rule is one readable line, and the form only appears for the row being
 * edited.
 */

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekdaysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "10:00:00" → "10:00". The column is time(0) in Postgres, seconds are noise. */
function hhmm(value: string) {
  return value.slice(0, 5);
}

function ruleSummary(rule: AvailabilityRuleRow) {
  return `${rule.slot_minutes} min slots · ${rule.buffer_minutes} min buffer`;
}

// Mirrors weekKey() in lib/booking/settings.ts — that module is server-only, so
// the readout below recomputes it client-side. Keep the two in sync.
function weekKeyOf(dayKey: string, weekStartsOn: number) {
  const [year, month, day] = dayKey.split("-").map(Number);
  const noon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const back = (noon.getUTCDay() - weekStartsOn + 7) % 7;
  noon.setUTCDate(noon.getUTCDate() - back);
  return noon.toISOString().slice(0, 10);
}

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--sdm-radius-lg)] border border-[var(--sdm-border-default)] bg-[var(--admin-panel)]">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--sdm-border-default)] p-5">
        <div className="min-w-0">
          <h2 className="sdm-card-title text-[var(--admin-text)]">{title}</h2>
          {description ? (
            <p className="sdm-body-small mt-1 max-w-[62ch] text-[var(--admin-muted)]">{description}</p>
          ) : null}
        </div>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** The six inputs a rule is made of, laid out on one line from `xl` up. */
function RuleFields({ rule }: { rule?: AvailabilityRuleRow }) {
  return (
    <>
      <label className="flex flex-col gap-1.5">
        <span className="sdm-form-label text-[var(--sdm-text-secondary)]">Day</span>
        <Select name="weekday" defaultValue={String(rule?.weekday ?? 1)}>
          {weekdays.map((weekday, index) => (
            <option key={weekday} value={index}>
              {weekday}
            </option>
          ))}
        </Select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="sdm-form-label text-[var(--sdm-text-secondary)]">From</span>
        <Input name="start_time" type="time" defaultValue={hhmm(rule?.start_time ?? "10:00")} required />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="sdm-form-label text-[var(--sdm-text-secondary)]">To</span>
        <Input name="end_time" type="time" defaultValue={hhmm(rule?.end_time ?? "16:00")} required />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="sdm-form-label text-[var(--sdm-text-secondary)]">Slot (min)</span>
        <Input name="slot_minutes" type="number" min={15} max={180} defaultValue={rule?.slot_minutes ?? 45} required />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="sdm-form-label text-[var(--sdm-text-secondary)]">Buffer (min)</span>
        <Input name="buffer_minutes" type="number" min={0} max={120} defaultValue={rule?.buffer_minutes ?? 15} required />
      </label>
      <label className="flex items-center gap-2 self-end pb-2.5">
        <input
          type="checkbox"
          name="active"
          defaultChecked={rule?.active ?? true}
          className="h-4 w-4 accent-[var(--admin-accent)]"
        />
        <span className="sdm-body-small text-[var(--admin-muted)]">Active</span>
      </label>
    </>
  );
}

const ruleGrid =
  "grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_0.8fr_auto_auto] xl:items-end";

function WeekStrip({ rules }: { rules: AvailabilityRuleRow[] }) {
  const byDay = useMemo(() => {
    const map: AvailabilityRuleRow[][] = [[], [], [], [], [], [], []];
    for (const rule of rules) {
      if (rule.active && map[rule.weekday]) map[rule.weekday].push(rule);
    }
    for (const day of map) day.sort((a, b) => a.start_time.localeCompare(b.start_time));
    return map;
  }, [rules]);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {weekdaysShort.map((day, index) => {
        const windows = byDay[index];
        const open = windows.length > 0;
        return (
          <div
            key={day}
            className={`rounded-[var(--sdm-radius-md)] border p-3 ${
              open
                ? "border-[var(--sdm-border-default)] bg-[var(--admin-panel-hover)]"
                : "border-dashed border-[var(--sdm-border-default)]"
            }`}
          >
            <p className="sdm-eyebrow text-[var(--sdm-text-tertiary)]">{day}</p>
            {open ? (
              <div className="mt-2 flex flex-col gap-1">
                {windows.map((window) => (
                  <p
                    key={window.id}
                    className="sdm-caption tabular-nums text-[var(--admin-text)]"
                  >
                    {hhmm(window.start_time)} – {hhmm(window.end_time)}
                  </p>
                ))}
              </div>
            ) : (
              <p className="sdm-caption mt-2 text-[var(--sdm-text-tertiary)]">Closed</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RuleRow({ rule }: { rule: AvailabilityRuleRow }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-[var(--sdm-radius-md)] border border-[var(--sdm-border-selected)] bg-[var(--admin-panel-hover)] p-4">
        <form action={updateAvailabilityRuleAction} className={ruleGrid}>
          <input type="hidden" name="id" value={rule.id} />
          <RuleFields rule={rule} />
          {/* One grid cell, two buttons — the row template has a single slot
              for actions and Cancel used to wrap onto a line of its own. */}
          <div className="flex items-center gap-2">
            <Button type="submit" variant="secondary" className="justify-center">
              Save
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
        {/* Deleting lives inside the edit state on purpose: a red button on
            every resting row made a wall of red out of a settings list. */}
        <div className="mt-3 flex justify-end border-t border-[var(--sdm-border-default)] pt-3">
          <DeleteConfirmButton
            action={deleteAvailabilityRuleAction}
            id={rule.id}
            label="Delete window"
            size="md"
            objectName={`the ${weekdays[rule.weekday]} ${hhmm(rule.start_time)} window`}
            blastRadius="Slots this window opened stop being offered. Consultations already booked into them are kept."
          />
        </div>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--sdm-radius-md)] border border-[var(--sdm-border-default)] px-4 py-3">
      <span className="sdm-body-small w-[86px] font-semibold text-[var(--admin-text)]">
        {weekdays[rule.weekday]}
      </span>
      <span className="sdm-body-small tabular-nums text-[var(--admin-text)]">
        {hhmm(rule.start_time)} – {hhmm(rule.end_time)}
      </span>
      <span className="sdm-caption text-[var(--admin-muted)]">{ruleSummary(rule)}</span>
      {rule.active ? null : <Badge tone="neutral">Paused</Badge>}
      <Button type="button" variant="tertiary" size="sm" className="ms-auto" onClick={() => setEditing(true)}>
        Edit
      </Button>
    </li>
  );
}

function AvailabilityWindows({ rules }: { rules: AvailabilityRuleRow[] }) {
  const [adding, setAdding] = useState(false);
  const activeCount = rules.filter((rule) => rule.active).length;

  const sorted = useMemo(
    () =>
      [...rules].sort(
        (a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time),
      ),
    [rules],
  );

  return (
    <SectionCard
      title="Weekly windows"
      description="The hours the public booking calendar offers, repeated every week."
      action={
        <Button type="button" variant={adding ? "ghost" : "secondary"} onClick={() => setAdding((v) => !v)}>
          {adding ? "Cancel" : "Add window"}
        </Button>
      }
    >
      <WeekStrip rules={rules} />

      {adding ? (
        <form
          action={createAvailabilityRuleAction}
          className={`${ruleGrid} mt-5 rounded-[var(--sdm-radius-md)] border border-[var(--sdm-border-selected)] bg-[var(--admin-panel-hover)] p-4`}
        >
          <RuleFields />
          <Button type="submit" variant="primary" className="justify-center">
            Add
          </Button>
        </form>
      ) : null}

      <div className="mt-5 flex items-baseline justify-between gap-3">
        <h3 className="sdm-eyebrow text-[var(--sdm-text-tertiary)]">
          {rules.length === 0 ? "No windows" : `${activeCount} of ${rules.length} active`}
        </h3>
      </div>

      {rules.length === 0 ? (
        <p className="sdm-body-small mt-3 rounded-[var(--sdm-radius-md)] border border-dashed border-[var(--sdm-border-default)] px-4 py-8 text-center text-[var(--admin-muted)]">
          No availability windows yet — the public calendar has nothing to offer.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {sorted.map((rule) => (
            <RuleRow key={rule.id} rule={rule} />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function CapsSection({
  settings,
  upcomingSlots,
  timeZone,
}: {
  settings: BookingSettingsRow;
  upcomingSlots: string[];
  timeZone: string;
}) {
  // How full the next two weeks already are — the number the caps act on.
  const usage = useMemo(() => {
    const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone });
    const label = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone });
    const counts = new Map<string, number>();
    for (const slot of upcomingSlots) {
      const week = weekKeyOf(dayKey.format(new Date(slot)), settings.week_starts_on);
      counts.set(week, (counts.get(week) ?? 0) + 1);
    }

    const thisWeek = weekKeyOf(dayKey.format(new Date()), settings.week_starts_on);
    const [year, month, day] = thisWeek.split("-").map(Number);
    return [0, 1].map((offset) => {
      const start = new Date(Date.UTC(year, month - 1, day + offset * 7, 12, 0, 0));
      const key = start.toISOString().slice(0, 10);
      return {
        key,
        title: offset === 0 ? "This week" : "Next week",
        from: label.format(start),
        count: counts.get(key) ?? 0,
      };
    });
  }, [upcomingSlots, settings.week_starts_on, timeZone]);

  const capped = settings.max_per_week > 0;

  return (
    <SectionCard
      title="Limits"
      description="When a week or a day hits its cap, every remaining slot in it disappears from the public calendar. Cancelled and no-show bookings free their slot back up."
    >
      {/* The load against the cap, inline with the cap itself — it used to be
          three full-size stat tiles competing with the four at the top. */}
      <div className="grid gap-3 sm:grid-cols-2">
        {usage.map((week) => {
          const pct = capped ? Math.min(100, Math.round((week.count / settings.max_per_week) * 100)) : 0;
          return (
            <div
              key={week.key}
              className="rounded-[var(--sdm-radius-md)] border border-[var(--sdm-border-default)] p-4"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="sdm-eyebrow text-[var(--sdm-text-tertiary)]">{week.title}</span>
                <span className="sdm-metadata text-[var(--sdm-text-tertiary)]">from {week.from}</span>
              </div>
              <p className="sdm-section-title mt-2 tabular-nums text-[var(--admin-text)]">
                {week.count}
                {capped ? (
                  <span className="sdm-body-small text-[var(--admin-muted)]"> / {settings.max_per_week}</span>
                ) : null}
              </p>
              {capped ? (
                <div className="mt-3 h-1 w-full rounded-full bg-[var(--sdm-border-default)]">
                  <div
                    className={`h-1 rounded-full ${
                      pct >= 100 ? "bg-[var(--sdm-status-danger)]" : "bg-[var(--admin-accent)]"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              ) : (
                <p className="sdm-caption mt-3 text-[var(--sdm-text-tertiary)]">No weekly cap</p>
              )}
            </div>
          );
        })}
      </div>

      <form
        action={saveBookingSettingsAction}
        className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[repeat(6,1fr)_auto] xl:items-end"
      >
        <label className="flex flex-col gap-1.5">
          <span className="sdm-form-label text-[var(--sdm-text-secondary)]">Max / week</span>
          <Input name="max_per_week" type="number" min={0} max={100} defaultValue={settings.max_per_week} required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="sdm-form-label text-[var(--sdm-text-secondary)]">Max / day</span>
          <Input name="max_per_day" type="number" min={0} max={50} defaultValue={settings.max_per_day} required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="sdm-form-label text-[var(--sdm-text-secondary)]">Min notice (h)</span>
          <Input name="min_notice_hours" type="number" min={0} max={720} defaultValue={settings.min_notice_hours} required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="sdm-form-label text-[var(--sdm-text-secondary)]">Lead (days)</span>
          <Input name="min_lead_days" type="number" min={0} max={30} defaultValue={settings.min_lead_days} required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="sdm-form-label text-[var(--sdm-text-secondary)]">Horizon (days)</span>
          <Input name="max_advance_days" type="number" min={1} max={180} defaultValue={settings.max_advance_days} required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="sdm-form-label text-[var(--sdm-text-secondary)]">Week starts</span>
          <Select name="week_starts_on" defaultValue={String(settings.week_starts_on)}>
            {weekdays.map((weekday, index) => (
              <option key={weekday} value={index}>
                {weekday}
              </option>
            ))}
          </Select>
        </label>
        <Button type="submit" variant="secondary" className="justify-center">
          Save limits
        </Button>
        <p className="sdm-helper-text text-[var(--admin-muted)] sm:col-span-2 xl:col-span-full">
          Use <strong className="text-[var(--admin-text)]">0</strong> for no limit.{" "}
          <strong className="text-[var(--admin-text)]">Lead</strong> is how many whole days ahead the first bookable
          day is — 2 closes today and tomorrow.
        </p>
      </form>
    </SectionCard>
  );
}

function BlackoutSection({ blackouts }: { blackouts: BookingBlackoutRow[] }) {
  const [adding, setAdding] = useState(false);

  return (
    <SectionCard
      title="Blackout dates"
      description="Holidays, travel, or a heads-down week. Nothing is bookable inside these ranges, end date included."
      action={
        <Button type="button" variant={adding ? "ghost" : "secondary"} onClick={() => setAdding((v) => !v)}>
          {adding ? "Cancel" : "Block dates"}
        </Button>
      }
    >
      {adding ? (
        <form
          action={createBookingBlackoutAction}
          className="mb-5 grid gap-3 rounded-[var(--sdm-radius-md)] border border-[var(--sdm-border-selected)] bg-[var(--admin-panel-hover)] p-4 sm:grid-cols-2 xl:grid-cols-[0.8fr_0.8fr_1.4fr_auto] xl:items-end"
        >
          <label className="flex flex-col gap-1.5">
            <span className="sdm-form-label text-[var(--sdm-text-secondary)]">From</span>
            <Input name="starts_on" type="date" required />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="sdm-form-label text-[var(--sdm-text-secondary)]">To</span>
            <Input name="ends_on" type="date" required />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="sdm-form-label text-[var(--sdm-text-secondary)]">Reason</span>
            <Input name="reason" type="text" maxLength={160} placeholder="Eid holiday, offsite, …" />
          </label>
          <Button type="submit" variant="primary" className="justify-center">
            Block
          </Button>
        </form>
      ) : null}

      {blackouts.length === 0 ? (
        <p className="sdm-body-small rounded-[var(--sdm-radius-md)] border border-dashed border-[var(--sdm-border-default)] px-4 py-8 text-center text-[var(--admin-muted)]">
          No blackout dates — every day inside the horizon is open.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {blackouts.map((blackout) => (
            <li
              key={blackout.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--sdm-radius-md)] border border-[var(--sdm-border-default)] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="sdm-body-small tabular-nums text-[var(--admin-text)]">
                  {blackout.starts_on}
                  {blackout.ends_on !== blackout.starts_on ? ` → ${blackout.ends_on}` : ""}
                </p>
                {blackout.reason ? (
                  <p className="sdm-caption mt-0.5 text-[var(--admin-muted)]">{blackout.reason}</p>
                ) : null}
              </div>
              <ConfirmSubmitButton
                action={deleteBookingBlackoutAction}
                hidden={{ id: blackout.id }}
                label="Remove"
                variant="danger"
                title="Remove this blackout range?"
                body="The dates open back up for booking immediately."
                confirmLabel="Remove blackout"
              />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export function AvailabilityPanel({
  rules,
  settings,
  blackouts,
  upcomingSlots,
  timeZone,
}: {
  rules: AvailabilityRuleRow[];
  settings: BookingSettingsRow;
  blackouts: BookingBlackoutRow[];
  /** slot_start of every still-scheduled booking in the cap window. */
  upcomingSlots: string[];
  timeZone: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <AvailabilityWindows rules={rules} />
      <CapsSection settings={settings} upcomingSlots={upcomingSlots} timeZone={timeZone} />
      <BlackoutSection blackouts={blackouts} />
    </div>
  );
}
