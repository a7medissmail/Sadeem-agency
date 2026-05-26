"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { quotationAcceptedClient, getEmailBranding } from "@/lib/email/templates";
import type { QuotationStatus } from "@/types/database";

// ─── Token helpers (same pattern as proposals) ────────────────────────────────

function generateToken(): { raw: string; hash: string; prefix: string } {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 8);
  return { raw, hash, prefix };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuotationItemInput = {
  id?: string;         // existing item id (for updates)
  sort_order: number;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  unit_price: number;
};

export type SaveQuotationState = {
  ok?: boolean;
  error?: string;
  quotationId?: string;
};

export type SendQuotationState = {
  ok?: boolean;
  error?: string;
  rawToken?: string;
};

// ─── Compute totals ───────────────────────────────────────────────────────────

function computeTotals(
  items: QuotationItemInput[],
  discountPct: number,
  taxPct: number,
): { subtotal: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const afterDiscount = subtotal * (1 - discountPct / 100);
  const total = afterDiscount * (1 + taxPct / 100);
  return { subtotal: Math.round(subtotal * 100) / 100, total: Math.round(total * 100) / 100 };
}

// ─── Create / update quotation ────────────────────────────────────────────────

export async function saveQuotationAction(
  _prev: SaveQuotationState,
  formData: FormData,
): Promise<SaveQuotationState> {
  const profile_id = (await requireRole(["admin", "editor"])).id;
  const id = (formData.get("id") as string | null) || null;
  const proposal_id = (formData.get("proposal_id") as string | null) || null;
  const title = ((formData.get("title") as string | null) ?? "").trim();
  const intro_text = ((formData.get("intro_text") as string | null) ?? "").trim() || null;
  const currency = (formData.get("currency") as string | null) || "SAR";
  const validity_days = parseInt(formData.get("validity_days") as string, 10) || 30;
  const discount_pct = parseFloat(formData.get("discount_pct") as string) || 0;
  const tax_pct = parseFloat(formData.get("tax_pct") as string) || 0;
  const notes = ((formData.get("notes") as string | null) ?? "").trim() || null;

  if (!title) return { error: "Title is required." };

  // Parse items from JSON
  let items: QuotationItemInput[] = [];
  try {
    items = JSON.parse(formData.get("items") as string ?? "[]");
  } catch {
    return { error: "Invalid items data." };
  }

  if (items.length === 0) return { error: "Add at least one service line item." };

  const { subtotal, total } = computeTotals(items, discount_pct, tax_pct);
  const admin = getSupabaseAdmin();

  if (id) {
    // Update existing
    const { error } = await admin
      .from("quotations")
      .update({ title, intro_text, currency, validity_days, discount_pct, tax_pct, notes, subtotal, total })
      .eq("id", id);
    if (error) return { error: error.message };

    // Replace all items: delete + reinsert
    await admin.from("quotation_items").delete().eq("quotation_id", id);
    const itemRows = items.map((item, i) => ({
      quotation_id: id,
      sort_order: item.sort_order ?? i,
      name: item.name,
      description: item.description || null,
      quantity: item.quantity,
      unit: item.unit || null,
      unit_price: item.unit_price,
      total: Math.round(item.quantity * item.unit_price * 100) / 100,
    }));
    const { error: itemErr } = await admin.from("quotation_items").insert(itemRows);
    if (itemErr) return { error: itemErr.message };

    revalidatePath("/admin/proposals");
    return { ok: true, quotationId: id };
  } else {
    // Create new
    const { data: q, error } = await admin
      .from("quotations")
      .insert({
        proposal_id,
        title,
        intro_text,
        currency,
        validity_days,
        discount_pct,
        tax_pct,
        notes,
        subtotal,
        total,
        status: "draft",
        created_by: profile_id,
      })
      .select("id")
      .single();
    if (error || !q) return { error: error?.message ?? "Failed to create quotation." };

    const itemRows = items.map((item, i) => ({
      quotation_id: q.id,
      sort_order: item.sort_order ?? i,
      name: item.name,
      description: item.description || null,
      quantity: item.quantity,
      unit: item.unit || null,
      unit_price: item.unit_price,
      total: Math.round(item.quantity * item.unit_price * 100) / 100,
    }));
    const { error: itemErr } = await admin.from("quotation_items").insert(itemRows);
    if (itemErr) return { error: itemErr.message };

    revalidatePath("/admin/proposals");
    return { ok: true, quotationId: q.id };
  }
}

