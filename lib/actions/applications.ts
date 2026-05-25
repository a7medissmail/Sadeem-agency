"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { applicationConfirmation, applicationNotification, getEmailBranding } from "@/lib/email/templates";
import {
  applicationSchema,
  formatApplicationValidationError,
  type ApplicationFieldErrors,
} from "@/lib/validation/careers";

export type SubmitApplicationState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: ApplicationFieldErrors }
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

export async function submitApplicationAction(
  _prev: SubmitApplicationState,
  formData: FormData,
): Promise<SubmitApplicationState> {
  if ((formData.get("website") as string)?.length) return { status: "success" };

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
    .select("id, title, slug, is_open")
    .eq("id", parsed.data.job_id)
    .single();

  if (jobError || !job || !job.is_open) {
    return { status: "error", message: "This role is not currently accepting applications." };
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
