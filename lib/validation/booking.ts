import { z } from "zod";
import type { BookingStatus } from "@/types/database";

export const bookingStatuses = ["scheduled", "completed", "cancelled", "no_show"] as const satisfies readonly BookingStatus[];

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

const optionalPhone = z
  .preprocess(asString, z.string())
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .max(30, "Phone must be 30 characters or fewer")
      .regex(/^[+()\d\s.-]*$/, "Phone can only include numbers, spaces, +, -, ., and parentheses"),
  )
  .refine((value) => value.length === 0 || value.replace(/\D/g, "").length >= 7, {
    message: "Phone must include at least 7 digits",
  })
  .transform((value) => (value.length > 0 ? value : null));

const booleanFromForm = (value: unknown): boolean =>
  value === true || value === "on" || value === "true" || value === "1";

function isHttpUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const nullableUrl = (label: string, max: number) =>
  z
    .preprocess(asString, z.string())
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .max(max, `${label} must be ${max} characters or fewer`)
        .refine(isHttpUrl, `${label} must be a valid http(s) URL`),
    )
    .transform((value) => (value.length > 0 ? value : null));

const numberFromForm = (value: unknown) => {
  if (typeof value === "number") return value;
  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : NaN;
};

export const bookingSchema = z.object({
  slot_start: z.string().datetime("Choose an available time"),
  name: requiredText("Name", 140),
  email: z
    .preprocess(asString, z.string())
    .transform((value) => value.trim())
    .pipe(z.string().email("Enter a valid email").max(180, "Email must be 180 characters or fewer"))
    .transform((value) => value.toLowerCase()),
  phone: optionalPhone,
  topic: requiredText("Topic", 1400).pipe(z.string().min(10, "Topic must be at least 10 characters")),
  website: z.string().max(0).optional().or(z.literal("")),
});

export type BookingInput = z.infer<typeof bookingSchema>;
export type BookingFieldName = keyof BookingInput;
export type BookingFieldErrors = Partial<Record<BookingFieldName, string[]>>;

export const bookingDetailsSchema = z.object({
  meet_link: nullableUrl("Meet link", 500),
});

const BOOKING_LABELS: Record<BookingFieldName, string> = {
  slot_start: "Time",
  name: "Name",
  email: "Email",
  phone: "Phone",
  topic: "Topic",
  website: "Website",
};

export function formatBookingValidationError(error: z.ZodError): {
  error: string;
  fieldErrors: BookingFieldErrors;
} {
  const fieldErrors: BookingFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || !(field in BOOKING_LABELS)) continue;
    const key = field as BookingFieldName;
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }

  const firstIssue = error.issues[0];
  const firstField = typeof firstIssue?.path[0] === "string" ? BOOKING_LABELS[firstIssue.path[0] as BookingFieldName] : null;

  return {
    error: firstIssue?.message
      ? `${firstField ? `${firstField}: ` : ""}${firstIssue.message}`
      : "Please check the highlighted fields.",
    fieldErrors,
  };
}

export const availabilityRuleSchema = z
  .object({
    weekday: z.preprocess(numberFromForm, z.number().int().min(0).max(6)),
    start_time: z
      .preprocess(asString, z.string())
      .transform((value) => value.trim())
      .pipe(z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM")),
    end_time: z
      .preprocess(asString, z.string())
      .transform((value) => value.trim())
      .pipe(z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM")),
    slot_minutes: z.preprocess(numberFromForm, z.number().int().min(15).max(180)),
    buffer_minutes: z.preprocess(numberFromForm, z.number().int().min(0).max(120)),
    active: z.preprocess(booleanFromForm, z.boolean()),
  })
  .refine((value) => value.end_time > value.start_time, {
    path: ["end_time"],
    message: "End time must be after start time",
  });

export type AvailabilityRuleInput = z.infer<typeof availabilityRuleSchema>;
