import Link from "next/link";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import { deleteFormAction } from "./actions";

export const metadata = { title: "Forms - SADEEM Admin" };

type FormRow = Database["public"]["Tables"]["forms"]["Row"];

async function loadForms() {
  try {
    const admin = getSupabaseAdmin();
    const { data: forms, error } = await admin
      .from("forms")
      .select("id, slug, name, purpose, description, submit_label, success_message, is_active, created_by, created_at, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw error;

    const ids = (forms ?? []).map((form) => form.id);
    const fieldCount = new Map<string, number>();
    const submissionCount = new Map<string, number>();

    if (ids.length > 0) {
      const [fields, submissions] = await Promise.all([
        admin.from("form_fields").select("form_id").in("form_id", ids),
        admin.from("form_submissions").select("form_id").in("form_id", ids),
      ]);
      if (fields.error) throw fields.error;
      if (submissions.error) throw submissions.error;
      for (const field of fields.data ?? []) fieldCount.set(field.form_id, (fieldCount.get(field.form_id) ?? 0) + 1);
      for (const submission of submissions.data ?? []) {
        if (submission.form_id) {
          submissionCount.set(submission.form_id, (submissionCount.get(submission.form_id) ?? 0) + 1);
        }
      }
    }

    return {
      forms: ((forms ?? []) as FormRow[]).map((form) => ({
        ...form,
        fieldCount: fieldCount.get(form.id) ?? 0,
        submissionCount: submissionCount.get(form.id) ?? 0,
      })),
      error: null as string | null,
    };
  } catch (err) {
    return { forms: [], error: err instanceof Error ? err.message : "Unknown error" };
  }
}

function MetricCard({ label, value, hint }: { label: string; value: number | string; hint: string }) {
  return (
    <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">{label}</p>
      <div className="mt-3 text-[30px] font-semibold leading-none text-[var(--admin-text)]">{value}</div>
      <p className="mt-3 text-[12.5px] text-[var(--admin-muted)]">{hint}</p>
    </div>
  );
}

export default async function FormsAdminPage() {
  await requireRole(["admin", "editor", "viewer"]);
  const { forms, error } = await loadForms();
  const activeCount = forms.filter((form) => form.is_active).length;
  const proposalCount = forms.filter((form) => form.purpose === "proposal").length;
  const totalSubmissions = forms.reduce((total, form) => total + form.submissionCount, 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="WORKFLOW"
        title="Forms"
        description="Build controlled fields for hiring, CRM intake, consultations, and private client briefs."
        actions={
          <Link href="/admin/forms/new">
            <Button>New form</Button>
          </Link>
        }
      />

      {error ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200">
          Couldn&apos;t load forms: <code>{error}</code>
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--admin-accent)]">Form OS</p>
          <h2 className="mt-2 max-w-[13ch] text-[34px] font-semibold leading-[1.02] tracking-tight text-[var(--admin-text)]">
            One field language for every workflow.
          </h2>
          <p className="mt-4 max-w-[68ch] text-[14.5px] leading-relaxed text-[var(--admin-muted)]">
            Start with safe field definitions now. Later, the same forms can power job applications, proposal briefs, and client-specific onboarding portals.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Forms" value={forms.length} hint="Definitions" />
          <MetricCard label="Active" value={activeCount} hint="Public-ready" />
          <MetricCard label="Responses" value={totalSubmissions} hint={`${proposalCount} proposal forms`} />
        </div>
      </section>

      {forms.length === 0 ? (
        <div className="border border-dashed border-[var(--admin-border)] bg-[var(--admin-panel)] px-5 py-12 text-center text-[13px] text-[var(--admin-subtle)]">
          No forms yet. Create a controlled intake form.
        </div>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {forms.map((form) => (
            <article key={form.id} className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5 transition-colors hover:border-[var(--admin-accent)]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link href={`/admin/forms/${form.id}`} className="block text-[22px] font-semibold leading-tight text-[var(--admin-text)] hover:text-[var(--admin-accent)]">
                    {form.name}
                  </Link>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">
                    /{form.slug} / {form.purpose}
                  </p>
                </div>
                <Badge tone={form.is_active ? "green" : "neutral"}>{form.is_active ? "Active" : "Draft"}</Badge>
              </div>

              <p className="mt-5 line-clamp-3 min-h-[60px] text-[13.5px] leading-relaxed text-[var(--admin-muted)]">
                {form.description || "No description yet. Add context so the team knows where this form belongs."}
              </p>

              <dl className="mt-6 grid grid-cols-3 border-y border-[var(--admin-border-soft)] py-4 text-[12.5px]">
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">Fields</dt>
                  <dd className="mt-1 text-[var(--admin-text)]">{form.fieldCount}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">Responses</dt>
                  <dd className="mt-1 text-[var(--admin-text)]">{form.submissionCount}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">Button</dt>
                  <dd className="mt-1 truncate text-[var(--admin-text)]">{form.submit_label}</dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Link href={`/admin/forms/${form.id}`}>
                  <Button variant="outline" size="sm">Edit</Button>
                </Link>
                <Link href={`/admin/forms/${form.id}/submissions`}>
                  <Button variant="ghost" size="sm">
                    Responses{form.submissionCount > 0 ? ` (${form.submissionCount})` : ""}
                  </Button>
                </Link>
                <Link href={`/admin/forms/${form.id}/preview`}>
                  <Button variant="ghost" size="sm">Preview</Button>
                </Link>
                {form.is_active ? (
                  <Link href={`/forms/${form.slug}`} target="_blank">
                    <Button variant="ghost" size="sm">Live</Button>
                  </Link>
                ) : null}
                <form action={deleteFormAction}>
                  <input type="hidden" name="id" value={form.id} />
                  <Button type="submit" variant="danger" size="sm">
                    Delete
                  </Button>
                </form>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
