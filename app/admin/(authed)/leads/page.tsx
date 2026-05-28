import Link from "next/link";
import { Button } from "@/components/admin/ui/Button";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { LeadsBoard, type LeadBoardRow, type StaffRow } from "./LeadsBoard";

export const metadata = { title: "Leads - SADEEM Admin" };

async function loadData() {
  try {
    const admin = getSupabaseAdmin();
    const [leads, staff] = await Promise.all([
      admin
        .from("leads")
        .select(`
          id, name, email, phone, company, message, source, status,
          owner_id, marketing_unsubscribed_at, created_at,
          notes:lead_notes(id, lead_id, author_id, note, created_at,
            author:profiles!lead_notes_author_id_fkey(full_name))
        `)
        .order("created_at", { ascending: false })
        .limit(300),
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
      error: null as string | null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[admin/leads] load failed:", message);
    return {
      leads: [] as LeadBoardRow[],
      staff: [] as StaffRow[],
      error: message,
    };
  }
}

export default async function LeadsPage() {
  await requireRole(["admin", "editor", "viewer"]);
  const { leads, staff, error } = await loadData();

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

      <LeadsBoard leads={leads} staff={staff} />
    </div>
  );
}
