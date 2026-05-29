/**
 * lib/turnstile.ts
 * ────────────────
 * Server-side Cloudflare Turnstile token verification.
 * Call verifyTurnstile() inside any Server Action before processing the submission.
 */

export async function verifyTurnstile(
  token: string | null | undefined,
): Promise<boolean> {
  if (!token) return false;

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // No secret key configured — fail closed in production, skip in dev
    if (process.env.NODE_ENV !== "production") return true;
    console.error("[turnstile] TURNSTILE_SECRET_KEY is not set");
    return false;
  }

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, response: token }),
        cache: "no-store",
      },
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch (err) {
    console.error("[turnstile] verification error:", err);
    return false;
  }
}
