"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  clientPartnerSchema,
  clientSectionSchema,
  formatClientPartnerError,
  formatClientSectionError,
  type ClientPartnerFieldErrors,
  type ClientSectionFieldErrors,
} from "@/lib/validation/clients";

export type ClientSectionFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: ClientSectionFieldErrors;
};

export type ClientPartnerFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: ClientPartnerFieldErrors;
};

const LOGO_BUCKET = "partner-logos";
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_TYPES = new Map([
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["webp", "image/webp"],
  ["svg", "image/svg+xml"],
]);

function logoMetadata(file: File): { extension: string; contentType: string } {
  const rawExtension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const typeExtension = [...LOGO_TYPES.entries()].find(([, contentType]) => contentType === file.type)?.[0] ?? "";
  if (file.type && !typeExtension) throw new Error("Logo must be PNG, JPG, WebP, or SVG");

  const finalExtension = typeExtension || (LOGO_TYPES.has(rawExtension) ? rawExtension : "");
  const contentType = LOGO_TYPES.get(finalExtension);
  if (!finalExtension || !contentType) throw new Error("Logo must be PNG, JPG, WebP, or SVG");
  return { extension: finalExtension === "jpeg" ? "jpg" : finalExtension, contentType };
}

async function uploadLogo(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_LOGO_BYTES) throw new Error("Logo must be under 2 MB");

  const { extension, contentType } = logoMetadata(file);
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const admin = getSupabaseAdmin();
  const { error } = await admin.storage.from(LOGO_BUCKET).upload(path, file, { contentType, upsert: false });
  if (error) throw new Error(error.message);
  return admin.storage.from(LOGO_BUCKET).getPublicUrl(path).data.publicUrl;
}

function bucketHint(message: string) {
  if (message.toLowerCase().includes("bucket")) {
    return "Logo storage isn't available yet. Run supabase/migrations/0018_client_section.sql, then try again.";
  }
  return message;
}

// ============================================================
// Section text settings
// ============================================================
function readSectionForm(formData: FormData) {
  return {
    eyebrow: formData.get("eyebrow") ?? "",
    meta_accent: formData.get("meta_accent") ?? "",
    meta_value: formData.get("meta_value") ?? "",
    foot: formData.get("foot") ?? "",
    nda_count: formData.get("nda_count") ?? "0",
    nda_label: formData.get("nda_label") ?? "",
  };
}

