"use client";

import Link from "next/link";

/**
 * Error boundary for the public marketing routes.
 * The root layout (fonts, globals.css, SiteSettingsProvider) is still active,
 * so CSS classes and tokens are available.
 */
export default function MarketingError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "82vh",
        padding: "80px 24px",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 520 }}>
        <p className="team-brief-kicker" style={{ marginBottom: 16 }}>
          ERR / SOMETHING WENT WRONG
        </p>
        <h1
          className="display"
          style={{ margin: "0 0 20px", letterSpacing: "-0.03em" }}
        >
          A signal was lost.
        </h1>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.7,
            color: "rgba(0,0,0,0.48)",
            marginBottom: 40,
          }}
        >
          This page encountered an unexpected error. Try refreshing — if the
          problem persists, contact us.
        </p>
        <div
          style={{
            display: "flex",
            gap: 20,
            justifyContent: "center",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={reset}
            className="cta-link"
            style={{ cursor: "pointer", background: "none" }}
          >
            <span>TRY AGAIN</span>
          </button>
          <Link href="/" className="service-back-link">
            ← Home
          </Link>
        </div>
      </div>
    </main>
  );
}
