import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { ApplicationStatus, Json } from "@/types/database";
import { ApplicationsBoard, type ApplicationBoardRow, type StaffRow } from "./ApplicationsBoard";

export const metadata = { title: "Applications - SADEEM Admin" };

const RESUME_BUCKET = "application-resumes";

type ApplicationRow = {
  id: string;
  job_id: string;
  name: string;
  email: string;
  phone: string | null;
  resume_url: string | null;
  cover_note: string | null;
  status: ApplicationStatus;
  owner_id: string | null;
  score: number | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  custom_answers: Json;
  created_at: string;
};

type JobLite = {
  id: string;
  title: string;
  slug: string;
  type: string;
};

type ApplicationNoteRow = {
  id: string;
  application_id: string;
  author_id: string | null;
  note: string;
  created_at: string;
};

type ApplicationHistoryRow = {
  id: string;
  application_id: string;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  actor_id: string | null;
  note: string | null;
  created_at: string;
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
      .select(
        "id, job_id, name, email, phone, resume_url, cover_note, status, owner_id, score, portfolio_url, linkedin_url, custom_answers, created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw error;

    const applicationRows = (applications ?? []) as ApplicationRow[];
    const jobIds = [...new Set(applicationRows.map((application) => application.job_id))];
    const applicationIds = applicationRows.map((application) => application.id);
    const jobsById = new Map<string, JobLite>();
    const staffById = new Map<string, StaffRow>();
    const notesByApplication = new Map<string, ApplicationNoteRow[]>();
    const historyByApplication = new Map<string, ApplicationHistoryRow[]>();

    const { data: staff, error: staffError } = await admin
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["admin", "editor"])
      .order("full_name", { ascending: true });
    if (staffError) throw staffError;
    for (const member of (staff ?? []) as StaffRow[]) staffById.set(member.id, member);

    if (jobIds.length > 0) {
      const { data: jobs, error: jobsError } = await admin
        .from("jobs")
        .select("id, title, slug, type")
        .in("id", jobIds);
      if (jobsError) throw jobsError;
      for (const job of jobs ?? []) jobsById.set(job.id, job);
    }

    if (applicationIds.length > 0) {
      const [notesResult, historyResult] = await Promise.all([
        admin
          .from("application_notes")
          .select("id, application_id, author_id, note, created_at")
          .in("application_id", applicationIds)
          .order("created_at", { ascending: false })
          .limit(500),
        admin
          .from("application_status_history")
          .select("id, application_id, from_status, to_status, actor_id, note, created_at")
          .in("application_id", applicationIds)
          .order("created_at", { ascending: false })
          .limit(500),
      ]);
      if (notesResult.error) throw notesResult.error;
      if (historyResult.error) throw historyResult.error;

      for (const note of (notesResult.data ?? []) as ApplicationNoteRow[]) {
        notesByApplication.set(note.application_id, [...(notesByApplication.get(note.application_id) ?? []), note]);
      }
      for (const event of (historyResult.data ?? []) as ApplicationHistoryRow[]) {
        historyByApplication.set(event.application_id, [...(historyByApplication.get(event.application_id) ?? []), event]);
      }
    }

    const rows = await Promise.all(
      applicationRows.map(async (application): Promise<ApplicationBoardRow> => ({
        ...application,
        job: jobsById.get(application.job_id) ?? null,
        ownerName: application.owner_id ? staffById.get(application.owner_id)?.full_name ?? "Unnamed owner" : null,
        notes: (notesByApplication.get(application.id) ?? []).map((note) => ({
          ...note,
          authorName: note.author_id ? staffById.get(note.author_id)?.full_name ?? "SADEEM team" : "SADEEM team",
        })),
        history: (historyByApplication.get(application.id) ?? []).map((event) => ({
          ...event,
          actorName: event.actor_id ? staffById.get(event.actor_id)?.full_name ?? "SADEEM team" : "SADEEM team",
        })),
        resumeDownloadUrl: await signedResumeUrl(application.resume_url),
      })),
    );

    return { applications: rows, staff: (staff ?? []) as StaffRow[], error: null as string | null };
  } catch (err) {
    return { applications: [], staff: [], error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export default async function ApplicationsAdminPage() {
  await requireRole(["admin", "editor", "viewer"]);
  const { applications, staff, error } = await loadApplications();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="PIPELINE"
        title="Applications"
        description="Review candidates, download private resumes, and move applicants through the hiring pipeline."
        actions={
          <a
            href="/api/admin/export/applications"
            className="inline-flex items-center justify-center gap-2.5 font-mono uppercase tracking-[0.22em] transition-colors border border-[var(--admin-accent)] text-[var(--admin-accent)] hover:bg-[var(--admin-accent-soft)] px-3 py-1.5 text-[10px]"
          >
            Export CSV
          </a>
        }
      />

      {error ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200">
          Couldn&apos;t load applications: <code>{error}</code>
        </div>
      ) : null}

      <ApplicationsBoard applications={applications} staff={staff} />
    </div>
  );
}
