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

  const [appsRes, jobsRes] = await Promise.all([
    admin
      .from("applications")
      .select("id, job_id, name, email, phone, status, score, cover_note, portfolio_url, linkedin_url, custom_answers, created_at")
      .order("created_at", { ascending: false })
      .limit(10000),
    admin
      .from("jobs")
      .select("id, title, type"),
  ]);

  if (appsRes.error) return new NextResponse(appsRes.error.message, { status: 500 });

  const jobMap = new Map<string, { title: string; type: string }>(
    (jobsRes.data ?? []).map((j) => [j.id, { title: j.title, type: j.type }]),
  );

  const rows = (appsRes.data ?? []).map((a) => {
    const job = jobMap.get(a.job_id);
    return {
      id: a.id,
      name: a.name,
      email: a.email,
      phone: a.phone ?? "",
      job_title: job?.title ?? a.job_id,
      job_type: job?.type ?? "",
      status: a.status,
      score: a.score ?? "",
      portfolio_url: a.portfolio_url ?? "",
      linkedin_url: a.linkedin_url ?? "",
      cover_note: a.cover_note ?? "",
      custom_answers: a.custom_answers ? JSON.stringify(a.custom_answers) : "",
      created_at: a.created_at,
    };
  });

  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(toCsv(rows), `applications-${date}.csv`);
}
