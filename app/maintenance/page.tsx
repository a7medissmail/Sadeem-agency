import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { SadeemMark } from "@/components/marks";

export const metadata = { title: "Under Maintenance — SADEEM" };

// This page is always reachable (middleware passthrough).
// Fetch settings directly so the real logo renders without context providers.
async function getMaintenanceData() {
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from("site_settings")
      .select("logo_light_url, maintenance_message")
      .eq("id", true)
      .maybeSingle();
    return {
      logoUrl: data?.logo_light_url ?? null,
      message: data?.maintenance_message ?? null,
    };
  } catch {
    return { logoUrl: null, message: null };
  }
}

export default async function MaintenancePage() {
  const { logoUrl, message } = await getMaintenanceData();

  return (
    <div className="mn-page">
      {/* Background grid + vignette */}
      <div className="mn-bg" aria-hidden="true">
        <div className="mn-grid" />
        <div className="mn-vignette" />
      </div>

      {/* Logo */}
      <header className="mn-header">
        <a href="/" aria-label="SADEEM" className="mn-logo">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="SADEEM" className="brand-logo-img" style={{ height: 32 }} />
          ) : (
            <SadeemMark />
          )}
        </a>
      </header>

      {/* Stage */}
      <main className="mn-stage">
        <div className="mn-center">
          <div className="mn-eyebrow">
            <span className="mn-tick" />
            <span>SYSTEM STATUS</span>
            <span>·</span>
            <span style={{ color: "var(--accent)" }}>OFFLINE</span>
          </div>

          <h1 className="mn-heading">
            We&apos;re doing<br />
            <span style={{ color: "var(--accent)" }}>some work.</span>
          </h1>

          <p className="mn-sub">
            {message ||
              "The site is temporarily offline for scheduled maintenance. We'll be back shortly."}
          </p>

          {/* Pulsing status indicator */}
          <div className="mn-status">
            <span className="mn-dot" />
            <span>Maintenance in progress — estimated downtime is short</span>
          </div>
        </div>
      </main>

      {/* Footer strip */}
      <footer className="mn-footer">
        <span>SADEEM · Strategic Growth Advisory</span>
        <span style={{ color: "rgba(245,243,240,0.35)" }}>
          For urgent matters:{" "}
          <a href="mailto:hello@sadeem.agency" style={{ color: "var(--accent)", textDecoration: "none" }}>
            hello@sadeem.agency
          </a>
        </span>
      </footer>
    </div>
  );
}
