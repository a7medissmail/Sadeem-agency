// Resend client + send helper.
// Gracefully no-ops when RESEND_API_KEY is missing so server actions still
// succeed (the lead/booking row is what matters; email is best-effort).
import "server-only";
import { Resend, type Attachment } from "resend";

let cached: Resend | null = null;
function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  cached ??= new Resend(key);
  return cached;
}

export type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: Attachment[];
};

export async function sendEmail(args: SendArgs) {
  const r = client();
  const from = process.env.EMAIL_FROM;
  if (!r || !from) {
    console.warn("[resend] skipping send - RESEND_API_KEY or EMAIL_FROM missing");
    return { skipped: true as const };
  }
  try {
    const { data, error } = await r.emails.send({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      replyTo: args.replyTo,
      attachments: args.attachments,
    });
    if (error) {
      console.error("[resend] send error:", error);
      return { error };
    }
    return { id: data?.id };
  } catch (err) {
    console.error("[resend] threw:", err);
    return { error: err };
  }
}
