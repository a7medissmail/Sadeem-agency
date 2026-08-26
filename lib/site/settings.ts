import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { defaultSocialLinks, normalizeSocialLinks } from "./social";
import type { SiteSocialLink } from "./social";

export type { SiteSocialLink, SocialPlatform } from "./social";
export { defaultSocialLinks, defaultSocialUrls, normalizeSocialLinks, socialPlatformLabels, socialPlatforms } from "./social";

export type PublicSiteSettings = {
  logoDarkUrl: string | null;
  logoLightUrl: string | null;
  faviconUrl: string | null;
  footerDescription: string;
  footerEmail: string;
  footerPhone: string | null;
  footerWhatsapp: string | null;
  footerLocation: string | null;
  footerLocationSecondary: string | null;
  socialLinks: SiteSocialLink[];
};

export const defaultSiteSettings: PublicSiteSettings = {
  logoDarkUrl: null,
  logoLightUrl: null,
  faviconUrl: null,
  footerDescription: "Strategic growth advisory - helping ambitious companies achieve measurable results.",
  footerEmail: "hello@sadeem.agency",
  footerPhone: null,
  footerWhatsapp: null,
  footerLocation: null,
  footerLocationSecondary: null,
  socialLinks: defaultSocialLinks,
};

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
      footerWhatsapp: data.footer_whatsapp,
      footerLocation: data.footer_location,
      footerLocationSecondary: data.footer_location_secondary,
      socialLinks: normalizeSocialLinks(data.social_links),
    };
  } catch {
    return defaultSiteSettings;
  }
}
