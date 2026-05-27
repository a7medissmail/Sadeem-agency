"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { serviceSchema } from "@/lib/validation/service";

export type ServiceFormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

function toSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function parseFormData(formData: FormData) {
  const deliverables: string[] = [];
  for (const [key, value] of formData.entries()) {
    if (key === "deliverables[]" && typeof value === "string" && value.trim()) {
      deliverables.push(value.trim());
    }
  }

  return {
    slug:         (formData.get("slug") as string | null)?.trim() || "",
    title:        (formData.get("title") as string | null)?.trim() || "",
    category:     (formData.get("category") as string | null) || "",
    tagline:      (formData.get("tagline") as string | null)?.trim() || null,
    intro:        (formData.get("intro") as string | null)?.trim() || null,
    body:         (formData.get("body") as string | null)?.trim() || null,
    deliverables,
    icon_key:     (formData.get("icon_key") as string | null)?.trim() || null,
    sort_order:   parseInt(formData.get("sort_order") as string, 10) || 0,
    is_published: formData.get("is_published") === "true",
  };
}

export async function createServiceAction(
  _prev: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  await requireRole(["admin", "editor"]);
  const raw = parseFormData(formData);
  if (!raw.slug && raw.title) raw.slug = toSlug(raw.title);

  const result = serviceSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("services").insert({
    slug:         result.data.slug,
    title:        result.data.title,
    category:     result.data.category,
    tagline:      result.data.tagline ?? null,
    intro:        result.data.intro ?? null,
    body:         result.data.body ?? null,
    deliverables: result.data.deliverables ?? [],
    icon_key:     result.data.icon_key ?? null,
    sort_order:   result.data.sort_order ?? 0,
    is_published: result.data.is_published ?? false,
  });

  if (error) {
    if (error.code === "23505") return { errors: { slug: ["This slug is already in use."] } };
    return { message: error.message };
  }

  revalidatePath("/services");
  revalidatePath("/admin/services");
  redirect("/admin/services");
}

export async function updateServiceAction(
  id: string,
  _prev: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  await requireRole(["admin", "editor"]);
  const raw = parseFormData(formData);

  const result = serviceSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("services")
    .update({
      slug:         result.data.slug,
      title:        result.data.title,
      category:     result.data.category,
      tagline:      result.data.tagline ?? null,
      intro:        result.data.intro ?? null,
      body:         result.data.body ?? null,
      deliverables: result.data.deliverables ?? [],
      icon_key:     result.data.icon_key ?? null,
      sort_order:   result.data.sort_order ?? 0,
      is_published: result.data.is_published ?? false,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { errors: { slug: ["This slug is already in use."] } };
    return { message: error.message };
  }

  revalidatePath("/services");
  revalidatePath(`/services/${result.data.slug}`);
  revalidatePath("/admin/services");
  redirect("/admin/services");
}

export async function deleteServiceAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing id");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("services").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/services");
  revalidatePath("/admin/services");
}
