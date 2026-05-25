"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { applicationConfirmation, applicationNotification, getEmailBranding } from "@/lib/email/templates";
import type { Database, Json } from "@/types/database";
import {
  applicationSchema,
  formatApplicationValidationError,
} from "@/lib/validation/careers";
import { checkRateLimit } from "@/lib/security/rateLimit";

type CustomFieldRow = Pick<
  Database["public"]["Tables"]["form_fields"]["Row"],
  "id" | "label" | "field_key" | "type" | "options" | "is_required"
>;

export type SubmitApplicationState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> }
  | { status: "success" };

const RESUME_BUCKET = "application-resumes";
const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const RESUME_TYPES = new Map([
  ["pdf", "application/pdf"],
  ["doc", "application/msword"],
  ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
]);

function resumeMetadata(file: File): { extension: string; contentType: string } {
  const rawExtension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const extension = RESUME_TYPES.has(rawExtension) ? rawExtension : "";
  const typeExtension = [...RESUME_TYPES.entries()].find(([, contentType]) => contentType === file.type)?.[0] ?? "";

  if (file.type && !typeExtension) throw new Error("Resume must be PDF, DOC, or DOCX");

  const finalExtension = typeExtension || extension;
  const contentType = RESUME_TYPES.get(finalExtension);
  if (!finalExtension || !contentType) throw new Error("Resume must be PDF, DOC, or DOCX");

  return { extension: finalExtension, contentType };
}

