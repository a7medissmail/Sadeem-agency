import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ProposalBoard, type FormLite, type ProposalRow, type SubmissionLite } from "./ProposalBoard";

export const metadata = { title: "Proposals - SADEEM Admin" };

// ── Raw shapes returned by Supabase embedded selects ──────────────────────────
type RawProposal = {
  id: string;
  form_id: string | null;
  title: string;
  client_name: string;
  client_email: string;
  client_company: string | null;
  token_prefix: string;
  status: string;
  expires_at: string;
  sent_at: string | null;
  opened_at: string | null;
  submitted_at: string | null;
  created_at: string;
  internal_notes: string | null;
  form: FormLite | FormLite[] | null;
};

type RawSubmission = {
  id: string;
  respondent_name: string | null;
  respondent_email: string | null;
  related_id: string | null;
  created_at: string;
  answers: { field_key: string; value: unknown }[];
};

// ─────────────────────────────────────────────────────────────────────────────

async function loadData() {
  try {
    const admin = getSupabaseAdmin();
    const [proposalsRes, formsRes] = await Promise.all([
      admin
        .from("proposals")
        .select(
          "id, form_id, title, client_name, client_email, client_company, token_prefix, status, expires_at, sent_at, opened_at, submitted_at, created_at, internal_notes, form:forms(id, name, slug)",
        )
        .order("created_at", { ascending: false })
        .limit(200),
      admin
        .from("forms")
        .select("id, name, slug")
        .eq("purpose", "proposal")
        .order("name", { ascending: true }),
    ]);

    if (proposalsRes.error) throw proposalsRes.error;
    if (formsRes.error) throw formsRes.error;

    const rawProposals = (proposalsRes.data ?? []) as unknown as RawProposal[];

    // For submitted proposals, fetch the linked submission + answers
    const submittedIds = rawProposals
      .filter((p) => p.submitted_at)
      .map((p) => p.id);

    const submissionMap = new Map<string, SubmissionLite>();

    if (submittedIds.length > 0) {
      const { data: rawSubs } = await admin
        .from("form_submissions")
        .select(
          "id, respondent_name, respondent_email, related_id, created_at, answers:form_answers(field_key, value)",
        )
        .eq("related_type", "proposal")
        .in("related_id", submittedIds);

      for (const sub of (rawSubs ?? []) as unknown as RawSubmission[]) {
        if (sub.related_id) {
          submissionMap.set(sub.related_id, {
            id: sub.id,
            respondent_name: sub.respondent_name,
            respondent_email: sub.respondent_email,
            created_at: sub.created_at,
            answers: (sub.answers ?? []).map((a) => ({
              field_key: a.field_key,
              value: a.value,
            })),
          });
        }
      }
    }

    const rows: ProposalRow[] = rawProposals.map((p) => ({
      id: p.id,
      form_id: p.form_id,
      title: p.title,
      client_name: p.client_name,
      client_email: p.client_email,
      client_company: p.client_company,
      token_prefix: p.token_prefix,
      status: p.status as ProposalRow["status"],
      expires_at: p.expires_at,
      sent_at: p.sent_at,
      opened_at: p.opened_at,
      submitted_at: p.submitted_at,
      created_at: p.created_at,
      internal_notes: p.internal_notes,
      form: Array.isArray(p.form) ? (p.form[0] ?? null) : (p.form as FormLite | null),
      submission: submissionMap.get(p.id) ?? null,
    }));

    return {
      proposals: rows,
      forms: (formsRes.data ?? []) as FormLite[],
      error: null as string | null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[admin/proposals] load failed:", message);
    return { proposals: [] as ProposalRow[], forms: [] as FormLite[], error: message };
  }
}

export default async function ProposalsPage() {
  await requireRole(["admin", "editor"]);
  const { proposals, forms, error } = await loadData();

  return (
    <div className="flex flex-col gap-8">
      {error ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200">
          <div className="mb-1 font-semibold">Couldn&apos;t load proposals.</div>
          <div className="text-amber-200/80">
            Run migration <code className="text-amber-100">0021_proposals.sql</code> first, then reload.
          </div>
        </div>
      ) : null}

      <PageHeader
        eyebrow="BRIEFS"
        title="Proposals"
        description="Create private client briefs with a magic link. Clients fill the form on a branded portal — you see submissions instantly."
      />

      <ProposalBoard proposals={proposals} forms={forms} />
    </div>
  );
}
