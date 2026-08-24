/**
 * lib/analytics/events.ts
 * ──────────────────────
 * The vocabulary. Every event the site is allowed to send, named after what
 * happened in the business rather than after what a tag manager calls it.
 *
 * Two rules hold this file together:
 *
 * 1. No personal data, ever. Names, emails, phone numbers and company names
 *    never leave the building through here. What is useful for analysis is the
 *    *shape* of a lead — which form, which source, which service — not who it
 *    was. The CRM already knows who it was; that is its job, not analytics'.
 *
 * 2. Params are a closed set per event. An open `Record<string, unknown>` is how
 *    a schema rots: six months in, half the events carry `type` and half carry
 *    `kind` and no report can join them.
 */

export type AnalyticsEvent =
  | { name: "lead_submitted"; params: { source: LeadSourceParam; has_company: boolean } }
  | { name: "lead_form_started"; params: { source: LeadSourceParam } }
  | { name: "consultation_booked"; params: { has_meeting_link: boolean } }
  | { name: "course_registered"; params: { course_slug: string } }
  | { name: "job_application_submitted"; params: { job_slug: string } }
  | { name: "brief_submitted"; params: { form_slug: string } }
  | { name: "service_viewed"; params: { service_slug: string } }
  | { name: "cta_clicked"; params: { cta: string; location: string } };

/** Mirrors the `source` column on `leads`, so reports and the CRM agree. */
export type LeadSourceParam = "homepage" | "course" | "consultation" | "other";

export type EventName = AnalyticsEvent["name"];

/**
 * The events that represent money. Marked so a destination can treat them as
 * conversions without every call site having to know that it should.
 */
export const CONVERSION_EVENTS: ReadonlySet<EventName> = new Set([
  "lead_submitted",
  "consultation_booked",
  "course_registered",
  "brief_submitted",
]);

/**
 * Last line of defence. Analytics payloads are small and hand-written, so a
 * stray `email` is a typo away — this drops it rather than shipping it.
 * Deliberately noisy in development so the mistake gets fixed at the call site.
 */
const FORBIDDEN_KEYS = ["email", "name", "phone", "company", "message", "client_name", "full_name"];

export function stripPersonalData<T extends Record<string, unknown>>(params: T): T {
  const out = { ...params };
  for (const key of Object.keys(out)) {
    if (FORBIDDEN_KEYS.some((f) => key.toLowerCase().includes(f))) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[analytics] dropped "${key}" — personal data must not reach analytics`);
      }
      delete out[key];
    }
  }
  return out;
}
