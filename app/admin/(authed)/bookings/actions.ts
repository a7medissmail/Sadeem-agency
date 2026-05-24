"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { availabilityRuleSchema, bookingStatuses } from "@/lib/validation/booking";
import type { BookingStatus } from "@/types/database";

function readRule(formData: FormData) {
  return {
    weekday: formData.get("weekday"),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
    slot_minutes: formData.get("slot_minutes"),
    buffer_minutes: formData.get("buffer_minutes"),
    active: formData.get("active") || false,
  };
}

export async function updateBookingStatusAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  const status = formData.get("status") as BookingStatus;
  if (!id) throw new Error("Missing booking id");
  if (!bookingStatuses.includes(status)) throw new Error("Invalid booking status");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("bookings").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
}

export async function createAvailabilityRuleAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "editor"]);
  const parsed = availabilityRuleSchema.safeParse(readRule(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid availability rule");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("availability_rules").insert(parsed.data);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/bookings");
  revalidatePath("/api/consultation/slots");
}

export async function updateAvailabilityRuleAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing rule id");

  const parsed = availabilityRuleSchema.safeParse(readRule(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid availability rule");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("availability_rules").update(parsed.data).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/bookings");
  revalidatePath("/api/consultation/slots");
}

export async function deleteAvailabilityRuleAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing rule id");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("availability_rules").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/bookings");
  revalidatePath("/api/consultation/slots");
}
