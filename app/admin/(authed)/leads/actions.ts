"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
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
  await requireRole(["admin"]);
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing lead id");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("leads").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
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
