"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitBookingAction, type SubmitBookingState } from "@/lib/actions/bookings";
import type { ConsultationSlot } from "@/lib/booking/slots";

type SlotsResponse = {
  timeZone: string;
  slots: ConsultationSlot[];
  error?: string;
};

const initial: SubmitBookingState = { status: "idle" };

function SubmitButton({ hasSlot }: { hasSlot: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="consult-submit" disabled={pending || !hasSlot}>
      <span>{pending ? "Reserving" : "Reserve consultation"}</span>
      <span aria-hidden>-&gt;</span>
    </button>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="consult-field-error">{messages[0]}</p>;
}

export default function ConsultationBooking() {
  const [state, formAction] = useFormState(submitBookingAction, initial);
  const [slots, setSlots] = useState<ConsultationSlot[]>([]);
  const [timeZone, setTimeZone] = useState("Asia/Riyadh");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedStart, setSelectedStart] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadSlots() {
      setLoading(true);
      setLoadError("");
      try {
        const response = await fetch("/api/consultation/slots", { cache: "no-store" });
        const data = (await response.json()) as SlotsResponse;
        if (!response.ok || data.error) throw new Error(data.error || "Could not load slots");
        if (cancelled) return;
        setSlots(data.slots);
        setTimeZone(data.timeZone);
        setSelectedDay(data.slots[0]?.dayKey ?? "");
        setSelectedStart(data.slots[0]?.start ?? "");
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Could not load slots");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSlots();
    return () => {
      cancelled = true;
    };
  }, []);

  const days = useMemo(() => {
    const grouped = new Map<string, ConsultationSlot[]>();
    for (const slot of slots) {
      grouped.set(slot.dayKey, [...(grouped.get(slot.dayKey) ?? []), slot]);
    }
    return [...grouped.entries()].map(([dayKey, items]) => ({ dayKey, items }));
  }, [slots]);

  const activeSlots = days.find((day) => day.dayKey === selectedDay)?.items ?? [];
  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};

  if (state.status === "success") {
    return (
      <div className="consult-success">
        <p className="team-brief-kicker">BOOKED</p>
        <h3>Your consultation is reserved.</h3>
        <p>{state.slotLabel ? `We sent the calendar invite for ${state.slotLabel}.` : "We received your request."}</p>
        {state.meetLink ? (
          <a href={state.meetLink} target="_blank" rel="noreferrer">
            Open Meet link
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <form action={formAction} className="consult-console">
      <input type="hidden" name="slot_start" value={selectedStart} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="consult-console-head">
        <div>
          <p>TIMEZONE</p>
          <strong>{timeZone}</strong>
        </div>
        <div>
          <p>FORMAT</p>
          <strong>45 min / Online</strong>
        </div>
      </div>

      <div className="consult-slots">
        <div className="consult-days" aria-label="Available days">
          {loading ? <span className="consult-loading">Loading availability</span> : null}
          {loadError ? <span className="consult-error">{loadError}</span> : null}
          {!loading && !loadError && days.length === 0 ? (
            <span className="consult-error">No public slots are available right now.</span>
          ) : null}
          {days.map((day) => (
            <button
              key={day.dayKey}
              type="button"
              className={day.dayKey === selectedDay ? "is-active" : undefined}
              onClick={() => {
                setSelectedDay(day.dayKey);
                setSelectedStart(day.items[0]?.start ?? "");
              }}
            >
              <span>{day.items[0]?.weekdayLabel}</span>
              <strong>{day.items[0]?.dateLabel}</strong>
            </button>
          ))}
        </div>

        <div className="consult-times" aria-label="Available times">
          {activeSlots.map((slot) => (
            <button
              key={slot.start}
              type="button"
              className={slot.start === selectedStart ? "is-active" : undefined}
              onClick={() => setSelectedStart(slot.start)}
            >
              {slot.timeLabel}
            </button>
          ))}
        </div>
        <FieldError messages={errors.slot_start} />
      </div>

      <div className="consult-form-grid">
        <label>
          <span>Name</span>
          <input name="name" required autoComplete="name" aria-invalid={Boolean(errors.name)} />
          <FieldError messages={errors.name} />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" required autoComplete="email" aria-invalid={Boolean(errors.email)} />
          <FieldError messages={errors.email} />
        </label>
        <label>
          <span>Phone</span>
          <input name="phone" type="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} />
          <FieldError messages={errors.phone} />
        </label>
        <label className="consult-topic">
          <span>What should we solve?</span>
          <textarea
            name="topic"
            rows={6}
            required
            placeholder="Tell us where the decision is stuck, what growth question matters, or what operating rhythm needs attention."
            aria-invalid={Boolean(errors.topic)}
          />
          <FieldError messages={errors.topic} />
        </label>
      </div>

      {state.status === "error" ? (
        <p className="consult-error" role="alert">
          {state.message}
        </p>
      ) : null}

      <SubmitButton hasSlot={Boolean(selectedStart)} />
    </form>
  );
}
