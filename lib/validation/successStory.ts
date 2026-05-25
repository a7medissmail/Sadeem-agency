import { z } from "zod";
import { slugify } from "./course";

const asString = (value: unknown) => (value == null ? "" : value);

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

const nullableUrl = nullableText("Image URL", 2048).refine(
  (value) => value === null || /^https?:\/\//i.test(value) || value.startsWith("/"),
  "Image URL must be a valid URL",
);

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

export { slugify };

export const successStorySchema = z.object({
  title: requiredText("Title", 180),
  slug: requiredText("Slug", 90).refine(
    (value) => /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value),
    "Slug must use lowercase letters, numbers, and dashes only",
  ),
  client_name: nullableText("Client name", 140),
  industry: nullableText("Industry", 100),
  summary: nullableText("Summary", 320),
  challenge: nullableText("Challenge", 900),
  solution: nullableText("Solution", 900),
  results: nullableText("Results", 900),
  body: nullableText("Body", 14000),
  image_url: nullableUrl,
  metric_value: nullableText("Metric value", 40),
  metric_label: nullableText("Metric label", 100),
  sort_order: nullableInteger("Sort order", -1000, 1000),
  is_published: z.preprocess(booleanFromForm, z.boolean()),
});

export type SuccessStoryInput = z.infer<typeof successStorySchema>;
export type SuccessStoryFieldErrors = Partial<Record<keyof SuccessStoryInput, string[]>>;

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  slug: "Slug",
  client_name: "Client",
  industry: "Industry",
  summary: "Summary",
  challenge: "Challenge",
  solution: "Solution",
  results: "Results",
  body: "Body",
  image_url: "Image",
  metric_value: "Metric",
  metric_label: "Metric label",
  sort_order: "Sort order",
  is_published: "Publish setting",
};

export function formatSuccessStoryValidationError(error: z.ZodError): {
  error: string;
  fieldErrors: SuccessStoryFieldErrors;
} {
  const fieldErrors: SuccessStoryFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || !(field in FIELD_LABELS)) continue;
    const key = field as keyof SuccessStoryInput;
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }

  const firstIssue = error.issues[0];
  const firstField = typeof firstIssue?.path[0] === "string" ? FIELD_LABELS[firstIssue.path[0]] : null;
  const detail = firstIssue?.message;

  return {
    error: detail ? `${firstField ? `${firstField}: ` : ""}${detail}` : "Please check the highlighted fields.",
    fieldErrors,
  };
}
