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

  // Fetch proposals with their latest non-superseded quotation totals
  const [propsRes, quotesRes] = await Promise.all([
    admin
      .from("proposals")
      .select("id, title, client_name, client_email, client_company, status, expires_at, sent_at, opened_at, submitted_at, created_at")
      .order("created_at", { ascending: false })
      .limit(5000),
    admin
      .from("quotations")
      .select("proposal_id, currency, subtotal, total, status")
      .not("status", "eq", "superseded")
      .order("created_at", { ascending: false }),
  ]);

  if (propsRes.error) return new NextResponse(propsRes.error.message, { status: 500 });

  // Most recent quotation per proposal
  const quotationMap = new Map<string, { currency: string; subtotal: number; total: number; status: string }>();
  for (const q of quotesRes.data ?? []) {
    if (q.proposal_id && !quotationMap.has(q.proposal_id)) {
      quotationMap.set(q.proposal_id, {
        currency: q.currency,
        subtotal: q.subtotal,
        total: q.total,
        status: q.status,
      });
    }
  }

  const rows = (propsRes.data ?? []).map((p) => {
    const q = quotationMap.get(p.id);
    return {
      id: p.id,
      title: p.title,
      client_name: p.client_name,
      client_email: p.client_email,
      client_company: p.client_company ?? "",
      status: p.status,
      quotation_status: q?.status ?? "",
      currency: q?.currency ?? "",
      subtotal: q?.subtotal ?? "",
      total: q?.total ?? "",
      sent_at: p.sent_at ?? "",
      opened_at: p.opened_at ?? "",
      submitted_at: p.submitted_at ?? "",
      expires_at: p.expires_at,
      created_at: p.created_at,
    };
  });

  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(toCsv(rows), `proposals-${date}.csv`);
}
