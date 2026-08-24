/**
 * lib/analytics/config.ts
 * ──────────────────────
 * One place that knows a vendor's name.
 *
 * Everything above this file speaks in business events — "lead_submitted",
 * "consultation_booked" — and never mentions Google. Swapping GA4 out, or
 * adding a second destination later, is a change here and nowhere else. It is
 * the same rule the admin design system runs on: call sites reference a role,
 * not an implementation.
 */

/** Unset in every environment until the GA4 property exists. Everything no-ops. */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

/** Server-only. Required for Measurement Protocol; never exposed to the browser. */
export const GA_API_SECRET = process.env.GA_API_SECRET ?? "";

export const analyticsEnabled = Boolean(GA_MEASUREMENT_ID);
export const serverAnalyticsEnabled = Boolean(GA_MEASUREMENT_ID && GA_API_SECRET);

/**
 * How consent is obtained.
 *
 *   "notice"  the banner informs; measurement starts on first load
 *   "opt-in"  nothing loads until the visitor accepts
 *
 * Currently "notice", which is a deliberate business decision rather than an
 * oversight — worth knowing that GA4 sets a first-party `_ga` cookie, which
 * PDPL and GDPR both treat as non-essential, so "opt-in" is the defensible
 * position if the site starts drawing EU traffic or the risk appetite changes.
 *
 * Flipping this constant is the entire change: the gate, the banner copy and
 * the Consent Mode defaults all read from it.
 */
export const CONSENT_MODE: "notice" | "opt-in" = "notice";

export const CONSENT_STORAGE_KEY = "sadeem-consent";

/**
 * Google Consent Mode v2 defaults.
 *
 * Advertising signals are denied outright and stay denied. Sadeem runs no ad
 * platforms, so granting them would collect data nobody uses while widening the
 * compliance surface for nothing. If Google Ads or Meta ever go live, this is
 * the object to revisit — deliberately, not by accident.
 */
export const CONSENT_DEFAULTS = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: CONSENT_MODE === "notice" ? "granted" : "denied",
} as const;
