import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { toCsv, csvResponse } from "@/lib/export/csv";

const ALLOWED_ROLES = ["admin", "editor"] as const;

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return new NextResponse("Unauthorized", { status: 401 });
  if (!ALLOWED_ROLES.includes(profile.role as (typeof ALLOWED_ROLES)[number])) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("leads")
    .select("id, name, email, phone, company, source, status, owner_id, created_at, message, marketing_unsubscribed_at")
    .order("created_at", { ascending: false })
    .limit(10000);

  if (error) return new NextResponse(error.message, { status: 500 });

  const rows = (data ?? []).map((lead) => ({
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone ?? "",
    company: lead.company ?? "",
    source: lead.source ?? "",
    status: lead.status,
    owner_id: lead.owner_id ?? "",
    message: lead.message ?? "",
    marketing_unsubscribed: lead.marketing_unsubscribed_at ? "yes" : "no",
    created_at: lead.created_at,
  }));

  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(toCsv(rows), `leads-${date}.csv`);
}
