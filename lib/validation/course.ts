import { z } from "zod";

// Convert "Sales Ops Workshop — Riyadh" -> "sales-ops-workshop-riyadh"
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const optionalString = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v && v.length > 0 ? v : null));

const optionalNumber = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === "" || v === null) return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  });

const optionalIsoDate = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((v) => {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  });

export const courseSchema = z.object({
  title: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "lowercase letters, numbers and dashes only"),
  summary: optionalString,
  body: optionalString,
  location: optionalString,
  starts_at: optionalIsoDate,
  ends_at: optionalIsoDate,
  capacity: optionalNumber,
  price: optionalNumber,
  image_url: optionalString,
  is_active: z
    .union([z.boolean(), z.literal("on"), z.literal("true"), z.literal("false")])
    .transform((v) => v === true || v === "on" || v === "true"),
});

export type CourseInput = z.infer<typeof courseSchema>;
