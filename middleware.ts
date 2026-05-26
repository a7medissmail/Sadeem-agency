import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

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

// ─── Main middleware ──────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
