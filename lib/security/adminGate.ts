/**
 * Admin gate — makes /admin invisible to anyone who doesn't hold the key.
 *
 * Knowing the path to a login form is half of a brute-force attempt: the
 * scanners that sweep the internet for /admin, /wp-admin, /administrator find
 * a real page, learn the stack from it, and start guessing. This layer answers
 * those probes with a 404 instead, so the admin does not appear to exist at
 * all unless the visitor has already proven they know the secret.
 *
 * It is a lock on the door, not the door itself — Supabase auth and the role
 * checks still stand behind it. What it removes is the free reconnaissance.
 *
 * Flow
 * ────
 *   1. Staff open  https://sadeem.agency/admin?k=<ADMIN_GATE_SECRET>  once.
 *   2. Middleware verifies the key, drops an HttpOnly cookie (30 days), and
 *      redirects to the clean URL so the secret never lingers in the address
 *      bar, browser history, or a screen share.
 *   3. Every later visit passes on the cookie alone.
 *
 * Rotating the secret in Vercel invalidates every cookie at once — that is the
 * "revoke everyone" switch if a laptop goes missing.
 *
 * Unset ADMIN_GATE_SECRET and the gate disappears entirely, which is what
 * local development and the e2e suite run with.
 *
 * Edge-runtime safe: Web Crypto only, no node:crypto.
 */

export const ADMIN_GATE_COOKIE = "sdm_gate";
export const ADMIN_GATE_PARAM = "k";
export const ADMIN_GATE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * The cookie carries a hash of the secret, never the secret itself, so a stolen
 * cookie cannot be turned back into the key that mints new ones.
 */
export async function gateCookieValue(secret: string): Promise<string> {
  const bytes = new TextEncoder().encode(`sdm-admin-gate:v1:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Length-independent comparison, so a mismatch costs the same time as a match. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Paths the gate covers: the admin UI and the admin-only API surface. */
export function isGatedPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin");
}
