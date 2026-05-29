"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  formatFormDefinitionValidationError,
  formatFormFieldValidationError,
  formDefinitionSchema,
  formFieldSchema,
  parseFieldOptions,
  slugifyForm,
  type FormDefinitionFieldErrors,
  type FormFieldErrors,
} from "@/lib/validation/formBuilder";

export type FormBuilderState = {
  error?: string;
  fieldErrors?: FormDefinitionFieldErrors;
};

export type FormFieldState = {
  error?: string;
  fieldErrors?: FormFieldErrors;
};

function readDefinition(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const slug = String(formData.get("slug") ?? "").trim() || slugifyForm(name);
  return {
    name,
    slug,
    purpose: formData.get("purpose") ?? "generic",
    description: formData.get("description") ?? "",
    submit_label: formData.get("submit_label") ?? "Submit",
    success_message: formData.get("success_message") ?? "",
    is_active: formData.get("is_active") || false,
  };
}

function readField(formData: FormData) {
  return {
    label: formData.get("label") ?? "",
    field_key: formData.get("field_key") ?? "",
    type: formData.get("type") ?? "text",
    placeholder: formData.get("placeholder") ?? "",
    help_text: formData.get("help_text") ?? "",
    options_text: formData.get("options_text") ?? "",
    is_required: formData.get("is_required") || false,
    sort_order: formData.get("sort_order") ?? "",
  };
}

function formDatabaseError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("forms") || lower.includes("form_fields")) {
    if (lower.includes("duplicate") || lower.includes("unique")) return "That slug or field key is already used.";
    if (lower.includes("does not exist")) {
      return "Form Builder tables are not available yet. Run supabase/migrations/0014_form_builder_foundation.sql, then try again.";
    }
  }
  return message;
}

export async function createFormAction(_prev: FormBuilderState, formData: FormData): Promise<FormBuilderState> {
  const profile = await requireRole(["admin", "editor"]);
  const parsed = formDefinitionSchema.safeParse(readDefinition(formData));
  if (!parsed.success) return formatFormDefinitionValidationError(parsed.error);

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("forms")
    .insert({ ...parsed.data, created_by: profile.id })
    .select("id")
    .single();

  if (error) return { error: formDatabaseError(error.message) };
  revalidatePath("/admin/forms");
  redirect(`/admin/forms/${data.id}`);
}

export async function updateFormAction(_prev: FormBuilderState, formData: FormData): Promise<FormBuilderState> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  if (!id) return { error: "Missing form id" };

  const parsed = formDefinitionSchema.safeParse(readDefinition(formData));
  if (!parsed.success) return formatFormDefinitionValidationError(parsed.error);

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("forms").update(parsed.data).eq("id", id);
  if (error) return { error: formDatabaseError(error.message) };

  revalidatePath("/admin/forms");
  revalidatePath(`/admin/forms/${id}`);
  return {};
}

export async function addFieldAction(_prev: FormFieldState, formData: FormData): Promise<FormFieldState> {
  await requireRole(["admin", "editor"]);
  const form_id = formData.get("form_id") as string;
  if (!form_id) return { error: "Missing form id" };

  const parsed = formFieldSchema.safeParse(readField(formData));
  if (!parsed.success) return formatFormFieldValidationError(parsed.error);

  const { options_text, ...field } = parsed.data;
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("form_fields").insert({
    ...field,
    form_id,
    options: parseFieldOptions(options_text),
    config: {},
  });
  if (error) return { error: formDatabaseError(error.message) };

  revalidatePath(`/admin/forms/${form_id}`);
  return {};
}

export async function updateFieldAction(_prev: FormFieldState, formData: FormData): Promise<FormFieldState> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  const form_id = formData.get("form_id") as string;
  if (!id || !form_id) return { error: "Missing field id" };

  const parsed = formFieldSchema.safeParse(readField(formData));
  if (!parsed.success) return formatFormFieldValidationError(parsed.error);

  const { options_text, ...field } = parsed.data;
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("form_fields")
    .update({ ...field, options: parseFieldOptions(options_text) })
    .eq("id", id);
  if (error) return { error: formDatabaseError(error.message) };

  revalidatePath(`/admin/forms/${form_id}`);
  return {};
}

export async function deleteFieldAction(formData: FormData): Promise<void> {
  const profile = await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  const form_id = formData.get("form_id") as string;
  if (!id || !form_id) throw new Error("Missing field id");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("form_fields").delete().eq("id", id);
  if (error) throw new Error(formDatabaseError(error.message));
  await logAudit({ tableName: "form_fields", recordId: id, action: "delete", actorId: profile.id, actorName: profile.full_name ?? profile.email ?? null });
  revalidatePath(`/admin/forms/${form_id}`);
}

export async function deleteFormAction(formData: FormData): Promise<void> {
  const profile = await requireRole(["admin"]);
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing form id");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("forms").delete().eq("id", id);
  if (error) throw new Error(formDatabaseError(error.message));
  await logAudit({ tableName: "forms", recordId: id, action: "delete", actorId: profile.id, actorName: profile.full_name ?? profile.email ?? null });
  revalidatePath("/admin/forms");
}

// ─── Field reorder ────────────────────────────────────────────────────────────

export async function reorderFieldsAction(
  formId: string,
  updates: { id: string; sort_order: number }[],
): Promise<void> {
  await requireRole(["admin", "editor"]);
  const admin = getSupabaseAdmin();
  await Promise.all(
    updates.map(({ id, sort_order }) =>
      admin.from("form_fields").update({ sort_order }).eq("id", id).eq("form_id", formId),
    ),
  );
  revalidatePath(`/admin/forms/${formId}`);
}

// ─── Submission status ────────────────────────────────────────────────────────

export async function updateSubmissionStatusAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  const form_id = formData.get("form_id") as string;
  const status = formData.get("status") as import("@/types/database").FormSubmissionStatus;
  if (!id || !status) throw new Error("Missing id or status");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("form_submissions").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  if (form_id) revalidatePath(`/admin/forms/${form_id}/submissions`);
}
