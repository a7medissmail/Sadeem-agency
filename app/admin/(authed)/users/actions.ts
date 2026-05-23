"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { inviteUserSchema, updateUserSchema } from "@/lib/validation/user";

export type ActionResult = { ok?: true; error?: string };

export async function inviteUserAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRole(["admin"]);

  const parsed = inviteUserSchema.safeParse({
    email: formData.get("email"),
    full_name: formData.get("full_name"),
    role: formData.get("role") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const admin = getSupabaseAdmin();
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/admin`;

  const { data, error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: { full_name: parsed.data.full_name },
    redirectTo,
  });
  if (error || !data.user) return { error: error?.message ?? "Failed to invite user" };

  // Profile is auto-created by trigger; set the role on top of it.
  const { error: upErr } = await admin
    .from("profiles")
    .update({ role: parsed.data.role, full_name: parsed.data.full_name })
    .eq("id", data.user.id);
  if (upErr) return { error: upErr.message };

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function updateUserAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const parsed = updateUserSchema.safeParse({
    id: formData.get("id"),
    full_name: (formData.get("full_name") as string) || undefined,
    role: (formData.get("role") as string) || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");

  const admin = getSupabaseAdmin();
  const { id, ...rest } = parsed.data;
  const { error } = await admin.from("profiles").update(rest).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const me = await requireRole(["admin"]);
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing user id");
  if (id === me.id) throw new Error("You can't delete your own account here");

  const admin = getSupabaseAdmin();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}
