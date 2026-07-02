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

export const defaultSocialUrls = {
  facebook: "https://www.facebook.com/share/1P7UyHXhyr/",
  instagram: "https://www.instagram.com/sadeem.egy/",
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

export function socialUrlForPlatform(value: Json | null | undefined, platform: SocialPlatform) {
  const defaultUrl = defaultSocialUrls[platform as keyof typeof defaultSocialUrls];
  if (defaultUrl) return defaultUrl;

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const configuredUrl = (value as Record<string, unknown>)[platform];
    if (isHttpUrl(configuredUrl)) return configuredUrl;
  }

  return "";
}

export function normalizeSocialLinks(value: Json | null | undefined): SiteSocialLink[] {
  return socialPlatforms.flatMap((platform) => {
    const url = socialUrlForPlatform(value, platform);
    return url ? [{ platform, url }] : [];
  });
}
