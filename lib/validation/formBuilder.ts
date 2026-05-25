import { z } from "zod";
import type { FormFieldType, FormPurpose } from "@/types/database";

const asString = (value: unknown) => (value == null ? "" : value);

export const formPurposes: FormPurpose[] = ["lead", "application", "consultation", "proposal", "generic"];
export const formFieldTypes: FormFieldType[] = [
  "text",
  "textarea",
  "email",
  "phone",
  "url",
  "select",
  "multiselect",
  "checkbox",
  "file",
  "date",
];

export const optionFieldTypes: FormFieldType[] = ["select", "multiselect", "checkbox"];

const requiredText = (label: string, max: number) =>
  z
    .preprocess(asString, z.string())
    .transform((value) => value.trim())
    .pipe(z.string().min(2, `${label} is required`).max(max, `${label} must be ${max} characters or fewer`));

const nullableText = (label: string, max: number) =>
  z
    .preprocess(asString, z.string())
    .transform((value) => value.trim())
    .pipe(z.string().max(max, `${label} must be ${max} characters or fewer`))
    .transform((value) => (value.length > 0 ? value : null));

const nullableInteger = (label: string, min: number, max: number) =>
  z
    .preprocess(asString, z.union([z.string(), z.number()]))
    .transform((value, ctx) => {
      if (typeof value === "string" && value.trim() === "") return 0;
      const number = typeof value === "number" ? value : Number(value);
      if (!Number.isInteger(number)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must be a whole number` });
        return z.NEVER;
      }
      if (number < min || number > max) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must be between ${min} and ${max}` });
        return z.NEVER;
      }
      return number;
    });

const booleanFromForm = (value: unknown): boolean =>
  value === true || value === "on" || value === "true" || value === "1";

export function slugifyForm(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function fieldKey(value: string): string {
  return slugifyForm(value).replace(/-/g, "_").slice(0, 60);
}

export const formDefinitionSchema = z.object({
  name: requiredText("Name", 140),
  slug: requiredText("Slug", 90).refine(
    (value) => /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value),
    "Slug must use lowercase letters, numbers, and dashes only",
  ),
  purpose: z.enum(["lead", "application", "consultation", "proposal", "generic"]),
  description: nullableText("Description", 600),
  submit_label: requiredText("Submit label", 80),
  success_message: nullableText("Success message", 400),
  is_active: z.preprocess(booleanFromForm, z.boolean()),
});

export const formFieldSchema = z
  .object({
    label: requiredText("Field label", 120),
    field_key: requiredText("Field key", 70).transform(fieldKey).refine(
      (value) => /^[a-z][a-z0-9_]*$/.test(value),
      "Field key must start with a letter and use letters, numbers, or underscores",
    ),
    type: z.enum(["text", "textarea", "email", "phone", "url", "select", "multiselect", "checkbox", "file", "date"]),
    placeholder: nullableText("Placeholder", 160),
    help_text: nullableText("Help text", 240),
    options_text: nullableText("Options", 1200),
    is_required: z.preprocess(booleanFromForm, z.boolean()),
    sort_order: nullableInteger("Sort order", -1000, 1000),
  })
  .superRefine((value, ctx) => {
    if (!optionFieldTypes.includes(value.type) || value.options_text) return;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["options_text"],
      message: "Options are required for select, multi-select, and checkbox fields",
    });
  });

export type FormDefinitionInput = z.infer<typeof formDefinitionSchema>;
export type FormFieldInput = z.infer<typeof formFieldSchema>;

export type FormDefinitionFieldErrors = Partial<Record<keyof FormDefinitionInput, string[]>>;
export type FormFieldErrors = Partial<Record<keyof FormFieldInput, string[]>>;

export function parseFieldOptions(optionsText: string | null) {
  if (!optionsText) return [];
  return optionsText
    .split(/\r?\n|,/)
    .map((option) => option.trim())
    .filter(Boolean)
    .slice(0, 40)
    .map((label) => ({ label, value: fieldKey(label) }));
}

export function optionsToText(options: unknown) {
  if (!Array.isArray(options)) return "";
  return options
    .map((option) => {
      if (!option || typeof option !== "object") return "";
      const label = "label" in option ? String(option.label ?? "") : "";
      return label.trim();
    })
    .filter(Boolean)
    .join("\n");
}

function formatIssues<T extends Record<string, unknown>>(
  error: z.ZodError,
  labels: Record<string, string>,
): { error: string; fieldErrors: Partial<Record<keyof T, string[]>> } {
  const fieldErrors: Partial<Record<keyof T, string[]>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || !(field in labels)) continue;
    const key = field as keyof T;
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }

  const firstIssue = error.issues[0];
  const firstField = typeof firstIssue?.path[0] === "string" ? labels[firstIssue.path[0]] : null;
  return {
    error: firstIssue?.message ? `${firstField ? `${firstField}: ` : ""}${firstIssue.message}` : "Please check the highlighted fields.",
    fieldErrors,
  };
}

export function formatFormDefinitionValidationError(error: z.ZodError) {
  return formatIssues<FormDefinitionInput>(error, {
    name: "Name",
    slug: "Slug",
    purpose: "Purpose",
    description: "Description",
    submit_label: "Submit label",
    success_message: "Success message",
    is_active: "Active",
  });
}

export function formatFormFieldValidationError(error: z.ZodError) {
  return formatIssues<FormFieldInput>(error, {
    label: "Field label",
    field_key: "Field key",
    type: "Type",
    placeholder: "Placeholder",
    help_text: "Help text",
    options_text: "Options",
    is_required: "Required",
    sort_order: "Sort order",
  });
}
