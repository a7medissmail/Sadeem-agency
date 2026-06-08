"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { createBookingIcs } from "@/lib/calendar/ics";
import { bookingConfirmation, bookingNotification, proposalInviteClient, getEmailBranding } from "@/lib/email/templates";
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

export async function createBookingAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "editor"]);

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() || null;
  const topic = (formData.get("topic") as string | null)?.trim() ?? "";
  const slotLocalStr = (formData.get("slot_start_local") as string | null)?.trim() ?? "";
  const durationMin = parseInt(formData.get("duration_minutes") as string, 10) || 45;
  const status = (formData.get("status") as BookingStatus | null) ?? "scheduled";
  const meetLink = (formData.get("meet_link") as string | null)?.trim() || null;

  if (!name || name.length < 2) throw new Error("Name is required");
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Valid email is required");
  if (!topic || topic.length < 10) throw new Error("Topic must be at least 10 characters");
  if (!slotLocalStr || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(slotLocalStr)) throw new Error("Select a date and time");

  // Interpret the datetime-local input as Riyadh time (UTC+3), convert to UTC ISO
  const slot_start = new Date(slotLocalStr + ":00+03:00").toISOString();
  const slot_end = new Date(new Date(slot_start).getTime() + durationMin * 60_000).toISOString();

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("bookings").insert({
    name,
    email,
    phone,
    topic,
    slot_start,
    slot_end,
    status,
    meet_link: meetLink,
    lead_id: null,
    google_event_id: null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
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
  const brand = await getEmailBranding();
  const confirmation = bookingConfirmation({ name: booking.name, slotLabel: label, meetLink, brand });
  const notification = bookingNotification({
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    topic: booking.topic,
    slotLabel: label,
    meetLink,
    brand,
  });

  await Promise.allSettled([
    sendEmail({
      channel: "hello",
      to: booking.email,
      subject: confirmation.subject,
      html: confirmation.html,
      replyTo: team,
      attachments: [attachment],
    }),
    team
      ? sendEmail({
          channel: "hello",
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

// ─── Quick Brief from a Booking ───────────────────────────────────────────────

export async function createBriefFromBookingAction(
  bookingId: string,
  formId: string | null,
  days: number,
  emailNow: boolean,
  locale: string = "en",
): Promise<{ rawToken?: string; error?: string }> {
  const profile = await requireRole(["admin", "editor"]);

  const admin = getSupabaseAdmin();
  const { data: booking, error: readError } = await admin
    .from("bookings")
    .select("name, email")
    .eq("id", bookingId)
    .single();

  if (readError || !booking) return { error: readError?.message ?? "Booking not found" };

  const safeDays = Number.isFinite(days) && days > 0 && days <= 365 ? days : 14;
  const expires_at = new Date(Date.now() + safeDays * 86_400_000).toISOString();
  const title = `Brief — ${booking.name}`;

  const raw = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 8);

  const { error: insertError } = await admin.from("proposals").insert({
    form_id: formId,
    title,
    client_name: booking.name,
    client_email: booking.email,
    client_company: null,
    token_hash: hash,
    token_prefix: prefix,
    status: emailNow ? "sent" : "draft",
    expires_at,
    sent_at: emailNow ? new Date().toISOString() : null,
    created_by: profile.id,
    booking_id: bookingId,
    locale: locale === "ar" ? "ar" : "en",
  });

  if (insertError) return { error: insertError.message };

  revalidatePath("/admin/proposals");
  revalidatePath("/admin/bookings");

  if (emailNow) {
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://sadeem.agency").replace(/\/+$/, "");
    const portalUrl = `${baseUrl}/p/${raw}`;
    const expiresDate = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
      new Date(expires_at),
    );

    void (async () => {
      try {
        const brand = await getEmailBranding();
        const { subject, html } = proposalInviteClient({
          clientName: booking.name,
          proposalTitle: title,
          portalUrl,
          expiresDate,
          brand,
          locale,
        });
        await sendEmail({ channel: "briefs", to: booking.email, subject, html });
      } catch (err) {
        console.error("[brief] booking invite email failed:", err);
      }
    })();
  }

  return { rawToken: raw };
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
  const profile = await requireRole(["admin"]);
  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing rule id");

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("availability_rules").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit({ tableName: "availability_rules", recordId: id, action: "delete", actorId: profile.id, actorName: profile.full_name ?? profile.email ?? null });

  revalidatePath("/admin/bookings");
  revalidatePath("/api/consultation/slots");
}
