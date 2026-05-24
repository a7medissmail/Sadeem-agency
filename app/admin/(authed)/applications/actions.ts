"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { applicationRejection } from "@/lib/email/templates";
import { applicationStatuses } from "@/lib/validation/careers";
import type { ApplicationStatus } from "@/types/database";

const RESUME_BUCKET = "application-resumes";

export async function updateApplicationStatusAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  const status = formData.get("status") as ApplicationStatus;
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

  if (application.status !== status && status === "rejected") {
    const { data: job } = await admin.from("jobs").select("title").eq("id", application.job_id).maybeSingle();
    const email = applicationRejection({
      name: application.name,
      jobTitle: job?.title ?? "the role",
    });

    await sendEmail({
      to: application.email,
      subject: email.subject,
      html: email.html,
      replyTo: process.env.TEAM_NOTIFY_TO,
    });
  }

  revalidatePath("/admin/applications");
}

export async function deleteApplicationAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
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

  if (application?.resume_url && !/^https?:\/\//i.test(application.resume_url)) {
    await admin.storage.from(RESUME_BUCKET).remove([application.resume_url]);
  }

  revalidatePath("/admin/applications");
}
