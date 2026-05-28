import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/admin/ui/Button";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { SearchBar } from "@/components/admin/ui/SearchBar";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { LeadsBoard, type LeadBoardRow, type StaffRow } from "./LeadsBoard";

export const metadata = { title: "Leads - SADEEM Admin" };

/** Cap per server request. Search trims this further. */
const PAGE_CAP = 150;

function sp(val: string | string[] | undefined): string {
  return Array.isArray(val) ? (val[0] ?? "") : (val ?? "");
}

async function loadData(q: string) {
  try {
    const admin = getSupabaseAdmin();

    let leadsQuery = admin
      .from("leads")
      .select(
        `id, name, email, phone, company, message, source, status,
         owner_id, marketing_unsubscribed_at, created_at,
         notes:lead_notes(id, lead_id, author_id, note, created_at,
           author:profiles!lead_notes_author_id_fkey(full_name))`,
      )
      .order("created_at", { ascending: false })
      .limit(PAGE_CAP);

    if (q) {
      // Server-side full-text-style filter across four columns
      leadsQuery = leadsQuery.or(
        `name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%,message.ilike.%${q}%`,
      );
    }

    const [leads, staff] = await Promise.all([
      leadsQuery,
      admin
        .from("profiles")
        .select("id, full_name, role")
        .in("role", ["admin", "editor"])
        .order("full_name", { ascending: true }),
    ]);

    if (leads.error) throw leads.error;
    if (staff.error) throw staff.error;

    return {
      leads: (leads.data ?? []) as LeadBoardRow[],
      staff: (staff.data ?? []) as StaffRow[],
      /** true when exactly PAGE_CAP rows were returned — more rows exist */
      capped: (leads.data?.length ?? 0) >= PAGE_CAP,
      error: null as string | null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[admin/leads] load failed:", message);
    return {
      leads: [] as LeadBoardRow[],
      staff: [] as StaffRow[],
      capped: false,
      error: message,
    };
  }
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await requireRole(["admin", "editor", "viewer"]);
  const q = sp(searchParams.q).trim();
  const { leads, staff, error, capped } = await loadData(q);

  return (
    <div className="flex flex-col gap-8">
      {error ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200">
          <div className="mb-1 font-semibold">Couldn&apos;t load leads.</div>
          <div className="text-amber-200/80">
            Postgres returned: <code className="text-amber-100">{error}</code>. Check the Supabase migrations for this project.
          </div>
        </div>
      ) : null}

      <PageHeader
        eyebrow="CRM"
        title="Leads"
        description="Triage inbound demand, assign owners, and keep every follow-up visible."
        actions={
          <div className="flex items-center gap-2">
            <a
              href="/api/admin/export/leads"
              className="inline-flex items-center justify-center gap-2.5 font-mono uppercase tracking-[0.22em] transition-colors border border-[var(--admin-accent)] text-[var(--admin-accent)] hover:bg-[var(--admin-accent-soft)] px-3 py-1.5 text-[10px]"
            >
              Export CSV
            </a>
            <Link href="/admin/leads/new">
              <Button>New lead</Button>
            </Link>
          </div>
        }
      />

      {/* Server-side search — updates URL, triggers full page re-fetch */}
      <Suspense>
        <SearchBar placeholder="Name, email, company, message…" />
      </Suspense>

      {capped && !q ? (
        <p className="text-[12px] text-[var(--admin-muted)]">
          Showing the {PAGE_CAP} most recent leads.{" "}
          <span className="text-[var(--admin-accent)]">Search above to narrow results.</span>
        </p>
      ) : null}

      <LeadsBoard leads={leads} staff={staff} />
    </div>
  );
}
