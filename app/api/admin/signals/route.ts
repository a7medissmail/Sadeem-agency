import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { loadAdminSignals } from "@/lib/admin/signals";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["admin", "editor"] as const;

/** GET /api/admin/signals — polled by AdminCommandCenter every 30 s */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return new NextResponse("Unauthorized", { status: 401 });
  // The feed carries lead names, booking emails and applicant names. Matching
  // the export routes: staff only, not merely "signed in".
  if (!ALLOWED_ROLES.includes(profile.role as (typeof ALLOWED_ROLES)[number])) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const signals = await loadAdminSignals();
  return NextResponse.json(signals, {
    headers: {
      // Don't cache — we want fresh data every poll
      "Cache-Control": "no-store",
    },
  });
}
