import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { loadAdminSignals } from "@/lib/admin/signals";

export const dynamic = "force-dynamic";

/** GET /api/admin/signals — polled by AdminCommandCenter every 30 s */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return new NextResponse("Unauthorized", { status: 401 });

  const signals = await loadAdminSignals();
  return NextResponse.json(signals, {
    headers: {
      // Don't cache — we want fresh data every poll
      "Cache-Control": "no-store",
    },
  });
}
