import { z } from "zod";

// Convert "Sales Ops Workshop - Riyadh" into "sales-ops-workshop-riyadh".
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

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

const nullableDateTime = (label: string) =>
  z
    .preprocess(asString, z.string())
    .transform((value, ctx) => {
      const trimmed = value.trim();
      if (!trimmed) return null;

      const date = new Date(trimmed);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} must be a valid date and time`,
        });
        return z.NEVER;
      }

      return date.toISOString();
    });

const nullableNumber = (
  label: string,
  options: { integer?: boolean; min?: number; max?: number } = {},
) =>
  z
    .preprocess(asString, z.union([z.string(), z.number()]))
    .transform((value, ctx) => {
      if (typeof value === "string" && value.trim() === "") return null;

      const number = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(number)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must be a number` });
        return z.NEVER;
      }
      if (options.integer && !Number.isInteger(number)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must be a whole number` });
        return z.NEVER;
      }
      if (options.min !== undefined && number < options.min) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must be at least ${options.min}` });
        return z.NEVER;
      }
      if (options.max !== undefined && number > options.max) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must be ${options.max} or lower` });
        return z.NEVER;
      }

      return number;
    });

const booleanFromForm = (value: unknown): boolean =>
  value === true || value === "on" || value === "true" || value === "1";

export const courseSchema = z
  .object({
    title: requiredText("Title", 160),
    slug: requiredText("Slug", 80).refine(
      (value) => /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value),
      "Slug must use lowercase letters, numbers, and dashes only",
    ),
    summary: nullableText("Summary", 280),
    body: nullableText("Body", 12000),
    location: nullableText("Location", 180),
    starts_at: nullableDateTime("Starts"),
    ends_at: nullableDateTime("Ends"),
    capacity: nullableNumber("Capacity", { integer: true, min: 1, max: 100000 }),
    price: nullableNumber("Price", { min: 0, max: 10000000 }),
    image_url: nullableUrl,
    is_active: z.preprocess(booleanFromForm, z.boolean()),
  })
  .superRefine((course, ctx) => {
    if (course.starts_at && course.ends_at && new Date(course.ends_at) <= new Date(course.starts_at)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ends_at"],
        message: "Ends must be after Starts",
      });
    }
  });

export type CourseInput = z.infer<typeof courseSchema>;
export type CourseFieldErrors = Partial<Record<keyof CourseInput, string[]>>;

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  slug: "Slug",
  summary: "Summary",
  body: "Body",
  location: "Location",
  starts_at: "Starts",
  ends_at: "Ends",
  capacity: "Capacity",
  price: "Price",
  image_url: "Image",
  is_active: "Publish setting",
};

export function formatCourseValidationError(error: z.ZodError): {
  error: string;
  fieldErrors: CourseFieldErrors;
} {
  const fieldErrors: CourseFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || !(field in FIELD_LABELS)) continue;
    const key = field as keyof CourseInput;
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
