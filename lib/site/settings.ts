import "server-only";
import type { Json } from "@/types/database";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type SocialPlatform = "linkedin" | "x" | "instagram" | "facebook" | "youtube" | "tiktok";

export type SiteSocialLink = {
  platform: SocialPlatform;
  url: string;
};

export type PublicSiteSettings = {
  logoDarkUrl: string | null;
  logoLightUrl: string | null;
  faviconUrl: string | null;
  footerDescription: string;
  footerEmail: string;
  footerPhone: string | null;
  footerLocation: string | null;
  socialLinks: SiteSocialLink[];
};

export const defaultSiteSettings: PublicSiteSettings = {
  logoDarkUrl: null,
  logoLightUrl: null,
  faviconUrl: null,
  footerDescription: "Strategic growth advisory — helping ambitious companies achieve measurable results.",
  footerEmail: "hello@sadeem.agency",
  footerPhone: null,
  footerLocation: null,
  socialLinks: [],
};

export const socialPlatforms: SocialPlatform[] = ["linkedin", "x", "instagram", "facebook", "youtube", "tiktok"];

export function normalizeSocialLinks(value: Json | null | undefined): SiteSocialLink[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const links: SiteSocialLink[] = [];
  for (const platform of socialPlatforms) {
    const url = value[platform];
    if (typeof url === "string" && /^https?:\/\//i.test(url)) links.push({ platform, url });
  }
  return links;
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.from("site_settings").select("*").eq("id", true).maybeSingle();
    if (error || !data) return defaultSiteSettings;

    return {
      logoDarkUrl: data.logo_dark_url,
      logoLightUrl: data.logo_light_url,
      faviconUrl: data.favicon_url,
      footerDescription: data.footer_description || defaultSiteSettings.footerDescription,
      footerEmail: data.footer_email || defaultSiteSettings.footerEmail,
      footerPhone: data.footer_phone,
      footerLocation: data.footer_location,
      socialLinks: normalizeSocialLinks(data.social_links),
    };
  } catch {
    return defaultSiteSettings;
  }
}
