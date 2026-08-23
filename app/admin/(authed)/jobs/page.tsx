import Link from "next/link";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { deleteJobAction, toggleJobOpenAction } from "./actions";
import { DeleteConfirmButton } from "@/components/admin/ui/DeleteConfirmButton";
import { MetricCard } from "@/components/admin/ui/Stats";

export const metadata = { title: "Careers - SADEEM Admin" };

async function loadJobs() {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("jobs")
      .select("id, slug, title, type, department, location, application_form_id, is_open, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const formIds = Array.from(new Set((data ?? []).map((job) => job.application_form_id).filter(Boolean))) as string[];
    const formsById = new Map<string, { name: string; is_active: boolean }>();
    if (formIds.length > 0) {
      const { data: forms } = await admin.from("forms").select("id, name, is_active").in("id", formIds);
      for (const form of forms ?? []) formsById.set(form.id, { name: form.name, is_active: form.is_active });
    }

    return { jobs: data ?? [], formsById, error: null as string | null };
  } catch (err) {
    // Supabase returns PostgrestError objects (not Error instances) — surface
    // their message instead of collapsing everything to "Unknown error".
    const message =
      err instanceof Error
        ? err.message
        : err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Unknown error";
    return { jobs: [], formsById: new Map<string, { name: string; is_active: boolean }>(), error: message };
  }
}

export default async function JobsAdminPage() {
  await requireRole(["admin", "editor", "viewer"]);
  const { jobs, formsById, error } = await loadJobs();
  const openCount = jobs.filter((job) => job.is_open).length;
  const internshipCount = jobs.filter((job) => job.type === "internship").length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="CAREERS"
        title="Roles"
        description="Publish roles and internships. Open roles appear publicly and feed the hiring board."
        actions={
          <Link href="/admin/jobs/new">
            <Button>New role</Button>
          </Link>
        }
      />

      {error ? (
        <div className="rounded-md border border-[color-mix(in_srgb,var(--sdm-status-warning)_30%,transparent)] bg-[color-mix(in_srgb,var(--sdm-status-warning)_6%,transparent)] px-4 py-3 text-[13px] text-[var(--sdm-text-warning)]">
          Couldn&apos;t load roles: <code>{error}</code>
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <MetricCard label="Total" value={jobs.length} hint="All roles" />
        <MetricCard label="Open" value={openCount} hint="Accepting applications" />
        <MetricCard label="Internships" value={internshipCount} hint="Early talent tracks" />
      </section>

      {jobs.length === 0 ? (
        <div className="border border-dashed border-[var(--admin-border)] bg-[var(--admin-panel)] px-5 py-12 text-center text-[13px] text-[var(--admin-subtle)]">
          No roles yet. Publish the first opening.
        </div>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {jobs.map((job) => (
            <article key={job.id} className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5 transition-colors hover:border-[var(--admin-accent)]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link href={`/admin/jobs/${job.id}`} className="block text-[22px] font-semibold leading-tight text-[var(--admin-text)] hover:text-[var(--admin-accent)]">
                    {job.title}
                  </Link>
                  <p className="mt-2 sdm-eyebrow text-[var(--admin-subtle)]">/{job.slug}</p>
                </div>
                <Badge tone={job.is_open ? "green" : "neutral"}>{job.is_open ? "Open" : "Closed"}</Badge>
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-[var(--admin-border-soft)] pt-5 text-[12.5px]">
                <div>
                  <dt className="sdm-eyebrow text-[var(--admin-subtle)]">Type</dt>
                  <dd className="mt-1 capitalize text-[var(--admin-muted)]">{job.type}</dd>
                </div>
                <div>
                  <dt className="sdm-eyebrow text-[var(--admin-subtle)]">Department</dt>
                  <dd className="mt-1 truncate text-[var(--admin-muted)]">{job.department || "-"}</dd>
                </div>
                <div>
                  <dt className="sdm-eyebrow text-[var(--admin-subtle)]">Location</dt>
                  <dd className="mt-1 truncate text-[var(--admin-muted)]">{job.location || "-"}</dd>
                </div>
                <div>
                  <dt className="sdm-eyebrow text-[var(--admin-subtle)]">Form</dt>
                  <dd className="mt-1 truncate text-[var(--admin-muted)]">
                    {job.application_form_id ? formsById.get(job.application_form_id)?.name ?? "Custom form" : "Default"}
                  </dd>
                </div>
                <div>
                  <dt className="sdm-eyebrow text-[var(--admin-subtle)]">Created</dt>
                  <dd className="mt-1 text-[var(--admin-muted)]">{new Date(job.created_at).toLocaleDateString()}</dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <form action={toggleJobOpenAction}>
                  <input type="hidden" name="id" value={job.id} />
                  <input type="hidden" name="next" value={job.is_open ? "off" : "on"} />
                  <Button type="submit" variant={job.is_open ? "ghost" : "outline"} size="sm">
                    {job.is_open ? "Close" : "Open"}
                  </Button>
                </form>
                <DeleteConfirmButton
                  action={deleteJobAction}
                  id={job.id}
                  message={`Delete "${job.title}"? This cannot be undone.`}
                />
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
