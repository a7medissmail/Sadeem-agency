"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  formatSiteSettingsError,
  siteSettingsSchema,
  type SiteSettingsErrors,
} from "@/lib/validation/siteSettings";

export type SiteSettingsState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: SiteSettingsErrors;
};

const SITE_BUCKET = "site-assets";
const MAX_ASSET_BYTES = 2 * 1024 * 1024;
const ASSET_TYPES = new Map([
  ["svg", "image/svg+xml"],
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["webp", "image/webp"],
  ["ico", "image/x-icon"],
]);

function assetMetadata(file: File): { extension: string; contentType: string } {
  const rawExtension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const fromType = [...ASSET_TYPES.entries()].find(([, contentType]) => contentType === file.type)?.[0] ?? "";
  const finalExtension = fromType || (ASSET_TYPES.has(rawExtension) ? rawExtension : "");
  const contentType = ASSET_TYPES.get(finalExtension);
  if (!finalExtension || !contentType) throw new Error("Asset must be SVG, PNG, JPG, WebP, or ICO");
  return { extension: finalExtension === "jpeg" ? "jpg" : finalExtension, contentType };
}

async function uploadAsset(file: File, prefix: string) {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_ASSET_BYTES) throw new Error("Asset must be under 2 MB");
  const { extension, contentType } = assetMetadata(file);
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const admin = getSupabaseAdmin();
  const { error } = await admin.storage.from(SITE_BUCKET).upload(path, file, { contentType, upsert: false });
  if (error) throw new Error(error.message);
  return admin.storage.from(SITE_BUCKET).getPublicUrl(path).data.publicUrl;
}

function readForm(formData: FormData) {
  return {
    logo_dark_url: formData.get("logo_dark_url") ?? "",
    logo_light_url: formData.get("logo_light_url") ?? "",
    favicon_url: formData.get("favicon_url") ?? "",
    footer_description: formData.get("footer_description") ?? "",
    footer_email: formData.get("footer_email") ?? "",
    footer_phone: formData.get("footer_phone") ?? "",
    footer_location: formData.get("footer_location") ?? "",
    social_links: {
      linkedin: formData.get("social_linkedin") ?? "",
      x: formData.get("social_x") ?? "",
      instagram: formData.get("social_instagram") ?? "",
      facebook: formData.get("social_facebook") ?? "",
      youtube: formData.get("social_youtube") ?? "",
      tiktok: formData.get("social_tiktok") ?? "",
    },
  };
}

export async function updateSiteSettingsAction(
  _prev: SiteSettingsState,
  formData: FormData,
): Promise<SiteSettingsState> {
  await requireRole(["admin", "editor"]);
  const parsed = siteSettingsSchema.safeParse(readForm(formData));
  if (!parsed.success) return formatSiteSettingsError(parsed.error);

  let { logo_dark_url, logo_light_url, favicon_url } = parsed.data;

  try {
    const darkLogo = formData.get("logo_dark_file") as File | null;
    const lightLogo = formData.get("logo_light_file") as File | null;
    const favicon = formData.get("favicon_file") as File | null;

    logo_dark_url = (darkLogo && darkLogo.size > 0 ? await uploadAsset(darkLogo, "logos") : null) ?? logo_dark_url;
    logo_light_url = (lightLogo && lightLogo.size > 0 ? await uploadAsset(lightLogo, "logos") : null) ?? logo_light_url;
    favicon_url = (favicon && favicon.size > 0 ? await uploadAsset(favicon, "favicon") : null) ?? favicon_url;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Asset upload failed" };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("site_settings").upsert({
    id: true,
    ...parsed.data,
    logo_dark_url,
    logo_light_url,
    favicon_url,
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  // Logo / footer / favicon live in the root layout — layout-scoped revalidation
  // busts the cached shell across every route that uses it.
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { ok: true };
}

// ─── Maintenance mode toggle ──────────────────────────────────────────────────

export async function saveMaintenanceMessageAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const message = (formData.get("maintenance_message") as string | null)?.trim() || null;

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("site_settings").upsert({
    id: true,
    maintenance_message: message,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
  redirect("/admin/settings");
}

export async function toggleMaintenanceModeAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const enable = formData.get("enable") === "true";
  const message = (formData.get("maintenance_message") as string | null)?.trim() || null;

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("site_settings").upsert({
    id: true,
    is_maintenance_mode: enable,
    maintenance_message: message,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);

  // Revalidate everything so the middleware cache reflects the change within
  // the next fetch cycle (module-level cache refreshes within ~30 s).
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  redirect("/admin/settings");
}
