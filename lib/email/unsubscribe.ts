import "server-only";
import crypto from "crypto";

function secret() {
  return process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "sadeem-dev-unsubscribe";
}

export function unsubscribeToken(leadId: string) {
  return crypto.createHmac("sha256", secret()).update(leadId).digest("hex");
}

export function verifyUnsubscribeToken(leadId: string, token: string) {
  const expected = unsubscribeToken(leadId);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

export function unsubscribeUrl(leadId: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const url = new URL("/api/email/unsubscribe", base);
  url.searchParams.set("id", leadId);
  url.searchParams.set("token", unsubscribeToken(leadId));
  return url.toString();
}
