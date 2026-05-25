"use server";

import { revalidatePath } from "next/cache";
import { getConsultationSlots } from "@/lib/booking/slots";
import { createBookingIcs } from "@/lib/calendar/ics";
import {
  bookingSchema,
  formatBookingValidationError,
  type BookingFieldErrors,
} from "@/lib/validation/booking";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createGoogleCalendarEvent, isGoogleCalendarConfigured, bookingTimeZone } from "@/lib/google/calendar";
import { sendEmail } from "@/lib/email/resend";
import { bookingConfirmation, bookingNotification, getEmailBranding } from "@/lib/email/templates";

export type SubmitBookingState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: BookingFieldErrors }
  | { status: "success"; slotLabel: string; meetLink?: string | null };

function slotLabel(start: string, timeZone: string) {
  return new Intl.DateTimeFormat("en", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(start));
}

function duplicateBookingMessage() {
  return "You already have an upcoming consultation booked. Please reply to the confirmation email if you need to reschedule.";
}

async function cleanupBooking(bookingId: string | null, leadId: string | null) {
  const admin = getSupabaseAdmin();
  if (bookingId) await admin.from("bookings").delete().eq("id", bookingId);
  if (leadId) await admin.from("leads").delete().eq("id", leadId);
}

export async function submitBookingAction(
  _prev: SubmitBookingState,
  formData: FormData,
): Promise<SubmitBookingState> {
  if ((formData.get("website") as string)?.length) return { status: "success", slotLabel: "" };

  const parsed = bookingSchema.safeParse({
    slot_start: formData.get("slot_start"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    topic: formData.get("topic") ?? "",
    website: (formData.get("website") as string) ?? "",
  });

  if (!parsed.success) {
    const formatted = formatBookingValidationError(parsed.error);
    return { status: "error", message: formatted.error, fieldErrors: formatted.fieldErrors };
  }

  const available = await getConsultationSlots(21);
  const chosenSlot = available.slots.find((slot) => slot.start === parsed.data.slot_start);
  if (!chosenSlot) {
    return {
      status: "error",
      message: "That time is no longer available. Please choose another slot.",
      fieldErrors: { slot_start: ["Choose another available time"] },
    };
  }

  const admin = getSupabaseAdmin();
  const { name, email, phone, topic } = parsed.data;
  const now = new Date().toISOString();

  const { data: existingBooking, error: existingBookingError } = await admin
    .from("bookings")
    .select("slot_start")
    .ilike("email", email)
    .eq("status", "scheduled")
    .gt("slot_end", now)
    .limit(1)
    .maybeSingle();

  if (existingBookingError) {
    console.error("[booking] duplicate check failed:", existingBookingError);
    return { status: "error", message: "Could not validate your booking. Please try again." };
  }

  if (existingBooking) {
    return {
      status: "error",
      message: duplicateBookingMessage(),
      fieldErrors: { email: ["This email already has an upcoming consultation"] },
    };
  }

  const { data: lead, error: leadError } = await admin
    .from("leads")
    .insert({
      name,
      email,
      phone,
      company: null,
      message: topic,
      source: "consultation",
      owner_id: null,
    })
    .select("id")
    .single();

  if (leadError || !lead) {
    return { status: "error", message: "Could not save your request. Please try again." };
  }

  const { data: booking, error: bookingError } = await admin
    .from("bookings")
    .insert({
      lead_id: lead.id,
      name,
      email,
      phone,
      topic,
      slot_start: chosenSlot.start,
      slot_end: chosenSlot.end,
      google_event_id: null,
      meet_link: null,
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    await cleanupBooking(null, lead.id);
    const duplicateEmail = bookingError?.message?.includes("scheduled booking already exists");
    return {
      status: "error",
      message: duplicateEmail
        ? duplicateBookingMessage()
        : bookingError?.message?.includes("duplicate")
        ? "That time was just booked. Please choose another slot."
        : "Could not reserve that time. Please try again.",
      fieldErrors: duplicateEmail ? { email: ["This email already has an upcoming consultation"] } : undefined,
    };
  }

  let meetLink: string | null = null;
  let googleEventId: string | null = null;

  try {
    const calendarEvent = await createGoogleCalendarEvent({
      summary: `SADEEM Consultation - ${name}`,
      description: `Topic:\n${topic}\n\nContact:\n${name}\n${email}${phone ? `\n${phone}` : ""}`,
      start: chosenSlot.start,
      end: chosenSlot.end,
      timeZone: bookingTimeZone(),
      attendees: [email, process.env.TEAM_NOTIFY_TO ?? ""],
    });
    meetLink = calendarEvent?.meetLink ?? null;
    googleEventId = calendarEvent?.id ?? null;
  } catch (err) {
    if (isGoogleCalendarConfigured()) {
      console.error("[booking] google calendar failed:", err);
      await cleanupBooking(booking.id, lead.id);
      return { status: "error", message: "Calendar is unavailable right now. Please try another time shortly." };
    }
  }

  if (googleEventId || meetLink) {
    await admin
      .from("bookings")
      .update({ google_event_id: googleEventId, meet_link: meetLink })
      .eq("id", booking.id);
  }

  const label = slotLabel(chosenSlot.start, available.timeZone);
  const ics = createBookingIcs({
    uid: booking.id,
    start: chosenSlot.start,
    end: chosenSlot.end,
    summary: "SADEEM Consultation",
    description: [topic, meetLink ? `Meet: ${meetLink}` : ""].filter(Boolean).join("\n\n"),
    location: meetLink || "Meeting link to follow",
  });
  const attachment = {
    filename: "sadeem-consultation.ics",
    content: Buffer.from(ics).toString("base64"),
    contentType: "text/calendar; charset=utf-8; method=REQUEST",
  };
  const team = process.env.TEAM_NOTIFY_TO;
  const brand = await getEmailBranding();
  const confirmation = bookingConfirmation({ name, slotLabel: label, meetLink, brand });
  const notification = bookingNotification({ name, email, phone, topic, slotLabel: label, meetLink, brand });

  await Promise.allSettled([
    sendEmail({
      to: email,
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
          replyTo: email,
          attachments: [attachment],
        })
      : Promise.resolve(),
  ]);

  revalidatePath("/admin/bookings");
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  revalidatePath("/consultation");

  return { status: "success", slotLabel: label, meetLink };
}
