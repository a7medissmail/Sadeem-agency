"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email/resend";
import { proposalInviteClient, getEmailBranding } from "@/lib/email/templates";
import type { Database } from "@/types/database";

type LeadStatus = Database["public"]["Tables"]["leads"]["Row"]["status"];

const adminLeadSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  source: z.enum(["homepage", "course", "consultation", "other"]).default("other"),
  status: z.enum(["new", "contacted", "qualified", "won", "lost"]).default("new"),
});

export async function createLeadAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "editor"]);
  const parsed = adminLeadSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    company: formData.get("company") ?? "",
    message: formData.get("message") ?? "",
    source: formData.get("source") ?? "other",
    status: formData.get("status") ?? "new",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid lead data");
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("leads").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    company: parsed.data.company || null,
    message: parsed.data.message || null,
    source: parsed.data.source,
    status: parsed.data.status,
    owner_id: null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  redirect("/admin/leads");
}

export async function updateLeadStatusAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  const status = formData.get("status") as LeadStatus;
  if (!id || !status) throw new Error("Missing id or status");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("leads").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
}

/**
 * Slim action for Kanban drag-and-drop — accepts plain args instead of FormData.
 * Called client-side after an optimistic status update.
 */
export async function moveLeadAction(id: string, status: LeadStatus): Promise<void> {
  await requireRole(["admin", "editor"]);
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("leads").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/leads");
}

export async function assignLeadOwnerAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  const owner_id = (formData.get("owner_id") as string) || null;
  if (!id) throw new Error("Missing lead id");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("leads").update({ owner_id }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/leads");
}

export async function deleteLeadAction(formData: FormData): Promise<void> {
  const profile = await requireRole(["admin"]);
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing lead id");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("leads").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit({ tableName: "leads", recordId: id, action: "delete", actorId: profile.id, actorName: profile.full_name ?? profile.email ?? null });
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
}

// ─── Quick Brief from a Lead ──────────────────────────────────────────────────

export async function createBriefFromLeadAction(
  leadId: string,
  formId: string | null,
  days: number,
  emailNow: boolean,
): Promise<{ rawToken?: string; error?: string }> {
  const profile = await requireRole(["admin", "editor"]);

  const admin = getSupabaseAdmin();
  const { data: lead, error: readError } = await admin
    .from("leads")
    .select("name, email, company")
    .eq("id", leadId)
    .single();

  if (readError || !lead) return { error: readError?.message ?? "Lead not found" };

  // Validate expiry
  const safeDays = Number.isFinite(days) && days > 0 && days <= 365 ? days : 14;
  const expires_at = new Date(Date.now() + safeDays * 86_400_000).toISOString();
  const title = `Brief — ${lead.name}`;

  // Generate token (hash stored, raw returned once to admin)
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 8);

  const { error: insertError } = await admin.from("proposals").insert({
    form_id: formId,
    title,
    client_name: lead.name,
    client_email: lead.email,
    client_company: lead.company ?? null,
    token_hash: hash,
    token_prefix: prefix,
    status: emailNow ? "sent" : "draft",
    expires_at,
    sent_at: emailNow ? new Date().toISOString() : null,
    created_by: profile.id,
    lead_id: leadId,
  });

  if (insertError) return { error: insertError.message };

  revalidatePath("/admin/proposals");
  revalidatePath("/admin/leads");

  if (emailNow) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sadeem.agency";
    const portalUrl = `${baseUrl}/p/${raw}`;
    const expiresDate = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
      new Date(expires_at),
    );

    void (async () => {
      try {
        const brand = await getEmailBranding();
        const { subject, html } = proposalInviteClient({
          clientName: lead.name,
          proposalTitle: title,
          portalUrl,
          expiresDate,
          brand,
        });
        await sendEmail({ channel: "briefs", to: lead.email, subject, html });
      } catch (err) {
        console.error("[brief] lead invite email failed:", err);
      }
    })();
  }

  return { rawToken: raw };
}

export async function addLeadNoteAction(formData: FormData): Promise<void> {
  const profile = await requireRole(["admin", "editor"]);
  const lead_id = formData.get("id") as string;
  const note = (formData.get("note") as string | null)?.trim() ?? "";
  if (!lead_id || !note) throw new Error("Missing lead id or note");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("lead_notes").insert({
    lead_id,
    author_id: profile.id,
    note,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/leads");
}