// ─── Send quotation (generate token, set status to sent) ──────────────────────

export async function sendQuotationAction(
  _prev: SendQuotationState,
  formData: FormData,
): Promise<SendQuotationState> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  if (!id) return { error: "Missing quotation id." };

  const { raw, hash, prefix } = generateToken();
  const admin = getSupabaseAdmin();

  const { error } = await admin
    .from("quotations")
    .update({
      token_hash: hash,
      token_prefix: prefix,
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/proposals");
  return { ok: true, rawToken: raw };
}

// ─── Update quotation status ──────────────────────────────────────────────────

export async function updateQuotationStatusAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const id = formData.get("id") as string;
  const status = formData.get("status") as QuotationStatus;
  if (!id || !status) throw new Error("Missing id or status");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("quotations").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/proposals");
}

// ─── Delete quotation ─────────────────────────────────────────────────────────

export async function deleteQuotationAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing quotation id");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("quotations").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/proposals");
}

// ─── Portal: record quotation view + client accept/decline ────────────────────
// Called from /q/[token] — no auth, validated by token server-side

export async function recordQuotationViewAction(quotationId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  await admin
    .from("quotations")
    .update({ status: "viewed", viewed_at: new Date().toISOString() })
    .eq("id", quotationId)
    .in("status", ["sent"]); // idempotent: only advance from 'sent'
}

export type ClientRespondState = {
  ok?: boolean;
  error?: string;
  action?: "accepted" | "declined";
};

export async function clientRespondQuotationAction(
  quotationId: string,
  action: "accepted" | "declined",
  declineReason?: string,
): Promise<ClientRespondState> {
  const admin = getSupabaseAdmin();

  // Re-verify the quotation is in a respondable state
  const { data: q } = await admin
    .from("quotations")
    .select("id, status, accepted_at, declined_at, title, total, currency, token_prefix, proposal_id")
    .eq("id", quotationId)
    .single();

  if (!q) return { error: "Quotation not found." };
  if (q.status === "accepted") return { ok: true, action: "accepted" }; // idempotent
  if (q.status === "declined") return { ok: true, action: "declined" }; // idempotent
  if (!["sent", "viewed"].includes(q.status)) {
    return { error: "This quotation can no longer be responded to." };
  }

  const now = new Date().toISOString();
  const update =
    action === "accepted"
      ? { status: "accepted" as QuotationStatus, accepted_at: now }
      : { status: "declined" as QuotationStatus, declined_at: now, decline_reason: declineReason ?? null };

  const { error } = await admin.from("quotations").update(update).eq("id", quotationId);
  if (error) return { error: error.message };

  revalidatePath("/admin/proposals");

  // Fire-and-forget confirmation email when client accepts
  if (action === "accepted" && q.proposal_id) {
    void (async () => {
      try {
        const { data: proposal } = await admin
          .from("proposals")
          .select("client_name, client_email, title")
          .eq("id", q.proposal_id!)
          .single();
        if (!proposal) return;

        const brand = await getEmailBranding();
        const { subject, html } = quotationAcceptedClient({
          clientName: proposal.client_name,
          proposalTitle: proposal.title,
          quotationTitle: q.title,
          engagementRef: q.token_prefix ?? quotationId.slice(0, 8),
          total: q.total,
          currency: q.currency ?? "SAR",
          brand,
        });
        await sendEmail({ to: proposal.client_email, subject, html });
      } catch (err) {
        console.error("[email] quotation accepted email failed:", err);
      }
    })();
  }

  return { ok: true, action };
}
