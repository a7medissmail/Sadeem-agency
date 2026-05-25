import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import SettingsForm from "./SettingsForm";

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
  social_links: {},
  updated_at: new Date().toISOString(),
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
  const { settings, error } = await loadSettings();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="CONFIG"
        title="Website Settings"
        description="Control the public brand system: logos, favicon, footer contact details, locations, and social links."
      />

      <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--admin-accent)]">Site OS</p>
          <h2 className="mt-2 max-w-[13ch] text-[34px] font-semibold leading-[1.02] tracking-tight text-[var(--admin-text)]">
            One source for the public brand.
          </h2>
          <p className="mt-4 max-w-[68ch] text-[14.5px] leading-relaxed text-[var(--admin-muted)]">
            The navbar, footer, email templates, favicon, and social icons should all pull from this screen.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Dark logo</p>
            <div className="mt-3 text-[30px] font-semibold leading-none text-[var(--admin-text)]">{settings.logo_dark_url ? "Set" : "-"}</div>
            <p className="mt-3 text-[12.5px] text-[var(--admin-muted)]">Light nav</p>
          </div>
          <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">White logo</p>
            <div className="mt-3 text-[30px] font-semibold leading-none text-[var(--admin-text)]">{settings.logo_light_url ? "Set" : "-"}</div>
            <p className="mt-3 text-[12.5px] text-[var(--admin-muted)]">Dark nav/footer</p>
          </div>
          <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Favicon</p>
            <div className="mt-3 text-[30px] font-semibold leading-none text-[var(--admin-text)]">{settings.favicon_url ? "Set" : "-"}</div>
            <p className="mt-3 text-[12.5px] text-[var(--admin-muted)]">Browser icon</p>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200">
          Couldn&apos;t load settings: <code>{error}</code>. Run{" "}
          <code>supabase/migrations/0011_site_settings.sql</code> in Supabase SQL Editor.
        </div>
      ) : null}

      <SettingsForm settings={settings} />
    </div>
  );
}
