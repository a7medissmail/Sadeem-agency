"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CONSENT_MODE, CONSENT_STORAGE_KEY, analyticsEnabled } from "@/lib/analytics/config";
import { denyConsent, grantConsent } from "@/lib/analytics/client";

/**
 * Consent notice for the public site.
 *
 * Two shapes, driven by CONSENT_MODE:
 *
 *   "notice"  measurement has already started; this informs and dismisses
 *   "opt-in"  nothing is measured until Accept is pressed
 *
 * The site currently runs on "notice". The opt-in path is built and wired
 * rather than left as a TODO, because the gap between the two is one constant
 * and a deploy — and the moment it is needed (EU traffic, a stricter reading of
 * PDPL, a client asking) is not the moment to start building it.
 *
 * Styled with the public site's own tokens. The --sdm-* layer is admin chrome
 * and deliberately does not reach the marketing pages.
 */
export function ConsentNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!analyticsEnabled) return;
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  if (!analyticsEnabled || !visible) return null;

  const isOptIn = CONSENT_MODE === "opt-in";

  function dismiss(choice: "granted" | "denied") {
    if (choice === "granted") grantConsent();
    else denyConsent();
    setVisible(false);
  }

  return (
    <aside
      role="region"
      aria-label="Cookie notice"
      className="consent-notice"
    >
      <p className="consent-notice-copy">
        {isOptIn
          ? "We'd like to measure how this site is used so we can improve it. Analytics only — we don't advertise to you and we don't sell anything on."
          : "We use analytics cookies to understand how this site is used. Analytics only — we don't advertise to you and we don't sell anything on."}{" "}
        <Link href="/privacy" className="consent-notice-link">
          Privacy
        </Link>
      </p>

      <div className="consent-notice-actions">
        {isOptIn ? (
          <>
            <button type="button" onClick={() => dismiss("denied")} className="consent-notice-btn">
              Decline
            </button>
            <button
              type="button"
              onClick={() => dismiss("granted")}
              className="consent-notice-btn is-primary"
            >
              Accept
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => dismiss("granted")}
            className="consent-notice-btn is-primary"
          >
            Got it
          </button>
        )}
      </div>
    </aside>
  );
}
