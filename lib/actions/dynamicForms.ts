"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Database, FormFieldType, Json } from "@/types/database";
import { checkRateLimit } from "@/lib/security/rateLimit";

const FORM_BUCKET = "form-attachments";
const FILE_MAX_BYTES = 10 * 1024 * 1024;
const FILE_ALLOWED_TYPES = new Set<string>([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

function sanitizeExtension(name: string): string {
  const raw = name.split(".").pop()?.toLowerCase() ?? "";
  return raw.replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
}

type FormRow = Database["public"]["Tables"]["forms"]["Row"];
type FieldRow = Database["public"]["Tables"]["form_fields"]["Row"];

export type DynamicFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

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

function normalizeValue(field: FieldRow, formData: FormData) {
  if (field.type === "multiselect") return formData.getAll(field.field_key).map(String).filter(Boolean);
  if (field.type === "checkbox") return formData.getAll(field.field_key).map(String).filter(Boolean);
  if (field.type === "file") {
    const file = formData.get(field.field_key) as File | null;
    return file && file.size > 0 ? { name: file.name, size: file.size, type: file.type } : null;
  }
  const value = String(formData.get(field.field_key) ?? "").trim();
  return value.length > 0 ? value : null;
}

function validateField(field: FieldRow, value: Json | string[] | { name: string; size: number; type: string } | null) {
  if (field.is_required) {
    const empty =
      value == null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === "object" && !Array.isArray(value) && "name" in value && !value.name);
    if (empty) return `${field.label} is required`;
  }

  if (value == null || (Array.isArray(value) && value.length === 0)) return null;

  if (field.type === "email" && typeof value === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return `${field.label} must be a valid email`;
  }

  if (field.type === "url" && typeof value === "string") {
    try {
      const url = new URL(value);
      if (url.protocol !== "http:" && url.protocol !== "https:") return `${field.label} must be a valid URL`;
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

  if (
    field.type === "file" &&
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "size" in value &&
    "type" in value
  ) {
    const fileMeta = value as { name: string; size: number; type: string };
    if (fileMeta.size > FILE_MAX_BYTES) return `${field.label} must be under 10 MB`;
    if (fileMeta.type && !FILE_ALLOWED_TYPES.has(fileMeta.type)) {
      return `${field.label} must be a PDF, Word document, or image (PNG/JPG/WebP)`;
    }
  }

  return null;
}

function extractRespondent(fields: FieldRow[], answers: Record<string, Json>) {
  const emailField = fields.find((field) => field.type === "email") ?? fields.find((field) => field.field_key.includes("email"));
  const nameField = fields.find((field) => field.field_key.includes("name"));
  const respondent_email = emailField ? String(answers[emailField.field_key] ?? "").trim() || null : null;
  const respondent_name = nameField ? String(answers[nameField.field_key] ?? "").trim() || null : null;
  return { respondent_email, respondent_name };
}

export async function submitDynamicFormAction(
  _prev: DynamicFormState,
  formData: FormData,
): Promise<DynamicFormState> {
  const website = String(formData.get("website") ?? "").trim();
  if (website) return { status: "error", message: "Could not submit the form." };

  const formId = String(formData.get("form_id") ?? "").trim();
  if (!formId) return { status: "error", message: "Missing form id." };

  // Rate limit: max 5 dynamic-form submissions per visitor IP per minute,
  // scoped to the form id so spamming one form doesn't block other forms.
  const limit = await checkRateLimit({
    action: `form:${formId}`,
    max: 5,
    windowSeconds: 60,
  });
  if (!limit.ok) return { status: "error", message: limit.reason };

  const admin = getSupabaseAdmin();
  const [formResult, fieldsResult] = await Promise.all([
    admin
      .from("forms")
      .select("id, slug, name, purpose, description, submit_label, success_message, is_active, created_by, created_at, updated_at")
      .eq("id", formId)
      .maybeSingle(),
    admin
      .from("form_fields")
      .select("id, form_id, label, field_key, type, placeholder, help_text, options, is_required, sort_order, config, created_at")
      .eq("form_id", formId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (formResult.error || fieldsResult.error) {
    return { status: "error", message: "This form is unavailable right now." };
  }

  const form = formResult.data as FormRow | null;
  const fields = (fieldsResult.data ?? []) as FieldRow[];
  if (!form || !form.is_active) return { status: "error", message: "This form is not accepting responses." };

  const answers: Record<string, Json> = {};
  const fieldErrors: Record<string, string> = {};

  for (const field of fields) {
    const value = normalizeValue(field, formData);
    const error = validateField(field, value);
    if (error) fieldErrors[field.field_key] = error;
    if (value != null) answers[field.field_key] = value as Json;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors };
  }

  const respondent = extractRespondent(fields, answers);
  const { data: submission, error: submissionError } = await admin
    .from("form_submissions")
    .insert({
      form_id: form.id,
      ...respondent,
      related_type: form.purpose,
      related_id: null,
      metadata: { source: "public_form", slug: form.slug },
    })
    .select("id")
    .single();

  if (submissionError || !submission) {
    return { status: "error", message: "Could not save your response. Please try again." };
  }

  // Upload any file-field attachments now that we have a submission id to scope
  // the storage paths to. We've already validated MIME + size above; this only
  // needs to push the bytes and rewrite the corresponding answer with the
  // stored path so admins can later issue a signed URL.
  const fileFields = fields.filter((f) => f.type === "file");
  if (fileFields.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminAny = admin as any;
    for (const field of fileFields) {
      const file = formData.get(field.field_key) as File | null;
      if (!file || file.size === 0) continue;

      const ext = sanitizeExtension(file.name);
      const path = `${form.id}/${submission.id}/${field.field_key}-${Date.now()}.${ext}`;

      const { error: uploadError } = await adminAny.storage
        .from(FORM_BUCKET)
        .upload(path, file, {
          contentType: file.type || undefined,
          upsert: false,
        });

      if (uploadError) {
        // Roll back the submission so we don't leave an orphaned row with no
        // attachment when the upload fails partway through.
        await admin.from("form_submissions").delete().eq("id", submission.id);
        return {
          status: "error",
          message: `Could not upload ${file.name}: ${uploadError.message}`,
        };
      }

      answers[field.field_key] = {
        path,
        name: file.name,
        size: file.size,
        type: file.type,
      } as Json;
    }
  }

  const answerRows = fields.map((field) => ({
    submission_id: submission.id,
    field_id: field.id,
    field_key: field.field_key,
    value: answers[field.field_key] ?? null,
  }));

  if (answerRows.length > 0) {
    const { error: answersError } = await admin.from("form_answers").insert(answerRows);
    if (answersError) return { status: "error", message: "Could not save your answers. Please try again." };
  }

  return {
    status: "success",
    message: form.success_message || "Your response has been received.",
  };
}
