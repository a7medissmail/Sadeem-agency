import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { toCsv, csvResponse } from "@/lib/export/csv";

const ALLOWED_ROLES = ["admin", "editor", "viewer"] as const;

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return new NextResponse("Unauthorized", { status: 401 });
  if (!ALLOWED_ROLES.includes(profile.role as (typeof ALLOWED_ROLES)[number])) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("bookings")
    .select("id, name, email, phone, topic, slot_start, slot_end, status, meet_link, google_event_id, created_at")
    .order("slot_start", { ascending: false })
    .limit(10000);

  if (error) return new NextResponse(error.message, { status: 500 });

  const rows = (data ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    email: b.email,
    phone: b.phone ?? "",
    topic: b.topic,
    slot_start: b.slot_start,
    slot_end: b.slot_end,
    status: b.status,
    meet_link: b.meet_link ?? "",
    google_event_id: b.google_event_id ?? "",
    created_at: b.created_at,
  }));

  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(toCsv(rows), `bookings-${date}.csv`);
}
