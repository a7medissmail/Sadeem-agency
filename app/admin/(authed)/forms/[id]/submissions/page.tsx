import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Database, FormSubmissionStatus } from "@/types/database";
import { SubmissionsBoard, type AnswerRow, type FieldMeta, type SubmissionRow } from "./SubmissionsBoard";

export const dynamic = "force-dynamic";

type FormRow = Database["public"]["Tables"]["forms"]["Row"];
type FieldRow = Database["public"]["Tables"]["form_fields"]["Row"];

// ── Raw shape from Supabase ───────────────────────────────────────────────────

type RawSubmission = {
  id: string;
  form_id: string;
  respondent_name: string | null;
  respondent_email: string | null;
  related_type: string | null;
  related_id: string | null;
  status: FormSubmissionStatus;
  created_at: string;
  answers: { field_key: string; value: unknown }[];
};

// ─────────────────────────────────────────────────────────────────────────────

async function loadData(formId: string) {
  try {
    const admin = getSupabaseAdmin();
    const [formRes, fieldsRes, subsRes] = await Promise.all([
      admin
        .from("forms")
        .select("id, name, slug, purpose, is_active")
        .eq("id", formId)
        .maybeSingle(),
      admin
        .from("form_fields")
        .select("id, field_key, label, type, sort_order")
        .eq("form_id", formId)
        .order("sort_order", { ascending: true }),
      admin
        .from("form_submissions")
        .select("id, form_id, respondent_name, respondent_email, related_type, related_id, status, created_at, answers:form_answers(field_key, value)")
        .eq("form_id", formId)
        .order("created_at", { ascending: false }),
    ]);

    if (formRes.error) throw formRes.error;
    if (fieldsRes.error) throw fieldsRes.error;
    if (subsRes.error) throw subsRes.error;

    const rawSubs = (subsRes.data ?? []) as unknown as RawSubmission[];

    const submissions: SubmissionRow[] = rawSubs.map((s) => ({
      id: s.id,
      form_id: s.form_id,
      respondent_name: s.respondent_name,
      respondent_email: s.respondent_email,
      related_type: s.related_type,
      related_id: s.related_id,
      status: s.status,
      created_at: s.created_at,
      answers: (s.answers ?? []) as AnswerRow[],
    }));

    const fields: FieldMeta[] = ((fieldsRes.data ?? []) as FieldRow[]).map((f) => ({
      field_key: f.field_key,
      label: f.label,
      type: f.type,
    }));

    return { form: formRes.data as FormRow | null, fields, submissions, error: null as string | null };
  } catch (err) {
    return {
      form: null,
      fields: [] as FieldMeta[],
      submissions: [] as SubmissionRow[],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { form } = await loadData(id);
  return { title: `${form?.name ?? "Form"} — Submissions — SADEEM Admin` };
}

export default async function FormSubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "editor", "viewer"]);
  const { id } = await params;
  const { form, fields, submissions, error } = await loadData(id);

  if (!form && !error) notFound();

  const newCount = submissions.filter((s) => s.status === "new").length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="FORMS"
        title={form ? `${form.name} — Responses` : "Responses"}
        description={`${submissions.length} submission${submissions.length !== 1 ? "s" : ""} collected${newCount > 0 ? ` · ${newCount} unreviewed` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <a
              href={`/api/admin/export/forms/${id}`}
              className="inline-flex items-center justify-center gap-2.5 font-mono uppercase tracking-[0.22em] transition-colors border border-[var(--admin-accent)] text-[var(--admin-accent)] hover:bg-[var(--admin-accent-soft)] px-3 py-1.5 text-[10px]"
            >
              Export CSV
            </a>
            <Link href={`/admin/forms/${id}`}>
              <Button variant="outline" size="sm">Edit form</Button>
            </Link>
            {form?.is_active ? (
              <Link href={`/forms/${form.slug}`} target="_blank">
                <Button variant="ghost" size="sm">Live form ↗</Button>
              </Link>
            ) : null}
          </div>
        }
      />

      {error ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200">
          Couldn&apos;t load submissions: <code>{error}</code>
        </div>
      ) : null}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            { label: "Total", value: submissions.length, tone: "neutral" },
            { label: "New", value: submissions.filter((s) => s.status === "new").length, tone: "blue" },
            { label: "Reviewed", value: submissions.filter((s) => s.status === "reviewed").length, tone: "green" },
            { label: "Converted", value: submissions.filter((s) => s.status === "converted").length, tone: "green" },
          ] as const
        ).map(({ label, value, tone }) => (
          <div key={label} className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">{label}</p>
            <div className="mt-3 flex items-end gap-3">
              <span className="text-[30px] font-semibold leading-none text-[var(--admin-text)]">{value}</span>
              {value > 0 ? <Badge tone={tone as "neutral" | "blue" | "green"}>{label}</Badge> : null}
            </div>
          </div>
        ))}
      </div>

      {/* Board */}
      <SubmissionsBoard submissions={submissions} fields={fields} />
    </div>
  );
}
