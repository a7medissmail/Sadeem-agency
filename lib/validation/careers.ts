import { z } from "zod";
import type { ApplicationStatus, JobType } from "@/types/database";

export const jobTypes = ["job", "internship"] as const satisfies readonly JobType[];
export const applicationStatuses = ["new", "review", "interview", "offer", "rejected"] as const satisfies readonly ApplicationStatus[];

export function slugifyJob(input: string): string {
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

const booleanFromForm = (value: unknown): boolean =>
  value === true || value === "on" || value === "true" || value === "1";

const jobTypeFromForm = (value: unknown): JobType => {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return jobTypes.includes(normalized as JobType) ? (normalized as JobType) : "job";
};

const nullableUuid = (label: string) =>
  z
    .preprocess(asString, z.string())
    .transform((value) => value.trim())
    .pipe(z.string().uuid(`${label} is invalid`).or(z.literal("")))
    .transform((value) => (value ? value : null));

export const jobSchema = z.object({
  title: requiredText("Title", 160),
  slug: requiredText("Slug", 80).refine(
    (value) => /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value),
    "Slug must use lowercase letters, numbers, and dashes only",
  ),
  type: z.preprocess(jobTypeFromForm, z.enum(jobTypes)),
  department: nullableText("Department", 140),
  location: nullableText("Location", 180),
  body: nullableText("Body", 20000),
  requirements: nullableText("Requirements", 12000),
  application_form_id: nullableUuid("Application form"),
  is_open: z.preprocess(booleanFromForm, z.boolean()),
});

export type JobInput = z.infer<typeof jobSchema>;
export type JobFieldErrors = Partial<Record<keyof JobInput, string[]>>;

const JOB_FIELD_LABELS: Record<keyof JobInput, string> = {
  title: "Title",
  slug: "Slug",
  type: "Type",
  department: "Department",
  location: "Location",
  body: "Body",
  requirements: "Requirements",
  application_form_id: "Application form",
  is_open: "Open setting",
};

export function formatJobValidationError(error: z.ZodError): {
  error: string;
  fieldErrors: JobFieldErrors;
} {
  const fieldErrors: JobFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || !(field in JOB_FIELD_LABELS)) continue;
    const key = field as keyof JobInput;
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }

  const firstIssue = error.issues[0];
  const firstField = typeof firstIssue?.path[0] === "string" ? JOB_FIELD_LABELS[firstIssue.path[0] as keyof JobInput] : null;

  return {
    error: firstIssue?.message
      ? `${firstField ? `${firstField}: ` : ""}${firstIssue.message}`
      : "Please check the highlighted fields.",
    fieldErrors,
  };
}

export const applicationSchema = z.object({
  job_id: z.string().uuid("Invalid job"),
  name: requiredText("Name", 140),
  email: z
    .preprocess(asString, z.string())
    .transform((value) => value.trim())
    .pipe(z.string().email("Enter a valid email").max(180, "Email must be 180 characters or fewer")),
  phone: nullableText("Phone", 50),
  cover_note: nullableText("Cover note", 2500),
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
export type ApplicationFieldName = keyof ApplicationInput | "resume";
export type ApplicationFieldErrors = Partial<Record<ApplicationFieldName, string[]>>;

const APPLICATION_FIELD_LABELS: Record<ApplicationFieldName, string> = {
  job_id: "Job",
  name: "Name",
  email: "Email",
  phone: "Phone",
  cover_note: "Cover note",
  website: "Website",
  resume: "Resume",
};

export function formatApplicationValidationError(error: z.ZodError): {
  error: string;
  fieldErrors: ApplicationFieldErrors;
} {
  const fieldErrors: ApplicationFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || !(field in APPLICATION_FIELD_LABELS)) continue;
    const key = field as ApplicationFieldName;
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }

  const firstIssue = error.issues[0];
  const firstField =
    typeof firstIssue?.path[0] === "string" ? APPLICATION_FIELD_LABELS[firstIssue.path[0] as ApplicationFieldName] : null;

  return {
    error: firstIssue?.message
      ? `${firstField ? `${firstField}: ` : ""}${firstIssue.message}`
      : "Please check the highlighted fields.",
    fieldErrors,
  };
}
