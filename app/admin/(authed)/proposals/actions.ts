"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { briefReceivedClient, briefSubmittedAdmin, proposalInviteClient, getEmailBranding } from "@/lib/email/templates";
import type { ProposalStatus } from "@/types/database";

// ─── Token helpers ────────────────────────────────────────────────────────────

function generateToken(): { raw: string; hash: string; prefix: string } {
  const raw = crypto.randomBytes(32).toString("hex"); // 64-char hex
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 8);
  return { raw, hash, prefix };
}

// ─── Create ───────────────────────────────────────────────────────────────────

export type CreateProposalState = {
  ok?: boolean;
  error?: string;
  rawToken?: string; // returned once so admin can copy the link
};

export async function createProposalAction(
  _prev: CreateProposalState,
  formData: FormData,
): Promise<CreateProposalState> {
  const profile = await requireRole(["admin", "editor"]);

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const client_name = (formData.get("client_name") as string | null)?.trim() ?? "";
  const client_email = (formData.get("client_email") as string | null)?.trim() ?? "";
  const client_company = (formData.get("client_company") as string | null)?.trim() || null;
  const form_id = (formData.get("form_id") as string | null) || null;
  const daysRaw = parseInt(formData.get("expires_days") as string, 10);
  const days = Number.isFinite(daysRaw) && daysRaw > 0 ? daysRaw : 14;

  if (!title) return { error: "Title is required." };
  if (!client_name) return { error: "Client name is required." };
  if (!client_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client_email))
    return { error: "A valid client email is required." };

  const expires_at = new Date(Date.now() + days * 86_400_000).toISOString();
  const { raw, hash, prefix } = generateToken();

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("proposals").insert({
    form_id,
    title,
    client_name,
    client_email,
    client_company,
    token_hash: hash,
    token_prefix: prefix,
    status: "draft",
    expires_at,
    created_by: profile.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/proposals");
  // Return the raw token so the admin can copy the magic link before it's gone
  return { ok: true, rawToken: raw };
}

// ─── Update status ────────────────────────────────────────────────────────────

export async function updateProposalStatusAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  const status = formData.get("status") as ProposalStatus;
  if (!id || !status) throw new Error("Missing id or status");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("proposals").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/proposals");
}

// ─── Update internal notes ────────────────────────────────────────────────────

export async function updateProposalNotesAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  const internal_notes = (formData.get("internal_notes") as string | null)?.trim() || null;
  if (!id) throw new Error("Missing proposal id");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("proposals").update({ internal_notes }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/proposals");
}

// ─── Mark as sent ─────────────────────────────────────────────────────────────

export async function markProposalSentAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing proposal id");

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("proposals")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["draft"]); // only advance from draft
  if (error) throw new Error(error.message);
  revalidatePath("/admin/proposals");
}

// ─── Regenerate token ─────────────────────────────────────────────────────────

export type RegenerateTokenState = {
  ok?: boolean;
  error?: string;
  rawToken?: string;
};

export async function regenerateProposalTokenAction(
  _prev: RegenerateTokenState,
  formData: FormData,
): Promise<RegenerateTokenState> {
  await requireRole(["admin"]);
  const id = formData.get("id") as string;
  if (!id) return { error: "Missing proposal id" };

  const { raw, hash, prefix } = generateToken();
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("proposals")
    .update({ token_hash: hash, token_prefix: prefix })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/proposals");
  return { ok: true, rawToken: raw };
}

// ─── Email invite to client ───────────────────────────────────────────────────
// Regenerates the token so we have the raw value, then emails the portal link.

export type EmailProposalState = {
  ok?: boolean;
  error?: string;
  rawToken?: string;
};

