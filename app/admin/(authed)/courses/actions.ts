"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { courseSchema, slugify } from "@/lib/validation/course";

export type CourseFormState = { error?: string; ok?: boolean };

const COURSE_BUCKET = "course-images";

async function uploadCourseImage(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5 MB");
  if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) {
    throw new Error("Image must be PNG / JPG / WebP / GIF");
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const admin = getSupabaseAdmin();
  const { error } = await admin.storage
    .from(COURSE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  const { data } = admin.storage.from(COURSE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function readForm(formData: FormData) {
  return {
    title: formData.get("title"),
    slug: (formData.get("slug") as string) || slugify((formData.get("title") as string) || ""),
    summary: formData.get("summary"),
    body: formData.get("body"),
    location: formData.get("location"),
    starts_at: formData.get("starts_at"),
    ends_at: formData.get("ends_at"),
    capacity: formData.get("capacity"),
    price: formData.get("price"),
    image_url: formData.get("image_url"),
    is_active: formData.get("is_active") || false,
  };
}

export async function createCourseAction(
  _prev: CourseFormState,
  formData: FormData,
): Promise<CourseFormState> {
  await requireRole(["admin", "editor"]);

  const parsed = courseSchema.safeParse(readForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  let image_url = parsed.data.image_url;
  try {
    const file = formData.get("image_file") as File | null;
    if (file && file.size > 0) image_url = await uploadCourseImage(file);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Image upload failed" };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("courses").insert({ ...parsed.data, image_url });
  if (error) return { error: error.message };

  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  redirect("/admin/courses");
}

export async function updateCourseAction(
  _prev: CourseFormState,
  formData: FormData,
): Promise<CourseFormState> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  if (!id) return { error: "Missing course id" };

  const parsed = courseSchema.safeParse(readForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  let image_url = parsed.data.image_url;
  try {
    const file = formData.get("image_file") as File | null;
    if (file && file.size > 0) image_url = await uploadCourseImage(file);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Image upload failed" };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("courses").update({ ...parsed.data, image_url }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  revalidatePath(`/courses/${parsed.data.slug}`);
  redirect("/admin/courses");
}

export async function toggleCourseActiveAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  const next = formData.get("next") === "on";
  if (!id) throw new Error("Missing course id");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("courses").update({ is_active: next }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
}

export async function deleteCourseAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing course id");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("courses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
}