export async function updateClientSectionAction(
  _prev: ClientSectionFormState,
  formData: FormData,
): Promise<ClientSectionFormState> {
  await requireRole(["admin", "editor"]);

  const parsed = clientSectionSchema.safeParse(readSectionForm(formData));
  if (!parsed.success) return formatClientSectionError(parsed.error);

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("client_section").upsert({
    id: true,
    ...parsed.data,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: bucketHint(error.message) };

  revalidatePath("/");
  revalidatePath("/admin/clients");
  redirect("/admin/clients?updated=section");
}

// ============================================================
// Partners
// ============================================================
function readPartnerForm(formData: FormData) {
  return {
    name: formData.get("name") ?? "",
    caption: formData.get("caption") ?? "",
    logo_url: formData.get("logo_url") ?? "",
    role: formData.get("role") ?? "grid",
    sort_order: formData.get("sort_order") ?? "0",
    is_active: formData.get("is_active") || false,
  };
}

async function demoteOtherAnchors(adminClient: ReturnType<typeof getSupabaseAdmin>, exceptId?: string) {
  // Single-active-anchor invariant is enforced at the DB by a partial unique
  // index. We mirror that here so the upsert doesn't blow up: any existing
  // active anchor that's NOT this row gets demoted to 'grid'.
  let query = adminClient.from("client_partners").update({ role: "grid" }).eq("role", "anchor").eq("is_active", true);
  if (exceptId) query = query.neq("id", exceptId);
  const { error } = await query;
  if (error) throw new Error(error.message);
}

export async function createClientPartnerAction(
  _prev: ClientPartnerFormState,
  formData: FormData,
): Promise<ClientPartnerFormState> {
  await requireRole(["admin", "editor"]);

  const parsed = clientPartnerSchema.safeParse(readPartnerForm(formData));
  if (!parsed.success) return formatClientPartnerError(parsed.error);

  const file = formData.get("logo_file") as File | null;
  const hasFile = Boolean(file && file.size > 0);

  // Require at least one logo source
  if (!parsed.data.logo_url && !hasFile) {
    return {
      error: "Logo: Upload a file or enter a URL.",
      fieldErrors: { logo_url: ["Required when no file is uploaded"] },
    };
  }

  let logo_url = parsed.data.logo_url;
  try {
    if (hasFile) {
      const uploaded = await uploadLogo(file!);
      if (uploaded) logo_url = uploaded;
    }
  } catch (err) {
    return { error: err instanceof Error ? bucketHint(err.message) : "Logo upload failed" };
  }

  const admin = getSupabaseAdmin();
  if (parsed.data.role === "anchor" && parsed.data.is_active) {
    try {
      await demoteOtherAnchors(admin);
    } catch (err) {
      return { error: err instanceof Error ? bucketHint(err.message) : "Could not demote existing anchor" };
    }
  }

  const { error } = await admin.from("client_partners").insert({ ...parsed.data, logo_url });
  if (error) return { error: bucketHint(error.message) };

  revalidatePath("/");
  revalidatePath("/admin/clients");
  redirect("/admin/clients?updated=created");
}

export async function updateClientPartnerAction(
  _prev: ClientPartnerFormState,
  formData: FormData,
): Promise<ClientPartnerFormState> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  if (!id) return { error: "Missing partner id" };

  const parsed = clientPartnerSchema.safeParse(readPartnerForm(formData));
  if (!parsed.success) return formatClientPartnerError(parsed.error);

  const file = formData.get("logo_file") as File | null;
  const hasFile = Boolean(file && file.size > 0);

  // Require at least one logo source
  if (!parsed.data.logo_url && !hasFile) {
    return {
      error: "Logo: Upload a file or enter a URL.",
      fieldErrors: { logo_url: ["Required when no file is uploaded"] },
    };
  }

  let logo_url = parsed.data.logo_url;
  try {
    if (hasFile) {
      const uploaded = await uploadLogo(file!);
      if (uploaded) logo_url = uploaded;
    }
  } catch (err) {
    return { error: err instanceof Error ? bucketHint(err.message) : "Logo upload failed" };
  }

  const admin = getSupabaseAdmin();
  if (parsed.data.role === "anchor" && parsed.data.is_active) {
    try {
      await demoteOtherAnchors(admin, id);
    } catch (err) {
      return { error: err instanceof Error ? bucketHint(err.message) : "Could not demote existing anchor" };
    }
  }

  const { error } = await admin.from("client_partners").update({ ...parsed.data, logo_url }).eq("id", id);
  if (error) return { error: bucketHint(error.message) };

  revalidatePath("/");
  revalidatePath("/admin/clients");
  redirect("/admin/clients?updated=updated");
}

export async function deleteClientPartnerAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing partner id");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("client_partners").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/clients");
}

export async function toggleClientPartnerActiveAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  const next = formData.get("next") === "on";
  if (!id) throw new Error("Missing partner id");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("client_partners").update({ is_active: next }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/clients");
}

export async function reorderClientPartnerAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  const direction = formData.get("direction") === "up" ? -1 : 1;
  if (!id) throw new Error("Missing partner id");

  const admin = getSupabaseAdmin();
  const { data: current, error: readErr } = await admin
    .from("client_partners")
    .select("id, role, sort_order")
    .eq("id", id)
    .maybeSingle();
  if (readErr || !current) throw new Error(readErr?.message ?? "Partner not found");

  // Find the neighbor in the same role bucket whose sort_order is just above
  // or below this one (depending on direction), and swap.
  const order = direction === -1 ? { ascending: false } : { ascending: true };
  const op = direction === -1 ? "lt" : "gt";
  const { data: neighbors, error: neighErr } = await admin
    .from("client_partners")
    .select("id, sort_order")
    .eq("role", current.role)
    [op]("sort_order", current.sort_order)
    .order("sort_order", order)
    .limit(1);
  if (neighErr) throw new Error(neighErr.message);

  const neighbor = neighbors?.[0];
  if (!neighbor) return; // already at the edge

  const { error: swapAErr } = await admin
    .from("client_partners")
    .update({ sort_order: neighbor.sort_order })
    .eq("id", current.id);
  if (swapAErr) throw new Error(swapAErr.message);

  const { error: swapBErr } = await admin
    .from("client_partners")
    .update({ sort_order: current.sort_order })
    .eq("id", neighbor.id);
  if (swapBErr) throw new Error(swapBErr.message);

  revalidatePath("/");
  revalidatePath("/admin/clients");
}
