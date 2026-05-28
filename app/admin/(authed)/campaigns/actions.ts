"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { campaignEmail, getEmailBranding } from "@/lib/email/templates";
import { unsubscribeUrl } from "@/lib/email/unsubscribe";
import { campaignSchema, type CampaignAudience } from "@/lib/validation/campaign";
import type { CampaignStatus, Database, Json, LeadSource, LeadStatus } from "@/types/database";

type LeadRow = Pick<
  Database["public"]["Tables"]["leads"]["Row"],
  "id" | "name" | "email" | "status" | "source" | "marketing_unsubscribed_at"
>;

function parseAudience(value: unknown): CampaignAudience {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  return {
    status: typeof raw.status === "string" ? (raw.status as LeadStatus) : null,
    source: typeof raw.source === "string" ? (raw.source as LeadSource) : null,
  };
}

async function eligibleLeads(audience: CampaignAudience): Promise<LeadRow[]> {
  const admin = getSupabaseAdmin();
  let query = admin
    .from("leads")
    .select("id, name, email, status, source, marketing_unsubscribed_at")
    .is("marketing_unsubscribed_at", null)
    .order("created_at", { ascending: false })
    .limit(500);

  if (audience.status) query = query.eq("status", audience.status);
  if (audience.source) query = query.eq("source", audience.source);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const deduped = new Map<string, LeadRow>();
  for (const lead of data ?? []) {
    const key = lead.email.trim().toLowerCase();
    if (!deduped.has(key)) deduped.set(key, lead as LeadRow);
  }
  return [...deduped.values()];
}

export async function createCampaignAction(formData: FormData): Promise<void> {
  const profile = await requireRole(["admin", "editor"]);
  const parsed = campaignSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
    status: formData.get("status") ?? "",
    source: formData.get("source") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid campaign");
  }

  const audience: CampaignAudience = {
    status: parsed.data.status ?? null,
    source: parsed.data.source ?? null,
  };

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("email_campaigns").insert({
    subject: parsed.data.subject,
    body: parsed.data.body,
    audience: audience as Json,
    created_by: profile.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/campaigns");
}

export async function sendCampaignAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "editor"]);
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing campaign id");

  const admin = getSupabaseAdmin();
  const { data: campaign, error } = await admin
    .from("email_campaigns")
    .select("id, subject, body, audience, status")
    .eq("id", id)
    .single();

  if (error || !campaign) throw new Error(error?.message ?? "Campaign not found");
  if (campaign.status === "sending") throw new Error("Campaign is already sending");
  if (campaign.status === "sent") throw new Error("Campaign has already been sent");

  const audience = parseAudience(campaign.audience);
  let leads = await eligibleLeads(audience);

  // On retry (failed campaign), skip leads that already received this send
  // successfully to prevent duplicating emails to recipients that didn't fail.
  if (campaign.status === "failed") {
    const { data: alreadySent } = await admin
      .from("email_sends")
      .select("lead_id")
      .eq("campaign_id", id)
      .eq("status", "sent");
    if (alreadySent && alreadySent.length > 0) {
      const sentLeadIds = new Set(alreadySent.map((r) => r.lead_id).filter(Boolean));
      leads = leads.filter((lead) => !sentLeadIds.has(lead.id));
    }
  }

  await admin.from("email_campaigns").update({ status: "sending" as CampaignStatus }).eq("id", id);

  let failures = 0;
  const brand = await getEmailBranding();
  for (const lead of leads) {
    const email = campaignEmail({
      subject: campaign.subject,
      body: campaign.body,
      leadName: lead.name,
      unsubscribeUrl: unsubscribeUrl(lead.id),
      brand,
    });

    const result = await sendEmail({
      to: lead.email,
      subject: email.subject,
      html: email.html,
    });

    const failed = "error" in result;
    if (failed) failures += 1;

    await admin.from("email_sends").insert({
      campaign_id: id,
      lead_id: lead.id,
      recipient_email: lead.email,
      status: failed ? "failed" : "sent",
      error: failed ? JSON.stringify(result.error).slice(0, 1000) : null,
      resend_id: "id" in result ? result.id ?? null : null,
      sent_at: failed ? null : new Date().toISOString(),
    });
  }

  await admin
    .from("email_campaigns")
    .update({
      status: failures > 0 ? ("failed" as CampaignStatus) : ("sent" as CampaignStatus),
      sent_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/admin/campaigns");
}

export async function updateCampaignAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "editor"]);
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing campaign id");

  const parsed = campaignSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
    status: formData.get("status") ?? "",
    source: formData.get("source") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid campaign");
  }

  const audience: CampaignAudience = {
    status: parsed.data.status ?? null,
    source: parsed.data.source ?? null,
  };

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("email_campaigns")
    .update({
      subject: parsed.data.subject,
      body: parsed.data.body,
      audience: audience as Json,
    })
    .eq("id", id)
    .eq("status", "draft"); // only drafts can be edited

  if (error) throw new Error(error.message);
  revalidatePath("/admin/campaigns");
}

export async function deleteCampaignAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing campaign id");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("email_campaigns").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/campaigns");
}
