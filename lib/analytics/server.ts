import "server-only";

import { cookies } from "next/headers";
import { GA_API_SECRET, GA_MEASUREMENT_ID, serverAnalyticsEnabled } from "./config";
import { CONVERSION_EVENTS, stripPersonalData, type AnalyticsEvent } from "./events";

/**
 * Server-side conversions, via the GA4 Measurement Protocol.
 *
 * This is the half that matters. A browser pixel loses a fifth to two fifths of
 * conversions to ad blockers and iOS, which is tolerable for pageview trends
 * and not tolerable for "how many leads came in". The lead is written inside a
 * server action, so that is where the conversion is counted — nothing in the
 * client can suppress it, and no number has to be reconciled later.
 *
 * Every call is best-effort. Analytics must never be able to fail a lead
 * submission: the whole thing is wrapped, timed out, and swallowed.
 */

const ENDPOINT = "https://www.google-analytics.com/mp/collect";
const TIMEOUT_MS = 1500;

/**
 * GA4 needs a client id to attribute the event to a session. The `_ga` cookie
 * holds it in the form `GA1.1.<client-id>`, so when the visitor's browser did
 * load gtag, the server event stitches onto their existing session.
 *
 * When it did not — blocked, or consent withheld — we fall back to a random id.
 * That still counts the conversion correctly, which is the point, but it lands
 * as a new user rather than joining the session that produced it. Worth knowing
 * when session-level attribution looks lower than the raw conversion count.
 */
function readClientId(): string {
  try {
    const raw = cookies().get("_ga")?.value;
    const parsed = raw?.match(/^GA\d\.\d\.(.+)$/)?.[1];
    if (parsed) return parsed;
  } catch {
    // cookies() throws outside a request scope; fall through.
  }
  return `${Math.floor(Math.random() * 1e9)}.${Math.floor(Date.now() / 1000)}`;
}

export async function trackServer(event: AnalyticsEvent): Promise<void> {
  if (!serverAnalyticsEnabled) return;

  const params = stripPersonalData(event.params as Record<string, unknown>);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    await fetch(
      `${ENDPOINT}?measurement_id=${encodeURIComponent(GA_MEASUREMENT_ID)}&api_secret=${encodeURIComponent(GA_API_SECRET)}`,
      {
        method: "POST",
        signal: controller.signal,
        body: JSON.stringify({
          client_id: readClientId(),
          non_personalized_ads: true,
          events: [
            {
              name: event.name,
              params: {
                ...params,
                // Marks the event as a key event in GA4 without every call site
                // needing to know which of them count as conversions.
                ...(CONVERSION_EVENTS.has(event.name) ? { is_conversion: true } : {}),
                engagement_time_msec: 1,
              },
            },
          ],
        }),
      },
    ).finally(() => clearTimeout(timer));
  } catch (err) {
    // Never surface. A dropped analytics beacon is not worth a failed lead.
    if (process.env.NODE_ENV !== "production") {
      console.warn("[analytics] server event failed:", err);
    }
  }
}
