import type { Json } from "@/types/database";

export type SocialPlatform = "facebook" | "instagram" | "tiktok" | "snapchat" | "x" | "linkedin" | "youtube";

export type SiteSocialLink = {
  platform: SocialPlatform;
  url: string;
};

export const socialPlatforms: SocialPlatform[] = [
  "facebook",
  "instagram",
  "tiktok",
  "snapchat",
  "x",
  "linkedin",
  "youtube",
];

export const socialPlatformLabels: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  snapchat: "Snapchat",
  x: "X",
  linkedin: "LinkedIn",
  youtube: "YouTube",
};

/**
 * Fallbacks, used only when site_settings carries nothing for a platform.
 *
 * Share-sheet tracking parameters (?igsh=, ?_t=, ?share_id=) are stripped on
 * purpose: they identify the person who copied the link, they expire, and they
 * add nothing to a public profile URL.
 *
 * YouTube is absent because SADEEM has no channel yet — a platform with no URL
 * here and none in the settings simply doesn't render an icon.
 */
export const defaultSocialUrls = {
  facebook: "https://www.facebook.com/sadeem.egy",
  instagram: "https://www.instagram.com/sadeem.egy",
  tiktok: "https://www.tiktok.com/@sadeem.egy",
  snapchat: "https://www.snapchat.com/add/sadeem.eg",
  x: "https://x.com/sadeemeg",
  linkedin: "https://www.linkedin.com/company/sadeemagyncy/",
} satisfies Partial<Record<SocialPlatform, string>>;

export const defaultSocialLinks: SiteSocialLink[] = socialPlatforms.flatMap((platform) => {
  const url = defaultSocialUrls[platform as keyof typeof defaultSocialUrls];
  return url ? [{ platform, url }] : [];
});

function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

/**
 * Settings first, constant second.
 *
 * This used to return the constant before it ever looked at site_settings,
 * which meant every social field in /admin/settings silently did nothing —
 * you could save a new Instagram URL and the footer would keep the old one.
 * Only YouTube appeared to work, and only because it had no constant to
 * shadow it. The constant is a fallback; the settings row is the truth.
 */
export function socialUrlForPlatform(value: Json | null | undefined, platform: SocialPlatform) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const configuredUrl = (value as Record<string, unknown>)[platform];
    if (isHttpUrl(configuredUrl)) return configuredUrl;
  }

  return defaultSocialUrls[platform as keyof typeof defaultSocialUrls] ?? "";
}

export function normalizeSocialLinks(value: Json | null | undefined): SiteSocialLink[] {
  return socialPlatforms.flatMap((platform) => {
    const url = socialUrlForPlatform(value, platform);
    return url ? [{ platform, url }] : [];
  });
}
