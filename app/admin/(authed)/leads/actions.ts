"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import type { Database } from "@/types/database";

type LeadStatus = Database["public"]["Tables"]["leads"]["Row"]["status"];

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
