"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createBookingIcs } from "@/lib/calendar/ics";
import { bookingConfirmation, bookingNotification } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/resend";
import { bookingTimeZone } from "@/lib/google/calendar";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { availabilityRuleSchema, bookingDetailsSchema, bookingStatuses } from "@/lib/validation/booking";
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

function slotLabel(start: string) {
  return new Intl.DateTimeFormat("en", {
    timeZone: bookingTimeZone(),
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(start));
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

export async function updateBookingDetailsAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing booking id");

  const parsed = bookingDetailsSchema.safeParse({
    meet_link: formData.get("meet_link"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid booking details");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("bookings").update(parsed.data).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/bookings");
}

export async function sendBookingDetailsAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "editor"]);
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing booking id");

  const admin = getSupabaseAdmin();
  const { data: booking, error } = await admin
    .from("bookings")
    .select("id, name, email, phone, topic, slot_start, slot_end, meet_link")
    .eq("id", id)
    .single();

  if (error || !booking) throw new Error(error?.message ?? "Booking not found");

  const label = slotLabel(booking.slot_start);
  const meetLink = booking.meet_link;
  const ics = createBookingIcs({
    uid: booking.id,
    start: booking.slot_start,
    end: booking.slot_end,
    summary: "SADEEM Consultation",
    description: [booking.topic, meetLink ? `Meeting link: ${meetLink}` : ""].filter(Boolean).join("\n\n"),
    location: meetLink || "Meeting link to follow",
  });

  const attachment = {
    filename: "sadeem-consultation.ics",
    content: Buffer.from(ics).toString("base64"),
    contentType: "text/calendar; charset=utf-8; method=REQUEST",
  };
  const team = process.env.TEAM_NOTIFY_TO;
  const confirmation = bookingConfirmation({ name: booking.name, slotLabel: label, meetLink });
  const notification = bookingNotification({
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    topic: booking.topic,
    slotLabel: label,
    meetLink,
  });

  await Promise.allSettled([
    sendEmail({
      to: booking.email,
      subject: confirmation.subject,
      html: confirmation.html,
      replyTo: team,
      attachments: [attachment],
    }),
    team
      ? sendEmail({
          to: team,
          subject: notification.subject,
          html: notification.html,
          replyTo: booking.email,
          attachments: [attachment],
        })
      : Promise.resolve(),
  ]);

  revalidatePath("/admin/bookings");
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
