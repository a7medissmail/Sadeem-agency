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

/**
 * Semantic email channels.
 * Each maps to a dedicated Resend-verified "from" address via Vercel env vars:
 *
 *   EMAIL_FROM_HELLO   → "SADEEM <hello@sadeem.agency>"   — general contact, bookings
 *   EMAIL_FROM_CAREERS → "SADEEM Careers <careers@sadeem.agency>" — hiring
 *   EMAIL_FROM_BRIEFS  → "SADEEM <briefs@sadeem.agency>"  — proposals, quotations
 *   EMAIL_FROM_NEWS    → "SADEEM <news@sadeem.agency>"    — marketing campaigns
 *
 * Falls back to EMAIL_FROM if a channel-specific var is not set.
 */
export type EmailChannel = "hello" | "careers" | "briefs" | "news";

const CHANNEL_ENV: Record<EmailChannel, string> = {
  hello:   "EMAIL_FROM_HELLO",
  careers: "EMAIL_FROM_CAREERS",
  briefs:  "EMAIL_FROM_BRIEFS",
  news:    "EMAIL_FROM_NEWS",
};

function resolveFrom(channel?: EmailChannel): string | undefined {
  if (channel) {
    const specific = process.env[CHANNEL_ENV[channel]];
    if (specific) return specific;
  }
  return process.env.EMAIL_FROM; // legacy fallback
}

export type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  /** Semantic channel — determines the "from" address. Defaults to EMAIL_FROM. */
  channel?: EmailChannel;
  replyTo?: string;
  attachments?: Attachment[];
};

export async function sendEmail(args: SendArgs) {
  const r = client();
  const from = resolveFrom(args.channel);
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
