"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import {
  courseSchema,
  formatCourseValidationError,
  slugify,
  type CourseFieldErrors,
} from "@/lib/validation/course";

export type CourseFormState = {
  error?: string;
  fieldErrors?: CourseFieldErrors;
  ok?: boolean;
};

const COURSE_BUCKET = "course-images";
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
  if (file.type && !typeExtension) {
    throw new Error("Cover image must be PNG, JPG, or WebP");
  }

  const finalExtension = typeExtension || extension;
  const contentType = IMAGE_TYPES.get(finalExtension);

  if (!finalExtension || !contentType) {
    throw new Error("Cover image must be PNG, JPG, or WebP");
  }

  return {
    extension: finalExtension === "jpeg" ? "jpg" : finalExtension,
    contentType,
  };
}

async function uploadCourseImage(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Cover image must be under 5 MB");

  const { extension, contentType } = imageMetadata(file);
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const admin = getSupabaseAdmin();
  const { error } = await admin.storage
    .from(COURSE_BUCKET)
    .upload(path, file, { contentType, upsert: false });
  if (error) throw new Error(error.message);
  const { data } = admin.storage.from(COURSE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function readForm(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const slug = String(formData.get("slug") ?? "").trim() || slugify(title);

  return {
    title,
    slug,
    summary: formData.get("summary") ?? "",
    body: formData.get("body") ?? "",
    location: formData.get("location") ?? "",
    starts_at: formData.get("starts_at") ?? "",
    ends_at: formData.get("ends_at") ?? "",
    capacity: formData.get("capacity") ?? "",
    price: formData.get("price") ?? "",
    currency: formData.get("currency") ?? "SAR",
    image_url: formData.get("image_url") ?? "",
    is_active: formData.get("is_active") || false,
  };
}

function databaseErrorMessage(message: string) {
  if (message.toLowerCase().includes("currency")) {
    return "Course currency is not available in the database yet. Run supabase/migrations/0005_course_currency.sql, then try again.";
  }

  return message;
}

export async function createCourseAction(
  _prev: CourseFormState,
  formData: FormData,
): Promise<CourseFormState> {
  await requireRole(["admin", "editor"]);

  const parsed = courseSchema.safeParse(readForm(formData));
  if (!parsed.success) return formatCourseValidationError(parsed.error);

  let image_url = parsed.data.image_url;
  try {
    const file = formData.get("image_file") as File | null;
    if (file && file.size > 0) image_url = await uploadCourseImage(file);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Image upload failed" };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("courses").insert({ ...parsed.data, image_url });
  if (error) return { error: databaseErrorMessage(error.message) };

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
  if (!parsed.success) return formatCourseValidationError(parsed.error);

  let image_url = parsed.data.image_url;
  try {
    const file = formData.get("image_file") as File | null;
    if (file && file.size > 0) image_url = await uploadCourseImage(file);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Image upload failed" };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("courses").update({ ...parsed.data, image_url }).eq("id", id);
  if (error) return { error: databaseErrorMessage(error.message) };

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
