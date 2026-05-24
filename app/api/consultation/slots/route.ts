import { NextResponse } from "next/server";
import { getConsultationSlots } from "@/lib/booking/slots";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getConsultationSlots(21);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load slots";
    return NextResponse.json({ error: message, slots: [] }, { status: 500 });
  }
}