async function uploadResume(file: File, jobId: string): Promise<string> {
  if (!file || file.size === 0) throw new Error("Resume is required");
  if (file.size > MAX_RESUME_BYTES) throw new Error("Resume must be under 5 MB");

  const { extension, contentType } = resumeMetadata(file);
  const safeName = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const path = `${jobId}/${Date.now()}-${safeName || "resume"}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const admin = getSupabaseAdmin();
  const { error } = await admin.storage.from(RESUME_BUCKET).upload(path, file, { contentType, upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

function databaseErrorMessage(message: string) {
  if (message.toLowerCase().includes("bucket") || message.toLowerCase().includes("application-resumes")) {
    return "Resume storage is not available yet. Run supabase/migrations/0007_application_resumes.sql, then try again.";
  }
  return message;
}

function optionValues(options: Json) {
  if (!Array.isArray(options)) return new Set<string>();
  return new Set(
    options
      .map((option) => {
        if (!option || typeof option !== "object" || Array.isArray(option) || !("value" in option)) return "";
        return String(option.value ?? "");
      })
      .filter(Boolean),
  );
}

function customInputName(field: CustomFieldRow) {
  return `custom__${field.field_key}`;
}

function normalizeCustomValue(field: CustomFieldRow, formData: FormData): Json {
  const name = customInputName(field);
  if (field.type === "multiselect" || field.type === "checkbox") {
    return formData.getAll(name).map(String).map((value) => value.trim()).filter(Boolean);
  }
  if (field.type === "file") return null;
  const value = String(formData.get(name) ?? "").trim();
  return value ? value : null;
}

function validateCustomField(field: CustomFieldRow, value: Json): string | null {
  const empty = value == null || value === "" || (Array.isArray(value) && value.length === 0);
  if (field.type === "file") {
    return field.is_required ? `${field.label} cannot be collected on job applications yet` : null;
  }
  if (field.is_required && empty) return `${field.label} is required`;
  if (empty) return null;

  if (typeof value === "string" && value.length > 2500) return `${field.label} is too long`;
  if (field.type === "email" && typeof value === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return `${field.label} must be a valid email`;
  }
  if (field.type === "url" && typeof value === "string") {
    try {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol)) return `${field.label} must be a valid URL`;
    } catch {
      return `${field.label} must be a valid URL`;
    }
  }
  if (field.type === "select" && typeof value === "string") {
    const allowed = optionValues(field.options);
    if (allowed.size > 0 && !allowed.has(value)) return `${field.label} has an invalid option`;
  }
  if ((field.type === "multiselect" || field.type === "checkbox") && Array.isArray(value)) {
    const allowed = optionValues(field.options);
    if (allowed.size > 0 && value.some((entry) => !allowed.has(String(entry)))) return `${field.label} has an invalid option`;
  }
  return null;
}

export async function submitApplicationAction(
  _prev: SubmitApplicationState,
  formData: FormData,
): Promise<SubmitApplicationState> {
  if ((formData.get("website") as string)?.length) return { status: "success" };

  // Rate limit: max 3 applications per visitor IP per 5 minutes (uploads are expensive).
  const limit = await checkRateLimit({ action: "application", max: 3, windowSeconds: 300 });
  if (!limit.ok) return { status: "error", message: limit.reason };

  const parsed = applicationSchema.safeParse({
    job_id: formData.get("job_id"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    cover_note: formData.get("cover_note") ?? "",
    website: (formData.get("website") as string) ?? "",
  });
  if (!parsed.success) {
    const formatted = formatApplicationValidationError(parsed.error);
    return { status: "error", message: formatted.error, fieldErrors: formatted.fieldErrors };
  }

  const admin = getSupabaseAdmin();
  const { data: job, error: jobError } = await admin
    .from("jobs")
    .select("id, title, slug, is_open, application_form_id")
    .eq("id", parsed.data.job_id)
    .single();

  if (jobError || !job || !job.is_open) {
    return { status: "error", message: "This role is not currently accepting applications." };
  }

  let customAnswers: Json = {};
  if (job.application_form_id) {
    const { data: form } = await admin
      .from("forms")
      .select("id, is_active")
      .eq("id", job.application_form_id)
      .eq("is_active", true)
      .maybeSingle();

    if (form) {
      const { data: fields, error: fieldsError } = await admin
        .from("form_fields")
        .select("id, label, field_key, type, options, is_required")
        .eq("form_id", form.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (fieldsError) return { status: "error", message: "Could not validate the application questions." };

      const answers: Record<string, Json> = {};
      const fieldErrors: Record<string, string[]> = {};
      for (const field of (fields ?? []) as CustomFieldRow[]) {
        const value = normalizeCustomValue(field, formData);
        const error = validateCustomField(field, value);
        if (error) fieldErrors[customInputName(field)] = [error];
        if (value != null && !(Array.isArray(value) && value.length === 0)) {
          answers[field.field_key] = {
            label: field.label,
            type: field.type,
            value,
          };
        }
      }

      if (Object.keys(fieldErrors).length > 0) {
        return { status: "error", message: "Please check the highlighted fields.", fieldErrors };
      }

      customAnswers = answers;
    }
  }

  let resumePath: string;
  try {
    const file = formData.get("resume");
    if (!(file instanceof File)) throw new Error("Resume is required");
    resumePath = await uploadResume(file, parsed.data.job_id);
  } catch (err) {
    const message = err instanceof Error ? databaseErrorMessage(err.message) : "Resume upload failed";
    return { status: "error", message, fieldErrors: { resume: [message] } };
  }

  const { name, email, phone, cover_note } = parsed.data;
  const { error } = await admin.from("applications").insert({
    job_id: parsed.data.job_id,
    name,
    email,
    phone,
    cover_note,
    resume_url: resumePath,
    custom_answers: customAnswers,
  });
  if (error) {
    await admin.storage.from(RESUME_BUCKET).remove([resumePath]);
    return { status: "error", message: databaseErrorMessage(error.message) };
  }

  const team = process.env.TEAM_NOTIFY_TO;
  const brand = await getEmailBranding();
  const confirmation = applicationConfirmation({ name, jobTitle: job.title, brand });
  const notification = applicationNotification({ name, email, phone, jobTitle: job.title, coverNote: cover_note, brand });

  await Promise.allSettled([
    sendEmail({ to: email, subject: confirmation.subject, html: confirmation.html, replyTo: team }),
    team
      ? sendEmail({ to: team, subject: notification.subject, html: notification.html, replyTo: email })
      : Promise.resolve(),
  ]);

  revalidatePath("/admin/applications");
  revalidatePath(`/careers/${job.slug}`);
  return { status: "success" };
}
