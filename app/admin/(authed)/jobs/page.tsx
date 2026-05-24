import Link from "next/link";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { EmptyState, TableShell } from "@/components/admin/ui/Table";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { deleteJobAction, toggleJobOpenAction } from "./actions";

export const metadata = { title: "Careers - SADEEM Admin" };

async function loadJobs() {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("jobs")
      .select("id, slug, title, type, department, location, is_open, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { jobs: data ?? [], error: null as string | null };
  } catch (err) {
    return { jobs: [], error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export default async function JobsAdminPage() {
  await requireRole(["admin", "editor", "viewer"]);
  const { jobs, error } = await loadJobs();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="CAREERS"
        title="Jobs"
        description="Publish roles and internships. Open roles appear publicly and accept applications."
        actions={
          <Link href="/admin/jobs/new">
            <Button>New role</Button>
          </Link>
        }
      />

      {error ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200">
          Couldn&apos;t load jobs: <code>{error}</code>
        </div>
      ) : null}

      <TableShell>
        <div
          style={{ gridTemplateColumns: "1.45fr 0.75fr 0.8fr 0.85fr 0.6fr 0.7fr 0.5fr" }}
          className="grid gap-4 border-b border-white/10 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45"
        >
          <div>Role</div>
          <div>Type</div>
          <div>Department</div>
          <div>Location</div>
          <div>Status</div>
          <div>Toggle</div>
          <div></div>
        </div>

        {jobs.length === 0 ? (
          <EmptyState title="No roles yet." hint="Click 'New role' to publish the first career opening." />
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              style={{ gridTemplateColumns: "1.45fr 0.75fr 0.8fr 0.85fr 0.6fr 0.7fr 0.5fr" }}
              className="grid items-center gap-4 border-b border-white/5 px-5 py-3 text-[13.5px] last:border-0"
            >
              <div className="min-w-0">
                <Link href={`/admin/jobs/${job.id}`} className="block truncate text-white/95 hover:text-[#ff6a00]">
                  {job.title}
                </Link>
                <div className="truncate font-mono text-[11px] text-white/40">/{job.slug}</div>
              </div>
              <div className="capitalize text-white/70">{job.type}</div>
              <div className="truncate text-white/70">{job.department || "-"}</div>
              <div className="truncate text-white/70">{job.location || "-"}</div>
              <div>
                <Badge tone={job.is_open ? "green" : "neutral"}>{job.is_open ? "Open" : "Closed"}</Badge>
              </div>
              <form action={toggleJobOpenAction}>
                <input type="hidden" name="id" value={job.id} />
                <input type="hidden" name="next" value={job.is_open ? "off" : "on"} />
                <Button type="submit" variant={job.is_open ? "ghost" : "outline"} size="sm">
                  {job.is_open ? "Close" : "Open"}
                </Button>
              </form>
              <form action={deleteJobAction}>
                <input type="hidden" name="id" value={job.id} />
                <Button type="submit" variant="danger" size="sm">
                  Del
                </Button>
              </form>
            </div>
          ))
        )}
      </TableShell>
    </div>
  );
}
