import { z } from "zod";
import type { ClientPartnerRole } from "@/types/database";

const asString = (value: unknown) => (value == null ? "" : value);

const requiredText = (label: string, max: number) =>
  z
    .preprocess(asString, z.string())
    .transform((value) => value.trim())
    .pipe(z.string().min(1, `${label} is required`).max(max, `${label} must be ${max} characters or fewer`));

const nullableText = (label: string, max: number) =>
  z
    .preprocess(asString, z.string())
    .transform((value) => value.trim())
    .pipe(z.string().max(max, `${label} must be ${max} characters or fewer`))
    .transform((value) => (value.length > 0 ? value : null));

const booleanFromForm = (value: unknown): boolean =>
  value === true || value === "on" || value === "true" || value === "1";

const intFromForm = (label: string, min: number, max: number) =>
  z
    .preprocess((value) => {
      const raw = String(value ?? "").trim();
      if (!raw) return 0;
      const number = Number(raw);
      return Number.isFinite(number) ? number : raw;
    }, z.union([z.string(), z.number()]))
    .transform((value, ctx) => {
      const number = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(number) || !Number.isInteger(number)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must be a whole number` });
        return z.NEVER;
      }
      if (number < min || number > max) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must be between ${min} and ${max}` });
        return z.NEVER;
      }
      return number;
    });

const roleFromForm = (value: unknown): ClientPartnerRole => {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return normalized === "anchor" ? "anchor" : "grid";
};

// ============================================================
// Client section (singleton)
// ============================================================
export const clientSectionSchema = z.object({
  eyebrow: requiredText("Eyebrow", 140),
  meta_accent: requiredText("Meta accent", 60),
  meta_value: requiredText("Meta value", 60),
  foot: requiredText("Foot caption", 280),
  nda_count: intFromForm("NDA count", 0, 9999),
  nda_label: requiredText("NDA label", 140),
});

export type ClientSectionInput = z.infer<typeof clientSectionSchema>;
export type ClientSectionFieldErrors = Partial<Record<keyof ClientSectionInput, string[]>>;

const SECTION_FIELD_LABELS: Record<keyof ClientSectionInput, string> = {
  eyebrow: "Eyebrow",
  meta_accent: "Meta accent",
  meta_value: "Meta value",
  foot: "Foot caption",
  nda_count: "NDA count",
  nda_label: "NDA label",
};

export function formatClientSectionError(error: z.ZodError): {
  error: string;
  fieldErrors: ClientSectionFieldErrors;
} {
  const fieldErrors: ClientSectionFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || !(field in SECTION_FIELD_LABELS)) continue;
    const key = field as keyof ClientSectionInput;
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  const firstIssue = error.issues[0];
  const firstField = typeof firstIssue?.path[0] === "string" ? (firstIssue.path[0] as keyof ClientSectionInput) : null;
  return {
    error: firstIssue?.message
      ? `${firstField ? `${SECTION_FIELD_LABELS[firstField]}: ` : ""}${firstIssue.message}`
      : "Please check the highlighted fields.",
    fieldErrors,
  };
}

// ============================================================
// Client partner (per-row CRUD)
// ============================================================
export const clientPartnerSchema = z.object({
  name: requiredText("Name", 140),
  caption: nullableText("Caption", 280),
  logo_url: requiredText("Logo URL", 2048),
  role: z.preprocess(roleFromForm, z.enum(["anchor", "grid"])),
  sort_order: intFromForm("Sort order", -10000, 10000),
  is_active: z.preprocess(booleanFromForm, z.boolean()),
});

export type ClientPartnerInput = z.infer<typeof clientPartnerSchema>;
export type ClientPartnerFieldErrors = Partial<Record<keyof ClientPartnerInput, string[]>>;

const PARTNER_FIELD_LABELS: Record<keyof ClientPartnerInput, string> = {
  name: "Name",
  caption: "Caption",
  logo_url: "Logo",
  role: "Role",
  sort_order: "Sort order",
  is_active: "Visibility",
};

export function formatClientPartnerError(error: z.ZodError): {
  error: string;
  fieldErrors: ClientPartnerFieldErrors;
} {
  const fieldErrors: ClientPartnerFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || !(field in PARTNER_FIELD_LABELS)) continue;
    const key = field as keyof ClientPartnerInput;
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  const firstIssue = error.issues[0];
  const firstField = typeof firstIssue?.path[0] === "string" ? (firstIssue.path[0] as keyof ClientPartnerInput) : null;
  return {
    error: firstIssue?.message
      ? `${firstField ? `${PARTNER_FIELD_LABELS[firstField]}: ` : ""}${firstIssue.message}`
      : "Please check the highlighted fields.",
    fieldErrors,
  };
}
