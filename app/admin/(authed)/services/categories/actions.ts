"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

export type CategoryFormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

const categorySchema = z.object({
  slug:        z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  label:       z.string().min(1, "Label is required").max(80),
  tagline:     z.string().max(160).nullish(),
  description: z.string().max(1000).nullish(),
  sort_order:  z.number().int().min(0).max(999).optional(),
});

function toSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function parseFormData(formData: FormData) {
  return {
    slug:        (formData.get("slug") as string | null)?.trim() || "",
    label:       (formData.get("label") as string | null)?.trim() || "",
    tagline:     (formData.get("tagline") as string | null)?.trim() || null,
    description: (formData.get("description") as string | null)?.trim() || null,
    sort_order:  parseInt(formData.get("sort_order") as string, 10) || 0,
  };
}

export async function createCategoryAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireRole(["admin", "editor"]);
  const raw = parseFormData(formData);
  if (!raw.slug && raw.label) raw.slug = toSlug(raw.label);

  const result = categorySchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("service_categories").insert({
    slug:        result.data.slug,
    label:       result.data.label,
    tagline:     result.data.tagline ?? null,
    description: result.data.description ?? null,
    sort_order:  result.data.sort_order ?? 0,
  });

  if (error) {
    if (error.code === "23505") return { errors: { slug: ["This slug is already in use."] } };
    return { message: error.message };
  }

  revalidatePath("/services");
  revalidatePath("/admin/services");
  revalidatePath("/admin/services/categories");
  redirect("/admin/services/categories");
}

export async function updateCategoryAction(
  id: string,
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireRole(["admin", "editor"]);
  const raw = parseFormData(formData);

  const result = categorySchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("service_categories")
    .update({
      slug:        result.data.slug,
      label:       result.data.label,
      tagline:     result.data.tagline ?? null,
      description: result.data.description ?? null,
      sort_order:  result.data.sort_order ?? 0,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { errors: { slug: ["This slug is already in use."] } };
    return { message: error.message };
  }

  revalidatePath("/services");
  revalidatePath("/admin/services");
  revalidatePath("/admin/services/categories");
  redirect("/admin/services/categories");
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing id");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("service_categories").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/services");
  revalidatePath("/admin/services");
  revalidatePath("/admin/services/categories");
}
