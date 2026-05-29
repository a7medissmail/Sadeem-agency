"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import {
  applicationRejection,
  applicationShortlisted,
  applicationOffer,
  getEmailBranding,
} from "@/lib/email/templates";
import { applicationStatuses } from "@/lib/validation/careers";
import type { ApplicationStatus } from "@/types/database";

const RESUME_BUCKET = "application-resumes";

export async function updateApplicationStatusAction(formData: FormData): Promise<void> {
  const profile = await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  const status = formData.get("status") as ApplicationStatus;
  const note = String(formData.get("note") ?? "").trim();
  if (!id) throw new Error("Missing application id");
  if (!applicationStatuses.includes(status)) throw new Error("Invalid application status");

  const admin = getSupabaseAdmin();
  const { data: application, error: readError } = await admin
    .from("applications")
    .select("id, name, email, status, job_id")
    .eq("id", id)
    .single();

  if (readError || !application) throw new Error(readError?.message ?? "Application not found");

  const { error } = await admin.from("applications").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  if (application.status !== status) {
    await admin.from("application_status_history").insert({
      application_id: id,
      from_status: application.status,
      to_status: status,
      actor_id: profile.id,
      note: note || null,
    });
  }

  // Send a candidate-facing email whenever the status advances to a
  // meaningful milestone. Guard: only send when status actually changed.
  const statusChanged = application.status !== status;
  if (statusChanged && ["interview", "offer", "rejected"].includes(status)) {
    const { data: job } = await admin
      .from("jobs")
      .select("title")
      .eq("id", application.job_id)
      .maybeSingle();
    const jobTitle = job?.title ?? "the role";
    const brand = await getEmailBranding();

    let emailPayload: { subject: string; html: string } | null = null;

    if (status === "interview") {
      emailPayload = applicationShortlisted({ name: application.name, jobTitle, brand });
    } else if (status === "offer") {
      emailPayload = applicationOffer({ name: application.name, jobTitle, brand });
    } else if (status === "rejected") {
      emailPayload = applicationRejection({ name: application.name, jobTitle, brand });
    }

    if (emailPayload) {
      await sendEmail({
        channel: "careers",
        to: application.email,
        subject: emailPayload.subject,
        html: emailPayload.html,
        replyTo: process.env.TEAM_NOTIFY_TO,
      });
    }
  }

  revalidatePath("/admin/applications");
}

function nullableTrim(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function nullableUrl(value: FormDataEntryValue | null, label: string) {
  const text = nullableTrim(value);
  if (!text) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
    return url.toString();
  } catch {
    throw new Error(`${label} must be a valid http(s) URL`);
  }
}

export async function updateApplicationMetaAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing application id");

  const rawScore = nullableTrim(formData.get("score"));
  const score = rawScore == null ? null : Number(rawScore);
  if (score != null && (!Number.isInteger(score) || score < 0 || score > 100)) {
    throw new Error("Score must be a number between 0 and 100");
  }

  const owner_id = nullableTrim(formData.get("owner_id"));
  const portfolio_url = nullableUrl(formData.get("portfolio_url"), "Portfolio URL");
  const linkedin_url = nullableUrl(formData.get("linkedin_url"), "LinkedIn URL");

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("applications")
    .update({ owner_id, score, portfolio_url, linkedin_url })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/applications");
}

export async function addApplicationNoteAction(formData: FormData): Promise<void> {
  const profile = await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  const note = String(formData.get("note") ?? "").trim();
  if (!id) throw new Error("Missing application id");
  if (note.length < 2) throw new Error("Note must be at least 2 characters");
  if (note.length > 4000) throw new Error("Note must be 4000 characters or fewer");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("application_notes").insert({
    application_id: id,
    author_id: profile.id,
    note,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/applications");
}

export async function deleteApplicationAction(formData: FormData): Promise<void> {
  const profile = await requireRole(["admin"]);
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing application id");

  const admin = getSupabaseAdmin();
  const { data: application } = await admin
    .from("applications")
    .select("resume_url")
    .eq("id", id)
    .single();

  const { error } = await admin.from("applications").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit({ tableName: "applications", recordId: id, action: "delete", actorId: profile.id, actorName: profile.full_name ?? profile.email ?? null });

  if (application?.resume_url && !/^https?:\/\//i.test(application.resume_url)) {
    await admin.storage.from(RESUME_BUCKET).remove([application.resume_url]);
  }

  revalidatePath("/admin/applications");
}

/**
 * Slim action for Kanban drag-and-drop — accepts plain args instead of FormData.
 * Mirrors the email logic of updateApplicationStatusAction so that dragging to
 * "interview" or "offer" automatically sends the candidate email.
 */
export async function moveApplicationAction(
  id: string,
  newStatus: ApplicationStatus,
): Promise<void> {
  const profile = await requireRole(["admin", "editor"]);

  const admin = getSupabaseAdmin();
  const { data: application, error: readError } = await admin
    .from("applications")
    .select("id, name, email, status, job_id")
    .eq("id", id)
    .single();

  if (readError || !application) throw new Error(readError?.message ?? "Application not found");
  if (application.status === newStatus) return; // idempotent

  const { error } = await admin
    .from("applications")
    .update({ status: newStatus })
    .eq("id", id);
  if (error) throw new Error(error.message);

  // Record status history (shows in the dossier timeline)
  await admin.from("application_status_history").insert({
    application_id: id,
    from_status: application.status,
    to_status: newStatus,
    actor_id: profile.id,
    note: "Moved via Kanban",
  });

  // Auto-email on milestone statuses
  if (["interview", "offer", "rejected"].includes(newStatus)) {
    const { data: job } = await admin
      .from("jobs")
      .select("title")
      .eq("id", application.job_id)
      .maybeSingle();
    const jobTitle = job?.title ?? "the role";
    const brand = await getEmailBranding();

    let emailPayload: { subject: string; html: string } | null = null;
    if (newStatus === "interview")
      emailPayload = applicationShortlisted({ name: application.name, jobTitle, brand });
    else if (newStatus === "offer")
      emailPayload = applicationOffer({ name: application.name, jobTitle, brand });
    else
      emailPayload = applicationRejection({ name: application.name, jobTitle, brand });

    if (emailPayload) {
      await sendEmail({
        channel: "careers",
        to: application.email,
        subject: emailPayload.subject,
        html: emailPayload.html,
        replyTo: process.env.TEAM_NOTIFY_TO,
      });
    }
  }

  revalidatePath("/admin/applications");
}
