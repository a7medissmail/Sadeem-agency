import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { defaultSocialUrls } from "@/lib/site/social";
import type { Database } from "@/types/database";
import { getHomeSectionLayout } from "@/lib/site/homeSections";
import SettingsForm from "./SettingsForm";
import { MaintenanceToggle } from "./MaintenanceToggle";
import { HomeSectionsEditor } from "./HomeSectionsEditor";
import { saveMaintenanceMessageAction } from "./actions";

export const metadata = { title: "Website Settings - SADEEM Admin" };

type SettingsRow = Database["public"]["Tables"]["site_settings"]["Row"];

const fallback: SettingsRow = {
  id: true,
  logo_dark_url: null,
  logo_light_url: null,
  favicon_url: null,
  footer_description: "Strategic growth advisory — helping ambitious companies achieve measurable results.",
  footer_email: "hello@sadeem.agency",
  footer_phone: null,
  footer_location: null,
  social_links: defaultSocialUrls,
  updated_at: new Date().toISOString(),
  is_maintenance_mode: false,
  maintenance_message: null,
};

async function loadSettings() {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.from("site_settings").select("*").eq("id", true).maybeSingle();
    if (error) throw error;
    return { settings: data ?? fallback, error: null as string | null };
  } catch (err) {
    return { settings: fallback, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export default async function SettingsPage() {
  await requireRole(["admin", "editor"]);
  const [{ settings, error }, homeSections] = await Promise.all([loadSettings(), getHomeSectionLayout()]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="CONFIG"
        title="Website Settings"
        description="Control the public brand system: logos, favicon, footer contact details, locations, and social links."
      />

      {/* ── Maintenance mode ─────────────────────────────────────── */}
      <section className={`flex items-start justify-between gap-6 border p-5 ${settings.is_maintenance_mode ? "border-[color-mix(in_srgb,var(--sdm-status-danger)_40%,transparent)] bg-[color-mix(in_srgb,var(--sdm-status-danger)_6%,transparent)]" : "border-[var(--admin-border)] bg-[var(--admin-panel)]"}`}>
        <div>
          <p className="sdm-eyebrow text-[var(--admin-accent)]">Site Status</p>
          <h2 className="mt-1 text-[22px] font-semibold leading-snug tracking-tight text-[var(--admin-text)]">
            Maintenance Mode
          </h2>
          <p className="mt-2 max-w-[52ch] text-[13.5px] leading-relaxed text-[var(--admin-muted)]">
            When enabled, <strong className="text-[var(--admin-text)]">all public pages</strong> redirect to the maintenance page.
            Admin routes (<code className="text-[11px]">/admin</code>) stay accessible.
            The middleware cache refreshes within 30 seconds of toggling.
          </p>
          {settings.is_maintenance_mode ? (
            <div className="mt-3 inline-flex items-center gap-2 sdm-eyebrow text-[var(--sdm-text-danger)]">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--sdm-status-danger)]" />
              Site is offline — maintenance page is live
            </div>
          ) : (
            <div className="mt-3 inline-flex items-center gap-2 sdm-eyebrow text-[var(--sdm-text-success)]">
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--sdm-status-success)]" />
              Site is online
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-3">
          {/* Message — saved independently so mode doesn't flip accidentally */}
          <form action={saveMaintenanceMessageAction} className="flex items-center gap-2">
            <input
              type="text"
              name="maintenance_message"
              defaultValue={settings.maintenance_message ?? ""}
              placeholder="Custom message for visitors (optional)"
              className="w-64 border border-[var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-[13px] text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-accent)]"
            />
            <button
              type="submit"
              className="px-3 py-2 sdm-eyebrow border border-[var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-muted)] hover:text-[var(--admin-text)] transition-colors"
            >
              Save
            </button>
          </form>
          {/* Mode toggle — separate form so message edit can't accidentally flip mode */}
          <MaintenanceToggle isOn={settings.is_maintenance_mode} />
        </div>
      </section>

      {/* ── Brand settings ───────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
          <p className="sdm-eyebrow text-[var(--admin-subtle)]">Dark logo</p>
          <div className="mt-3 text-[30px] font-semibold leading-none text-[var(--admin-text)]">{settings.logo_dark_url ? "Set" : "-"}</div>
          <p className="mt-3 text-[12.5px] text-[var(--admin-muted)]">Light nav</p>
        </div>
        <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
          <p className="sdm-eyebrow text-[var(--admin-subtle)]">White logo</p>
          <div className="mt-3 text-[30px] font-semibold leading-none text-[var(--admin-text)]">{settings.logo_light_url ? "Set" : "-"}</div>
          <p className="mt-3 text-[12.5px] text-[var(--admin-muted)]">Dark nav/footer</p>
        </div>
        <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
          <p className="sdm-eyebrow text-[var(--admin-subtle)]">Favicon</p>
          <div className="mt-3 text-[30px] font-semibold leading-none text-[var(--admin-text)]">{settings.favicon_url ? "Set" : "-"}</div>
          <p className="mt-3 text-[12.5px] text-[var(--admin-muted)]">Browser icon</p>
        </div>
      </section>

      {error ? (
        <div className="rounded-md border border-[color-mix(in_srgb,var(--sdm-status-warning)_30%,transparent)] bg-[color-mix(in_srgb,var(--sdm-status-warning)_6%,transparent)] px-4 py-3 text-[13px] text-[var(--sdm-text-warning)]">
          Couldn&apos;t load settings: <code>{error}</code>. Run{" "}
          <code>supabase/migrations/0011_site_settings.sql</code> in Supabase SQL Editor.
        </div>
      ) : null}

      <HomeSectionsEditor sections={homeSections} />

      <SettingsForm settings={settings} />
    </div>
  );
}
