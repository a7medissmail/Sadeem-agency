import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { applicationStatuses } from "@/lib/validation/careers";
import type { ApplicationStatus } from "@/types/database";
import { deleteApplicationAction, updateApplicationStatusAction } from "./actions";

export const metadata = { title: "Applications - SADEEM Admin" };

const RESUME_BUCKET = "application-resumes";

const statusLabels: Record<ApplicationStatus, string> = {
  new: "New",
  review: "Review",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

const statusTones: Record<ApplicationStatus, "orange" | "blue" | "violet" | "green" | "red"> = {
  new: "orange",
  review: "blue",
  interview: "violet",
  offer: "green",
  rejected: "red",
};

type ApplicationRow = {
  id: string;
  job_id: string;
  name: string;
  email: string;
  phone: string | null;
  resume_url: string | null;
  cover_note: string | null;
  status: ApplicationStatus;
  created_at: string;
};

type JobLite = {
  id: string;
  title: string;
  slug: string;
  type: string;
};

async function signedResumeUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage.from(RESUME_BUCKET).createSignedUrl(path, 60 * 10);
  if (error) return null;
  return data.signedUrl;
}

async function loadApplications() {
  try {
    const admin = getSupabaseAdmin();
    const { data: applications, error } = await admin
      .from("applications")
      .select("id, job_id, name, email, phone, resume_url, cover_note, status, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const jobIds = [...new Set((applications ?? []).map((application) => application.job_id))];
    const jobsById = new Map<string, JobLite>();

    if (jobIds.length > 0) {
      const { data: jobs, error: jobsError } = await admin
        .from("jobs")
        .select("id, title, slug, type")
        .in("id", jobIds);
      if (jobsError) throw jobsError;
      for (const job of jobs ?? []) jobsById.set(job.id, job);
    }

    const rows = await Promise.all(
      (applications ?? []).map(async (application) => ({
        ...application,
        job: jobsById.get(application.job_id) ?? null,
        resumeDownloadUrl: await signedResumeUrl(application.resume_url),
      })),
    );

    return { applications: rows, error: null as string | null };
  } catch (err) {
    return { applications: [], error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export default async function ApplicationsAdminPage() {
  await requireRole(["admin", "editor", "viewer"]);
  const { applications, error } = await loadApplications();
  const dateFmt = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });
  const grouped = applicationStatuses.map((status) => ({
    status,
    items: applications.filter((application) => application.status === status),
  }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="PIPELINE"
        title="Applications"
        description="Review candidates, download private resumes, and move applicants through the hiring pipeline."
      />

      {error ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200">
          Couldn&apos;t load applications: <code>{error}</code>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {grouped.map((column) => (
          <section key={column.status} className="min-h-[420px] border border-white/10 bg-white/[0.025] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <Badge tone={statusTones[column.status]}>{statusLabels[column.status]}</Badge>
              <span className="font-mono text-[10px] text-white/35">{String(column.items.length).padStart(2, "0")}</span>
            </div>

            <div className="flex flex-col gap-3">
              {column.items.length === 0 ? (
                <div className="border border-dashed border-white/10 px-3 py-8 text-center text-[12.5px] text-white/35">
                  No candidates
                </div>
              ) : (
                column.items.map((application) => (
                  <article key={application.id} className="border border-white/10 bg-[#0a0b0d] p-4">
                    <div className="font-semibold text-white/95">{application.name}</div>
                    <div className="mt-1 text-[12.5px] text-white/50">{application.job?.title ?? "Deleted role"}</div>
                    <div className="mt-3 flex flex-col gap-1.5 font-mono text-[10.5px] text-white/45">
                      <a href={`mailto:${application.email}`} className="hover:text-[#ff6a00]">{application.email}</a>
                      {application.phone ? <span>{application.phone}</span> : null}
                      <span>{dateFmt.format(new Date(application.created_at))}</span>
                    </div>

                    {application.cover_note ? (
                      <p className="mt-3 line-clamp-4 text-[12.5px] leading-relaxed text-white/58">
                        {application.cover_note}
                      </p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {application.resumeDownloadUrl ? (
                        <a
                          href={application.resumeDownloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ff6a00] hover:text-[#ff8c3a]"
                        >
                          Resume
                        </a>
                      ) : (
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
                          No resume
                        </span>
                      )}
                    </div>

                    <form action={updateApplicationStatusAction} className="mt-4 flex items-center gap-2">
                      <input type="hidden" name="id" value={application.id} />
                      <select
                        name="status"
                        defaultValue={application.status}
                        className="min-w-0 flex-1 border border-white/10 bg-[#111214] px-2 py-1.5 text-[12px] text-white/80 outline-none focus:border-[#ff6a00]"
                      >
                        {applicationStatuses.map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status]}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" size="sm" variant="outline">Save</Button>
                    </form>

                    <form action={deleteApplicationAction} className="mt-2">
                      <input type="hidden" name="id" value={application.id} />
                      <Button type="submit" size="sm" variant="danger">Delete</Button>
                    </form>
                  </article>
                ))
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
