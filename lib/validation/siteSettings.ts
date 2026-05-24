import { z } from "zod";
import type { SocialPlatform } from "@/lib/site/settings";

const asString = (value: unknown) => (value == null ? "" : value);

const nullableText = (label: string, max: number) =>
  z
    .preprocess(asString, z.string())
    .transform((value) => value.trim())
    .pipe(z.string().max(max, `${label} must be ${max} characters or fewer`))
    .transform((value) => (value.length ? value : null));

const nullableUrl = (label: string) =>
  z
    .preprocess(asString, z.string())
    .transform((value) => value.trim())
    .pipe(z.string().url(`${label} must be a valid URL`).or(z.literal("")))
    .transform((value) => (value.length ? value : null));

export const socialPlatformLabels: Record<SocialPlatform, string> = {
  linkedin: "LinkedIn",
  x: "X",
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  tiktok: "TikTok",
};

export const siteSettingsSchema = z.object({
  logo_dark_url: nullableUrl("Dark logo URL"),
  logo_light_url: nullableUrl("Light logo URL"),
  favicon_url: nullableUrl("Favicon URL"),
  footer_description: z
    .preprocess(asString, z.string())
    .transform((value) => value.trim())
    .pipe(z.string().min(10, "Footer description is required").max(220, "Footer description is too long")),
  footer_email: z
    .preprocess(asString, z.string())
    .transform((value) => value.trim())
    .pipe(z.string().email("Footer email must be valid").max(180, "Footer email is too long")),
  footer_phone: nullableText("Footer phone", 80),
  footer_location: nullableText("Footer location", 140),
  social_links: z.object({
    linkedin: nullableUrl("LinkedIn"),
    x: nullableUrl("X"),
    instagram: nullableUrl("Instagram"),
    facebook: nullableUrl("Facebook"),
    youtube: nullableUrl("YouTube"),
    tiktok: nullableUrl("TikTok"),
  }),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
export type SiteSettingsErrors = Partial<Record<string, string[]>>;

export function formatSiteSettingsError(error: z.ZodError) {
  const fieldErrors: SiteSettingsErrors = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    fieldErrors[path] = [...(fieldErrors[path] ?? []), issue.message];
  }
  return { error: error.issues[0]?.message ?? "Invalid settings", fieldErrors };
}
