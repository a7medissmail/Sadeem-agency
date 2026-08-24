"use client";

import Script from "next/script";
import { CONSENT_DEFAULTS, GA_MEASUREMENT_ID, analyticsEnabled } from "@/lib/analytics/config";

/**
 * Loads gtag.js, after the page is interactive.
 *
 * `afterInteractive` rather than `beforeInteractive` on purpose: analytics is
 * never worth delaying the thing the visitor came for. The site's Core Web
 * Vitals are already measured by Speed Insights, and it would be a poor trade
 * to worsen the number in order to watch it.
 *
 * Consent Mode is configured *before* the config call, which is the order
 * Google requires — set defaults late and the first pageview escapes the gate.
 */
export function GoogleAnalytics() {
  if (!analyticsEnabled) return null;

  return (
    <>
      <Script
        id="ga-consent-defaults"
        strategy="afterInteractive"
        // Must run before gtag config, hence its own inline block ahead of the
        // library rather than a call inside onLoad.
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', ${JSON.stringify(CONSENT_DEFAULTS)});
gtag('js', new Date());
`.trim(),
        }}
      />
      <Script
        id="ga-lib"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="ga-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
gtag('config', ${JSON.stringify(GA_MEASUREMENT_ID)}, {
  anonymize_ip: true,
  send_page_view: true
});
`.trim(),
        }}
      />
    </>
  );
}
