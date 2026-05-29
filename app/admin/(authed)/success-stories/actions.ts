"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  formatSuccessStoryValidationError,
  slugify,
  successStorySchema,
  type SuccessStoryFieldErrors,
} from "@/lib/validation/successStory";

export type SuccessStoryFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: SuccessStoryFieldErrors;
};

const STORY_BUCKET = "success-story-images";
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
  if (file.type && !typeExtension) throw new Error("Image must be PNG, JPG, or WebP");

  const finalExtension = typeExtension || extension;
  const contentType = IMAGE_TYPES.get(finalExtension);
  if (!finalExtension || !contentType) throw new Error("Image must be PNG, JPG, or WebP");

  return { extension: finalExtension === "jpeg" ? "jpg" : finalExtension, contentType };
}

async function uploadStoryImage(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Image must be under 5 MB");

  const { extension, contentType } = imageMetadata(file);
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const admin = getSupabaseAdmin();
  const { error } = await admin.storage.from(STORY_BUCKET).upload(path, file, { contentType, upsert: false });
  if (error) throw new Error(error.message);
  const { data } = admin.storage.from(STORY_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function readForm(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const slug = String(formData.get("slug") ?? "").trim() || slugify(title);

  return {
    title,
    slug,
    client_name: formData.get("client_name") ?? "",
    industry: formData.get("industry") ?? "",
    summary: formData.get("summary") ?? "",
    challenge: formData.get("challenge") ?? "",
    solution: formData.get("solution") ?? "",
    results: formData.get("results") ?? "",
    body: formData.get("body") ?? "",
    image_url: formData.get("image_url") ?? "",
    metric_value: formData.get("metric_value") ?? "",
    metric_label: formData.get("metric_label") ?? "",
    sort_order: formData.get("sort_order") ?? "",
    is_published: formData.get("is_published") || false,
  };
}

function storyDatabaseError(message: string) {
  if (message.toLowerCase().includes("success_stories")) {
    return "Success stories are not available in the database yet. Run supabase/migrations/0012_success_stories.sql, then try again.";
  }
  if (message.toLowerCase().includes("duplicate")) return "That slug is already used by another story.";
  return message;
}

export async function createSuccessStoryAction(
  _prev: SuccessStoryFormState,
  formData: FormData,
): Promise<SuccessStoryFormState> {
  await requireRole(["admin", "editor"]);

  const parsed = successStorySchema.safeParse(readForm(formData));
  if (!parsed.success) return formatSuccessStoryValidationError(parsed.error);

  let image_url = parsed.data.image_url;
  try {
    const file = formData.get("image_file") as File | null;
    if (file && file.size > 0) image_url = await uploadStoryImage(file);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Image upload failed" };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("success_stories").insert({ ...parsed.data, image_url });
  if (error) return { error: storyDatabaseError(error.message) };

  revalidatePath("/admin/success-stories");
  revalidatePath("/success-stories");
  revalidatePath("/");
  redirect("/admin/success-stories");
}

export async function updateSuccessStoryAction(
  _prev: SuccessStoryFormState,
  formData: FormData,
): Promise<SuccessStoryFormState> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  if (!id) return { error: "Missing story id" };

  const parsed = successStorySchema.safeParse(readForm(formData));
  if (!parsed.success) return formatSuccessStoryValidationError(parsed.error);

  let image_url = parsed.data.image_url;
  try {
    const file = formData.get("image_file") as File | null;
    if (file && file.size > 0) image_url = await uploadStoryImage(file);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Image upload failed" };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("success_stories").update({ ...parsed.data, image_url }).eq("id", id);
  if (error) return { error: storyDatabaseError(error.message) };

  revalidatePath("/admin/success-stories");
  revalidatePath("/success-stories");
  revalidatePath(`/success-stories/${parsed.data.slug}`);
  revalidatePath("/");
  return { ok: true };
}

export async function toggleSuccessStoryPublishedAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  const next = formData.get("next") === "on";
  if (!id) throw new Error("Missing story id");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("success_stories").update({ is_published: next }).eq("id", id);
  if (error) throw new Error(storyDatabaseError(error.message));
  revalidatePath("/admin/success-stories");
  revalidatePath("/success-stories");
  revalidatePath("/");
}

export async function deleteSuccessStoryAction(formData: FormData): Promise<void> {
  const profile = await requireRole(["admin"]);
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing story id");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("success_stories").delete().eq("id", id);
  if (error) throw new Error(storyDatabaseError(error.message));
  await logAudit({ tableName: "success_stories", recordId: id, action: "delete", actorId: profile.id, actorName: profile.full_name ?? profile.email ?? null });
  revalidatePath("/admin/success-stories");
  revalidatePath("/success-stories");
  revalidatePath("/");
}
