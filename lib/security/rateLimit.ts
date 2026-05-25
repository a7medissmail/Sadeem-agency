// Postgres-backed rate limiter for public server actions.
// Stores attempts in public.submission_attempts (migration 0016) and refuses
// to proceed when (action, key) has too many recent rows.
//
// Key is built from the visitor's IP + the action name so a single IP can hit
// /lead AND /booking independently, but spamming /lead alone is throttled.
//
// Reads the IP from the Next.js request headers (Vercel populates
// x-forwarded-for / x-real-ip / x-vercel-forwarded-for).

import "server-only";
import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type Result =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number; reason: string };

function visitorKey(): string {
  const h = headers();
  const forwarded = h.get("x-forwarded-for") || h.get("x-vercel-forwarded-for");
  const realIp = h.get("x-real-ip");
  const candidate = forwarded?.split(",")[0]?.trim() || realIp?.trim();
  return candidate || "unknown";
}

export type RateLimitOptions = {
  /** Logical action name (e.g. "lead", "application", "booking", "form:abc"). */
  action: string;
  /** Max attempts allowed inside the window before we block. Default 5. */
  max?: number;
  /** Window length in seconds. Default 60. */
  windowSeconds?: number;
  /** Override the key (default = visitor IP). */
  key?: string;
};

/**
 * Counts recent attempts for the key+action and either records a new one (ok)
 * or returns a block with the seconds remaining in the window.
 *
 * On any DB error we fail OPEN (return ok: true) — we never want the rate
 * limiter to break a legitimate submission if the table/DB is unavailable.
 */
export async function checkRateLimit(options: RateLimitOptions): Promise<Result> {
  const { action } = options;
  const max = options.max ?? 5;
  const windowSeconds = options.windowSeconds ?? 60;
  const key = options.key || visitorKey();
  const cutoff = new Date(Date.now() - windowSeconds * 1000).toISOString();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = getSupabaseAdmin() as any;

    const { data: recent, error: countErr } = await admin
      .from("submission_attempts")
      .select("created_at")
      .eq("action", action)
      .eq("key", key)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: true });

    if (countErr) {
      console.warn("[rateLimit] count failed, failing open:", countErr.message);
      return { ok: true };
    }

    const attempts = recent?.length ?? 0;
    if (attempts >= max) {
      const oldestIso = recent?.[0]?.created_at as string | undefined;
      const retryAfterSeconds = oldestIso
        ? Math.max(
            1,
            windowSeconds - Math.floor((Date.now() - new Date(oldestIso).getTime()) / 1000),
          )
        : windowSeconds;
      return {
        ok: false,
        retryAfterSeconds,
        reason: `Too many requests. Please wait ${retryAfterSeconds}s and try again.`,
      };
    }

    const { error: insertErr } = await admin
      .from("submission_attempts")
      .insert({ action, key });
    if (insertErr) {
      console.warn("[rateLimit] insert failed, failing open:", insertErr.message);
    }

    return { ok: true };
  } catch (err) {
    console.warn("[rateLimit] threw, failing open:", err);
    return { ok: true };
  }
}
