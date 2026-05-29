"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatTeamValidationError, teamMemberSchema, type TeamFieldErrors } from "@/lib/validation/team";

export type TeamFormState = {
  error?: string;
  fieldErrors?: TeamFieldErrors;
  ok?: boolean;
};

const TEAM_BUCKET = "team-photos";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = new Map([
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["webp", "image/webp"],
]);

function imageMetadata(file: File): { extension: string; contentType: string } {
  const rawExtension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const extension = IMAGE_TYPES.has(rawExtension) ? rawExtension : "";
  const typeExtension = [...IMAGE_TYPES.entries()].find(([, contentType]) => contentType === file.type)?.[0] ?? "";
  if (file.type && !typeExtension) throw new Error("Photo must be PNG, JPG, or WebP");

  const finalExtension = typeExtension || extension;
  const contentType = IMAGE_TYPES.get(finalExtension);
  if (!finalExtension || !contentType) throw new Error("Photo must be PNG, JPG, or WebP");

  return {
    extension: finalExtension === "jpeg" ? "jpg" : finalExtension,
    contentType,
  };
}

async function uploadTeamPhoto(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Photo must be under 5 MB");

  const { extension, contentType } = imageMetadata(file);
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const admin = getSupabaseAdmin();
  const { error } = await admin.storage.from(TEAM_BUCKET).upload(path, file, { contentType, upsert: false });
  if (error) throw new Error(error.message);

  const { data } = admin.storage.from(TEAM_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function readForm(formData: FormData) {
  return {
    name: formData.get("name") ?? "",
    role: formData.get("role") ?? "",
    credential: formData.get("credential") ?? "",
    category: formData.get("category") ?? "founder",
    bio: formData.get("bio") ?? "",
    photo_url: formData.get("photo_url") ?? "",
    socials: {
      website: formData.get("website") ?? "",
      linkedin: formData.get("linkedin") ?? "",
      x: formData.get("x") ?? "",
      instagram: formData.get("instagram") ?? "",
    },
    sort_order: formData.get("sort_order") ?? "",
    is_active: formData.get("is_active") || false,
  };
}

function databaseErrorMessage(message: string) {
  if (message.toLowerCase().includes("bucket")) {
    return "Team photo bucket is not available yet. Run supabase/migrations/0006_team_photos.sql, then try again.";
  }
  return message;
}

export async function createTeamMemberAction(
  _prev: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  await requireRole(["admin", "editor"]);

  const parsed = teamMemberSchema.safeParse(readForm(formData));
  if (!parsed.success) return formatTeamValidationError(parsed.error);

  let photo_url = parsed.data.photo_url;
  try {
    const file = formData.get("photo_file") as File | null;
    if (file && file.size > 0) photo_url = await uploadTeamPhoto(file);
  } catch (err) {
    return { error: err instanceof Error ? databaseErrorMessage(err.message) : "Photo upload failed" };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("team_members").insert({ ...parsed.data, photo_url });
  if (error) return { error: databaseErrorMessage(error.message) };

  revalidatePath("/admin/team");
  revalidatePath("/team");
  redirect("/admin/team");
}

export async function updateTeamMemberAction(
  _prev: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  if (!id) return { error: "Missing team member id" };

  const parsed = teamMemberSchema.safeParse(readForm(formData));
  if (!parsed.success) return formatTeamValidationError(parsed.error);

  let photo_url = parsed.data.photo_url;
  try {
    const file = formData.get("photo_file") as File | null;
    if (file && file.size > 0) photo_url = await uploadTeamPhoto(file);
  } catch (err) {
    return { error: err instanceof Error ? databaseErrorMessage(err.message) : "Photo upload failed" };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("team_members").update({ ...parsed.data, photo_url }).eq("id", id);
  if (error) return { error: databaseErrorMessage(error.message) };

  revalidatePath("/admin/team");
  revalidatePath("/team");
  return { ok: true };
}

export async function toggleTeamMemberActiveAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  const next = formData.get("next") === "on";
  if (!id) throw new Error("Missing team member id");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("team_members").update({ is_active: next }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/team");
  revalidatePath("/team");
}

export async function deleteTeamMemberAction(formData: FormData): Promise<void> {
  const profile = await requireRole(["admin"]);
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing team member id");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("team_members").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit({ tableName: "team_members", recordId: id, action: "delete", actorId: profile.id, actorName: profile.full_name ?? profile.email ?? null });

  revalidatePath("/admin/team");
  revalidatePath("/team");
}
