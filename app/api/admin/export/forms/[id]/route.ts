import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { toCsv, csvResponse } from "@/lib/export/csv";

const ALLOWED_ROLES = ["admin", "editor", "viewer"] as const;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getCurrentProfile();
  if (!profile) return new NextResponse("Unauthorized", { status: 401 });
  if (!ALLOWED_ROLES.includes(profile.role as (typeof ALLOWED_ROLES)[number])) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { id: formId } = await params;
  const admin = getSupabaseAdmin();

  const [formRes, fieldsRes, subsRes] = await Promise.all([
    admin.from("forms").select("name, slug").eq("id", formId).maybeSingle(),
    admin
      .from("form_fields")
      .select("field_key, label, sort_order")
      .eq("form_id", formId)
      .order("sort_order", { ascending: true }),
    admin
      .from("form_submissions")
      .select("id, respondent_name, respondent_email, status, created_at, answers:form_answers(field_key, value)")
      .eq("form_id", formId)
      .order("created_at", { ascending: false })
      .limit(10000),
  ]);

  if (formRes.error) return new NextResponse(formRes.error.message, { status: 500 });
  if (fieldsRes.error) return new NextResponse(fieldsRes.error.message, { status: 500 });
  if (subsRes.error) return new NextResponse(subsRes.error.message, { status: 500 });

  const fields = fieldsRes.data ?? [];

  type RawAnswer = { field_key: string; value: unknown };
  type RawSub = {
    id: string;
    respondent_name: string | null;
    respondent_email: string | null;
    status: string;
    created_at: string;
    answers: RawAnswer[];
  };

  const rows = ((subsRes.data ?? []) as unknown as RawSub[]).map((s) => {
    const answerMap = Object.fromEntries(
      (s.answers ?? []).map((a) => [
        a.field_key,
        Array.isArray(a.value) ? (a.value as unknown[]).join(", ") : a.value,
      ]),
    );

    const base: Record<string, unknown> = {
      id: s.id,
      respondent_name: s.respondent_name ?? "",
      respondent_email: s.respondent_email ?? "",
      status: s.status,
      created_at: s.created_at,
    };

    // One column per form field, using the field label as column header
    for (const field of fields) {
      base[field.label] = answerMap[field.field_key] ?? "";
    }

    return base;
  });

  const formName = formRes.data?.slug ?? formId;
  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(toCsv(rows), `${formName}-responses-${date}.csv`);
}
