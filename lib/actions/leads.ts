"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { leadSchema, type LeadInput } from "@/lib/validation/lead";
import { sendEmail } from "@/lib/email/resend";
import { leadConfirmation, leadNotification } from "@/lib/email/templates";

export type SubmitLeadState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

function fieldError(parsed: ReturnType<typeof leadSchema.safeParse>): string {
  if (parsed.success) return "Invalid input";
  return parsed.error.issues[0]?.message ?? "Invalid input";
}

export async function submitLeadAction(
  _prev: SubmitLeadState,
  formData: FormData,
): Promise<SubmitLeadState> {
  // honeypot: bots fill hidden "website" field; humans don't.
  if ((formData.get("website") as string)?.length) {
    return { status: "success" };
  }

  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    company: formData.get("company") ?? "",
    message: formData.get("message") ?? "",
    source: (formData.get("source") as LeadInput["source"]) ?? "homepage",
    website: (formData.get("website") as string) ?? "",
  });
  if (!parsed.success) return { status: "error", message: fieldError(parsed) };

  const { name, email, phone, company, source } = parsed.data;
  const context = String(formData.get("context") ?? "").trim();
  const message = [context, parsed.data.message].filter(Boolean).join("\n\n") || null;

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("leads").insert({
    name,
    email,
    phone: phone || null,
    company: company || null,
    message,
    source,
    owner_id: null,
  });
  if (error) {
    console.error("[submitLead] insert error:", error);
    return { status: "error", message: "Could not save your message. Please try again." };
  }

  // Best-effort emails — never block success.
  const team = process.env.TEAM_NOTIFY_TO;
  const confirmation = leadConfirmation({ name });
  const notification = leadNotification({ name, email, phone, company, message, source });

  await Promise.allSettled([
    sendEmail({ to: email, subject: confirmation.subject, html: confirmation.html, replyTo: team }),
    team
      ? sendEmail({ to: team, subject: notification.subject, html: notification.html, replyTo: email })
      : Promise.resolve(),
  ]);

  return { status: "success" };
}
