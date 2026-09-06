import { NextResponse } from "next/server";
import { can, getSession } from "@/lib/auth";
import { loadAdminSignals } from "@/lib/admin/signals";

export const dynamic = "force-dynamic";

/** GET /api/admin/signals — polled by AdminCommandCenter every 30 s */
export async function GET() {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  // The feed carries lead names, booking emails and applicant names. Matching
  // the export routes: staff only, not merely "signed in".
  if (!can(session, "dashboard:view")) {
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
