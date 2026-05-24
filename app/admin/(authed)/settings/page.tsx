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
        description="Global brand assets, favicon, footer contact details, and social links used across the public site."
      />

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
