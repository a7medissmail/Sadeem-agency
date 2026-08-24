"use client";

import { analyticsEnabled, CONSENT_MODE, CONSENT_STORAGE_KEY } from "./config";
import { stripPersonalData, type AnalyticsEvent } from "./events";

/**
 * Browser-side tracking, for behaviour: which pages, which CTAs, which forms
 * get started and abandoned.
 *
 * Conversions do NOT go through here. Ad blockers and iOS drop somewhere
 * between a fifth and two fifths of browser beacons, which is fine for
 * behavioural trends and useless for "how many leads did we get". Those are
 * sent from the server action that writes the record — see ./server.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function hasConsent(): boolean {
  if (typeof window === "undefined") return false;
  if (CONSENT_MODE === "notice") return true;
  return window.localStorage.getItem(CONSENT_STORAGE_KEY) === "granted";
}

/**
 * Fire an event. Silently does nothing when the property is not configured,
 * so the site runs identically before the GA4 account exists.
 */
export function track(event: AnalyticsEvent): void {
  if (!analyticsEnabled || typeof window === "undefined") return;
  if (!hasConsent()) return;
  if (typeof window.gtag !== "function") return;

  window.gtag("event", event.name, stripPersonalData(event.params as Record<string, unknown>));
}

/**
 * Called by the consent notice when someone accepts under "opt-in". Under
 * "notice" it never runs, because measurement already started.
 */
export function grantConsent(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
  window.gtag?.("consent", "update", { analytics_storage: "granted" });
}

export function denyConsent(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_STORAGE_KEY, "denied");
  window.gtag?.("consent", "update", { analytics_storage: "denied" });
}