export async function emailProposalAction(
  _prev: EmailProposalState,
  formData: FormData,
): Promise<EmailProposalState> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  if (!id) return { error: "Missing proposal id" };

  const admin = getSupabaseAdmin();
  const { data: proposal, error: fetchError } = await admin
    .from("proposals")
    .select("title, client_name, client_email, expires_at, status")
    .eq("id", id)
    .single();
  if (fetchError || !proposal) return { error: fetchError?.message ?? "Proposal not found" };

  // Regenerate token so we have the raw value to build the URL
  const { raw, hash, prefix } = generateToken();
  const { error: updateError } = await admin
    .from("proposals")
    .update({
      token_hash: hash,
      token_prefix: prefix,
      status: "sent" as ProposalStatus,
      sent_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (updateError) return { error: updateError.message };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sadeem.agency";
  const portalUrl = `${baseUrl}/p/${raw}`;
  const expiresDate = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(proposal.expires_at),
  );

  // Fire-and-forget — token is already saved; don't fail if email bounces
  void (async () => {
    try {
      const brand = await getEmailBranding();
      const { subject, html } = proposalInviteClient({
        clientName: proposal.client_name,
        proposalTitle: proposal.title,
        portalUrl,
        expiresDate,
        brand,
      });
      await sendEmail({ to: proposal.client_email, subject, html });
    } catch (err) {
      console.error("[proposal] invite email failed:", err);
    }
  })();

  revalidatePath("/admin/proposals");
  return { ok: true, rawToken: raw };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteProposalAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing proposal id");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("proposals").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/proposals");
  redirect("/admin/proposals");
}

// ─── Portal: record open + submit ─────────────────────────────────────────────
// These actions are called from the public /p/[token] portal.
// They use requireRole([])-free paths and validate via the token instead.

export async function recordProposalOpenAction(proposalId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  // Only update to 'opened' if currently 'sent' (idempotent)
  await admin
    .from("proposals")
    .update({ status: "opened", opened_at: new Date().toISOString() })
    .eq("id", proposalId)
    .in("status", ["sent"]);
}

export async function markProposalInProgressAction(proposalId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  await admin
    .from("proposals")
    .update({ status: "in_progress" })
    .eq("id", proposalId)
    .in("status", ["opened"]);
}

export type SubmitProposalState = {
  ok?: boolean;
  error?: string;
};

export async function submitProposalAction(
  proposalId: string,
  formId: string | null,
  clientName: string,
  clientEmail: string,
  answers: Record<string, string>,
): Promise<SubmitProposalState> {
  const admin = getSupabaseAdmin();

  // Verify proposal is still open & not expired
  const { data: proposal } = await admin
    .from("proposals")
    .select("id, status, expires_at, form_id, title, client_company")
    .eq("id", proposalId)
    .single();

  if (!proposal) return { error: "Proposal not found." };
  if (proposal.status === "submitted") return { error: "already_submitted" };
  if (proposal.status === "expired" || new Date(proposal.expires_at) < new Date())
    return { error: "expired" };

  // Create form submission
  const { data: submission, error: subError } = await admin
    .from("form_submissions")
    .insert({
      form_id: formId || null,
      respondent_name: clientName,
      respondent_email: clientEmail,
      related_type: "proposal",
      related_id: proposalId,
      status: "new",
    })
    .select("id")
    .single();

  if (subError || !submission) return { error: subError?.message ?? "Failed to save submission." };

  // Insert answers
  const answerRows = Object.entries(answers).map(([field_key, rawValue]) => ({
    submission_id: submission.id,
    field_id: null as string | null,
    field_key,
    value: rawValue as unknown as import("@/types/database").Json,
  }));

  if (answerRows.length > 0) {
    const { error: ansError } = await admin.from("form_answers").insert(answerRows);
    if (ansError) return { error: ansError.message };
  }

  // Mark proposal submitted
  const { error: updateError } = await admin
    .from("proposals")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", proposalId);

  if (updateError) return { error: updateError.message };
  revalidatePath("/admin/proposals");

  // Fire-and-forget emails — never block or fail the action
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sadeem.agency";
  const team = process.env.TEAM_NOTIFY_TO;
  void (async () => {
    try {
      const brand = await getEmailBranding();
      const proposalTitle = proposal.title;

      // 1. Client confirmation
      const { subject: cs, html: ch } = briefReceivedClient({ clientName, proposalTitle, brand });
      await sendEmail({ to: clientEmail, subject: cs, html: ch });

      // 2. Admin notification — use TEAM_NOTIFY_TO (same as all other admin alerts)
      const notifyTo = team ?? brand.footerEmail ?? "hello@sadeem.agency";
      const { subject: as_, html: ah } = briefSubmittedAdmin({
        clientName,
        clientEmail,
        clientCompany: proposal.client_company,
        proposalTitle,
        adminUrl: `${baseUrl}/admin/proposals`,
        brand,
      });
      await sendEmail({ to: notifyTo, subject: as_, html: ah, replyTo: clientEmail });
    } catch (err) {
      console.error("[email] brief submission emails failed:", err);
    }
  })();

  return { ok: true };
}
