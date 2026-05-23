import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { TableShell, TableHeader, TableRow, EmptyState } from "@/components/admin/ui/Table";
import { Badge } from "@/components/admin/ui/Badge";
import { Select } from "@/components/admin/ui/Field";
import { Button } from "@/components/admin/ui/Button";
import { updateLeadStatusAction, assignLeadOwnerAction, deleteLeadAction } from "./actions";
import type { Database } from "@/types/database";

export const metadata = { title: "Leads — SADEEM Admin" };

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type Status = Lead["status"];
type Source = Lead["source"];

const STATUS_TONES: Record<Status, "blue" | "amber" | "violet" | "green" | "red"> = {
  new: "blue",
  contacted: "amber",
  qualified: "violet",
  won: "green",
  lost: "red",
};

const STATUSES: Status[] = ["new", "contacted", "qualified", "won", "lost"];
const SOURCES: Source[] = ["homepage", "course", "consultation", "other"];

type StaffRow = { id: string; full_name: string | null; role: "admin" | "editor" | "viewer" };

async function loadData(filters: { status?: Status; source?: Source }) {
  const admin = getSupabaseAdmin();
  let q = admin
    .from("leads")
    .select("id, name, email, phone, company, message, source, status, owner_id, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.source) q = q.eq("source", filters.source);
  const { data: leads, error } = await q;
  if (error) throw new Error(error.message);

  const { data: staff } = await admin
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["admin", "editor"]);

  return { leads: leads ?? [], staff: (staff ?? []) as StaffRow[] };
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { status?: string; source?: string };
}) {
  await requireRole(["admin", "editor", "viewer"]);
  const status = STATUSES.includes(searchParams.status as Status) ? (searchParams.status as Status) : undefined;
  const source = SOURCES.includes(searchParams.source as Source) ? (searchParams.source as Source) : undefined;
  const { leads, staff } = await loadData({ status, source });

  const staffById = new Map(staff.map((s) => [s.id, s.full_name || "Unnamed"]));
  const fmt = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="CRM"
        title="Leads"
        description="Inbound messages from the site. Triage with status, assign an owner, follow up."
      />

      <form className="flex flex-wrap items-end gap-3 border border-white/10 rounded-xl bg-white/[0.02] px-5 py-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/55">Status</span>
          <Select name="status" defaultValue={status ?? ""}>
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/55">Source</span>
          <Select name="source" defaultValue={source ?? ""}>
            <option value="">All</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </label>
        <Button type="submit" variant="outline" size="sm">Apply</Button>
        {status || source ? (
          <Link
            href="/admin/leads"
            className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/45 hover:text-white"
          >
            Clear
          </Link>
        ) : null}
        <div className="ml-auto font-mono text-[10.5px] tracking-[0.22em] uppercase text-white/45">
          {leads.length} {leads.length === 1 ? "lead" : "leads"}
        </div>
      </form>

      <TableShell>
        <TableHeader>
          <div style={{ gridTemplateColumns: "1.5fr 1.6fr 0.8fr 1fr 1fr 1fr 0.5fr" }} className="grid gap-4 contents">
            <div>Name</div>
            <div>Email · Company</div>
            <div>Source</div>
            <div>Status</div>
            <div>Owner</div>
            <div>Received</div>
            <div></div>
          </div>
        </TableHeader>

        {leads.length === 0 ? (
          <EmptyState
            title={status || source ? "No leads match that filter." : "No leads yet."}
            hint={status || source ? "Clear the filters to see everything." : "Submissions from the homepage will appear here."}
          />
        ) : (
          leads.map((lead) => (
            <div
              key={lead.id}
              style={{ gridTemplateColumns: "1.5fr 1.6fr 0.8fr 1fr 1fr 1fr 0.5fr" }}
              className="grid gap-4 px-5 py-3 items-center border-b border-white/5 last:border-0 text-[13.5px]"
            >
              <div>
                <div className="text-white/95">{lead.name}</div>
                {lead.phone ? (
                  <div className="font-mono text-[11px] text-white/45 mt-0.5">{lead.phone}</div>
                ) : null}
              </div>
              <div className="min-w-0">
                <a
                  href={`mailto:${lead.email}`}
                  className="text-white/85 hover:text-[#ff6a00] truncate block"
                >
                  {lead.email}
                </a>
                {lead.company ? (
                  <div className="text-white/45 text-[12.5px] truncate">{lead.company}</div>
                ) : null}
              </div>
              <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-white/65">{lead.source}</div>
              <form action={updateLeadStatusAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={lead.id} />
                <Badge tone={STATUS_TONES[lead.status]}>{lead.status}</Badge>
                <Select name="status" defaultValue={lead.status} className="text-[12px] px-2 py-1">
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
                <Button type="submit" variant="ghost" size="sm">Save</Button>
              </form>
              <form action={assignLeadOwnerAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={lead.id} />
                <Select name="owner_id" defaultValue={lead.owner_id ?? ""} className="text-[12px] px-2 py-1">
                  <option value="">Unassigned</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name || "Unnamed"}</option>
                  ))}
                </Select>
                <Button type="submit" variant="ghost" size="sm">Set</Button>
              </form>
              <div className="font-mono text-[11px] text-white/55">
                {fmt.format(new Date(lead.created_at))}
              </div>
              <form action={deleteLeadAction}>
                <input type="hidden" name="id" value={lead.id} />
                <Button type="submit" variant="danger" size="sm">Del</Button>
              </form>
              {lead.message ? (
                <div className="col-span-7 -mt-1 pt-2 border-t border-white/5 text-white/55 text-[13px] whitespace-pre-wrap">
                  {lead.message}
                </div>
              ) : null}
            </div>
          ))
        )}
      </TableShell>
    </div>
  );
}
