import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  ADMIN_GATE_COOKIE,
  ADMIN_GATE_MAX_AGE,
  ADMIN_GATE_PARAM,
  gateCookieValue,
  isGatedPath,
  safeEqual,
} from "@/lib/security/adminGate";

// ─── Maintenance-mode check ───────────────────────────────────────────────────
// The flag is stored in site_settings.is_maintenance_mode.
// We read it via the Supabase REST API using the public anon key
// (migration 0019 grants anon SELECT on site_settings).
//
// Module-level cache: shared within a single edge/worker instance.
// Gives ~30 s of staleness tolerance without hammering the DB.
let maintenanceCache: { on: boolean; expiry: number } | null = null;
const CACHE_TTL_MS = 30_000;

async function isMaintenanceOn(): Promise<boolean> {
  const now = Date.now();
  if (maintenanceCache && now < maintenanceCache.expiry) {
    return maintenanceCache.on;
  }
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) return false;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/site_settings?select=is_maintenance_mode&id=eq.true&limit=1`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      },
    );
    if (!res.ok) return false;
    const data: Array<{ is_maintenance_mode: boolean }> = await res.json();
    const on = data?.[0]?.is_maintenance_mode === true;
    maintenanceCache = { on, expiry: now + CACHE_TTL_MS };
    return on;
  } catch {
    return false; // fail open — never block access if DB unreachable
  }
}

// Paths that are ALWAYS reachable, even in maintenance mode
const MAINTENANCE_PASSTHROUGH = [
  "/maintenance",
  "/admin",
  "/api/",
  "/_next/",
  "/favicon",
  "/p/",   // proposal/brief portal magic links
  "/q/",   // quotation portal magic links
];

// ─── Admin gate ───────────────────────────────────────────────────────────────
// Runs before anything else touching /admin, so an ungated probe is answered
// with a 404 rather than a login page that confirms the path exists.
// See lib/security/adminGate.ts for the full rationale.
async function adminGate(request: NextRequest): Promise<NextResponse | null> {
  const secret = process.env.ADMIN_GATE_SECRET;
  if (!secret) return null; // gate disabled (local dev, e2e)
  if (!isGatedPath(request.nextUrl.pathname)) return null;

  const expected = await gateCookieValue(secret);

  // Unlock: ?k=<secret> — verified, then immediately traded for a cookie so the
  // secret does not survive in the URL bar or history.
  const supplied = request.nextUrl.searchParams.get(ADMIN_GATE_PARAM);
  if (supplied && safeEqual(supplied, secret)) {
    const clean = request.nextUrl.clone();
    clean.searchParams.delete(ADMIN_GATE_PARAM);
    const unlocked = NextResponse.redirect(clean);
    unlocked.cookies.set(ADMIN_GATE_COOKIE, expected, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ADMIN_GATE_MAX_AGE,
    });
    return unlocked;
  }

  const held = request.cookies.get(ADMIN_GATE_COOKIE)?.value;
  if (held && safeEqual(held, expected)) return null;

  // No key, no cookie: as far as this visitor is concerned, nothing is here.
  const nowhere = request.nextUrl.clone();
  nowhere.pathname = "/_gate";
  nowhere.search = "";
  return NextResponse.rewrite(nowhere, { status: 404 });
}

// ─── Main middleware ──────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const gated = await adminGate(request);
  if (gated) return gated;

  const isPassthrough = MAINTENANCE_PASSTHROUGH.some((p) =>
    pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p),
  );

  if (!isPassthrough) {
    const maintenance = await isMaintenanceOn();
    if (maintenance) {
      const url = request.nextUrl.clone();
      url.pathname = "/maintenance";
      return NextResponse.rewrite(url);
    }
  }

  return updateSession(request);
}

export const config = {
  // Match every route except static assets, image optimization, and public hero images.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|hero/|image/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
