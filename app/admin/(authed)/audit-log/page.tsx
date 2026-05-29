import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit Log - SADEEM Admin" };

const dateFmt = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const actionColors: Record<string, string> = {
  delete: "text-[var(--admin-danger)]",
  update: "text-[var(--admin-accent)]",
};

export default async function AuditLogPage() {
  const admin = getSupabaseAdmin();
  const { data: entries, error } = await admin
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--admin-accent)]">SYSTEM</p>
        <h1 className="mt-2 text-[32px] font-semibold tracking-tight">Audit Log</h1>
        <p className="mt-2 text-[14.5px] text-[var(--admin-muted)]">
          Last 100 destructive actions — who deleted or changed what.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200">
          {error.message}. Run migration 0027_audit_log.sql in Supabase first.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)]">
        {!entries?.length ? (
          <p className="px-6 py-10 text-center text-[13px] text-[var(--admin-subtle)]">
            No audit entries yet. They appear here after the first delete or role change.
          </p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--admin-border)] bg-[var(--admin-panel-hover)]">
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">When</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">Actor</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">Action</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">Table</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">Record</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">Detail</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-[var(--admin-border-soft)] last:border-0 hover:bg-[var(--admin-panel-hover)]"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-[var(--admin-subtle)]">
                    {dateFmt.format(new Date(entry.created_at))}
                  </td>
                  <td className="px-4 py-3 text-[var(--admin-text)]">
                    {entry.actor_name ?? <span className="text-[var(--admin-subtle)]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-[11px] uppercase tracking-[0.14em] ${actionColors[entry.action] ?? "text-[var(--admin-muted)]"}`}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[var(--admin-muted)]">{entry.table_name}</td>
                  <td className="max-w-[120px] truncate px-4 py-3 font-mono text-[11px] text-[var(--admin-subtle)]">
                    {entry.record_id}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[var(--admin-subtle)]">
                    {entry.meta ? JSON.stringify(entry.meta) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
