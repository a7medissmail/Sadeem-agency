"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  formatJobValidationError,
  jobSchema,
  slugifyJob,
  type JobFieldErrors,
} from "@/lib/validation/careers";

const RESUME_BUCKET = "application-resumes";

export type JobFormState = {
  error?: string;
  fieldErrors?: JobFieldErrors;
  ok?: boolean;
};

function readForm(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const slug = String(formData.get("slug") ?? "").trim() || slugifyJob(title);

  return {
    title,
    slug,
    type: formData.get("type") ?? "job",
    department: formData.get("department") ?? "",
    location: formData.get("location") ?? "",
    body: formData.get("body") ?? "",
    requirements: formData.get("requirements") ?? "",
    application_form_id: formData.get("application_form_id") ?? "",
    is_open: formData.get("is_open") || false,
  };
}

function databaseErrorMessage(message: string) {
  if (message.toLowerCase().includes("duplicate") || message.toLowerCase().includes("jobs_slug_key")) {
    return "A role with this slug already exists.";
  }
  return message;
}

export async function createJobAction(_prev: JobFormState, formData: FormData): Promise<JobFormState> {
  await requireRole(["admin", "editor"]);

  const parsed = jobSchema.safeParse(readForm(formData));
  if (!parsed.success) return formatJobValidationError(parsed.error);

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("jobs").insert(parsed.data);
  if (error) return { error: databaseErrorMessage(error.message) };

  revalidatePath("/admin/jobs");
  revalidatePath("/careers");
  redirect("/admin/jobs");
}

export async function updateJobAction(_prev: JobFormState, formData: FormData): Promise<JobFormState> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  if (!id) return { error: "Missing job id" };

  const parsed = jobSchema.safeParse(readForm(formData));
  if (!parsed.success) return formatJobValidationError(parsed.error);

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("jobs").update(parsed.data).eq("id", id);
  if (error) return { error: databaseErrorMessage(error.message) };

  revalidatePath("/admin/jobs");
  revalidatePath("/careers");
  revalidatePath(`/careers/${parsed.data.slug}`);
  redirect("/admin/jobs");
}

export async function toggleJobOpenAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  const next = formData.get("next") === "on";
  if (!id) throw new Error("Missing job id");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("jobs").update({ is_open: next }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/jobs");
  revalidatePath("/careers");
}

export async function deleteJobAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing job id");

  const admin = getSupabaseAdmin();
  const { data: applications } = await admin
    .from("applications")
    .select("resume_url")
    .eq("job_id", id);

  const { error } = await admin.from("jobs").delete().eq("id", id);
  if (error) throw new Error(error.message);

  const resumePaths = (applications ?? [])
    .map((application) => application.resume_url)
    .filter((path): path is string => typeof path === "string" && path.length > 0 && !/^https?:\/\//i.test(path));
  if (resumePaths.length > 0) {
    await admin.storage.from(RESUME_BUCKET).remove(resumePaths);
  }

  revalidatePath("/admin/jobs");
  revalidatePath("/admin/applications");
  revalidatePath("/careers");
}
