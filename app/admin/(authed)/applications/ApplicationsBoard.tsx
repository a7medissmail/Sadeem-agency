"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { FieldRow, Input, Select, Textarea } from "@/components/admin/ui/Field";
import { applicationStatuses } from "@/lib/validation/careers";
import type { ApplicationStatus, Json } from "@/types/database";
import {
  addApplicationNoteAction,
  deleteApplicationAction,
  updateApplicationMetaAction,
  updateApplicationStatusAction,
} from "./actions";

type JobLite = {
  id: string;
  title: string;
  slug: string;
  type: string;
};

export type StaffRow = {
  id: string;
  full_name: string | null;
  role: "admin" | "editor" | "viewer";
};

type ApplicationNote = {
  id: string;
  application_id: string;
  author_id: string | null;
  authorName: string;
  note: string;
  created_at: string;
};

type ApplicationHistory = {
  id: string;
  application_id: string;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  actor_id: string | null;
  actorName: string;
  note: string | null;
  created_at: string;
};

export type ApplicationBoardRow = {
  id: string;
  job_id: string;
  name: string;
  email: string;
  phone: string | null;
  resume_url: string | null;
  cover_note: string | null;
  status: ApplicationStatus;
  owner_id: string | null;
  ownerName: string | null;
  score: number | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  custom_answers: Json;
  created_at: string;
  job: JobLite | null;
  notes: ApplicationNote[];
  history: ApplicationHistory[];
  resumeDownloadUrl: string | null;
};

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

const statusNotes: Record<ApplicationStatus, string> = {
  new: "Needs first pass",
  review: "Under evaluation",
  interview: "Conversation stage",
  offer: "Decision ready",
  rejected: "Closed loop",
};

const dateFmt = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });
const shortDateFmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

function roleName(application: ApplicationBoardRow) {
  return application.job?.title ?? "Deleted role";
}

function candidateSignal(application: ApplicationBoardRow) {
  if (application.score != null) return application.score;
  let score = 44;
  if (application.resumeDownloadUrl) score += 18;
  if (application.cover_note && application.cover_note.length > 120) score += 18;
  if (application.phone) score += 8;
  if (application.portfolio_url || application.linkedin_url) score += 8;
  if (application.status === "interview") score += 12;
  if (application.status === "offer") score += 20;
  if (application.status === "rejected") score -= 22;
  return Math.max(12, Math.min(98, score));
}

function nextStep(status: ApplicationStatus) {
  if (status === "new") return "Run first review";
  if (status === "review") return "Decide intro call";
  if (status === "interview") return "Capture scorecard";
  if (status === "offer") return "Prepare offer note";
  return "No action needed";
}

function jsonEntries(value: Json) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value)
    .filter(([, answer]) => answer != null && String(answer).trim().length > 0)
    .map(([key, answer]) => ({
      key,
      value: Array.isArray(answer) ? answer.join(", ") : String(answer),
    }));
}

function StageRail({ status }: { status: ApplicationStatus }) {
  const activeIndex = applicationStatuses.indexOf(status);
  return (
    <div className="grid grid-cols-5 gap-1" aria-label={`Current stage: ${statusLabels[status]}`}>
      {applicationStatuses.map((stage, index) => (
        <span
          key={stage}
          className={`h-1 rounded-full ${index <= activeIndex ? "bg-[var(--admin-accent)]" : "bg-[var(--admin-border)]"}`}
          title={statusLabels[stage]}
        />
      ))}
    </div>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${
        active
          ? "border-[var(--admin-accent)] bg-[var(--admin-accent-soft)] text-[var(--admin-text)]"
          : "border-[var(--admin-border)] text-[var(--admin-muted)] hover:border-[var(--admin-accent)] hover:text-[var(--admin-text)]"
      }`}
    >
      {children}
    </button>
  );
}

function CandidateCard({
  application,
  selected,
  onOpen,
}: {
  application: ApplicationBoardRow;
  selected: boolean;
  onOpen: () => void;
}) {
  const signal = candidateSignal(application);
  return (
    <article
      className={`group border bg-[var(--admin-surface-strong)] p-4 transition-colors ${
        selected
          ? "border-[var(--admin-accent)]"
          : "border-[var(--admin-border)] hover:border-[var(--admin-accent)]"
      }`}
    >
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-[var(--admin-text)]">{application.name}</p>
            <p className="mt-1 truncate text-[12.5px] text-[var(--admin-muted)]">{roleName(application)}</p>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-accent)]">
            {String(signal).padStart(2, "0")}
          </span>
        </div>

        <StageRail status={application.status} />

        <div className="mt-4 flex flex-col gap-1.5 font-mono text-[10.5px] text-[var(--admin-subtle)]">
          <span className="truncate">{application.email}</span>
          {application.phone ? <span>{application.phone}</span> : null}
          <span>{dateFmt.format(new Date(application.created_at))}</span>
          <span>{application.ownerName ? `Owner: ${application.ownerName}` : "Unassigned"}</span>
        </div>

        {application.cover_note ? (
          <p className="mt-4 line-clamp-3 text-[12.5px] leading-relaxed text-[var(--admin-muted)]">
            {application.cover_note}
          </p>
        ) : (
          <p className="mt-4 text-[12.5px] leading-relaxed text-[var(--admin-subtle)]">No cover note submitted.</p>
        )}
      </button>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--admin-border-soft)] pt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">
        <span>{application.notes.length > 0 ? `${application.notes.length} note${application.notes.length === 1 ? "" : "s"}` : "No notes"}</span>
        <span className="text-[var(--admin-accent)]/70 transition-colors group-hover:text-[var(--admin-accent)]" aria-hidden="true">
          Review →
        </span>
      </div>
    </article>
  );
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

function TimelineItem({
  label,
  detail,
  meta,
}: {
  label: string;
  detail: string;
  meta?: string | null;
}) {
  return (
    <div className="grid grid-cols-[18px_1fr] gap-3">
      <span className="mt-1.5 h-2 w-2 rounded-full bg-[var(--admin-accent)]" />
      <div>
        <p className="text-[13.5px] font-semibold text-[var(--admin-text)]">{label}</p>
        <p className="mt-1 text-[12.5px] text-[var(--admin-muted)]">{detail}</p>
        {meta ? <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">{meta}</p> : null}
      </div>
    </div>
  );
}

function CandidateDrawer({
  application,
  staff,
  onClose,
}: {
  application: ApplicationBoardRow | null;
  staff: StaffRow[];
  onClose: () => void;
}) {
  if (!application) return null;

  const signal = candidateSignal(application);
  const answers = jsonEntries(application.custom_answers);

  return (
    <div className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
      <aside
        className="ml-auto flex h-full w-full max-w-[720px] flex-col border-l border-[var(--admin-border)] bg-[var(--admin-surface-strong)] shadow-[var(--admin-shadow)]"
        role="dialog"
        aria-modal="true"
        aria-label={`Review ${application.name}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="border-b border-[var(--admin-border)] p-6">
          <div className="mb-5 flex items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--admin-accent)]">Candidate dossier</p>
              <h2 className="mt-2 truncate text-[34px] font-semibold leading-none tracking-tight text-[var(--admin-text)]">
                {application.name}
              </h2>
              <p className="mt-2 text-[14px] text-[var(--admin-muted)]">{roleName(application)}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="border border-[var(--admin-border)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-muted)] hover:border-[var(--admin-accent)] hover:text-[var(--admin-text)]"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Score" value={`${signal}%`} hint={application.score == null ? "Auto signal" : "Manual rating"} />
            <MetricCard label="Stage" value={statusLabels[application.status]} hint={statusNotes[application.status]} />
            <MetricCard label="Received" value={shortDateFmt.format(new Date(application.created_at))} hint="Application date" />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_0.82fr]">
            <section className="space-y-5">
              <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Cover note</h3>
                <p className="mt-4 whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--admin-muted)]">
                  {application.cover_note || "No cover note was submitted."}
                </p>
              </div>

              {answers.length > 0 ? (
                <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Custom answers</h3>
                  <div className="mt-4 divide-y divide-[var(--admin-border-soft)]">
                    {answers.map((answer) => (
                      <div key={answer.key} className="grid gap-2 py-3 md:grid-cols-[0.38fr_1fr]">
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--admin-accent)]">{answer.key}</p>
                        <p className="text-[13px] leading-relaxed text-[var(--admin-muted)]">{answer.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Notes</h3>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-accent)]">
                    {String(application.notes.length).padStart(2, "0")}
                  </span>
                </div>
                <form action={addApplicationNoteAction} className="mt-4 space-y-3">
                  <input type="hidden" name="id" value={application.id} />
                  <Textarea name="note" placeholder="Add interview signal, concern, or next move..." required />
                  <Button type="submit" variant="outline" className="w-full justify-center">
                    Add note
                  </Button>
                </form>
                <div className="mt-5 space-y-3">
                  {application.notes.length === 0 ? (
                    <p className="border border-dashed border-[var(--admin-border)] p-4 text-[12.5px] text-[var(--admin-subtle)]">
                      No internal notes yet.
                    </p>
                  ) : (
                    application.notes.map((note) => (
                      <article key={note.id} className="border border-[var(--admin-border-soft)] bg-[var(--admin-surface-strong)] p-4">
                        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--admin-muted)]">{note.note}</p>
                        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--admin-subtle)]">
                          {note.authorName} / {dateFmt.format(new Date(note.created_at))}
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </section>

            <aside className="space-y-5">
              <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Contact</h3>
                <div className="mt-4 space-y-3 text-[13px]">
                  <a href={`mailto:${application.email}`} className="block break-all text-[var(--admin-text)] hover:text-[var(--admin-accent)]">
                    {application.email}
                  </a>
                  {application.phone ? (
                    <a href={`tel:${application.phone}`} className="block text-[var(--admin-muted)] hover:text-[var(--admin-accent)]">
                      {application.phone}
                    </a>
                  ) : null}
                  {application.portfolio_url ? (
                    <a href={application.portfolio_url} target="_blank" rel="noreferrer" className="block text-[var(--admin-muted)] hover:text-[var(--admin-accent)]">
                      Portfolio
                    </a>
                  ) : null}
                  {application.linkedin_url ? (
                    <a href={application.linkedin_url} target="_blank" rel="noreferrer" className="block text-[var(--admin-muted)] hover:text-[var(--admin-accent)]">
                      LinkedIn
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Profile controls</h3>
                <form action={updateApplicationMetaAction} className="mt-4 space-y-3">
                  <input type="hidden" name="id" value={application.id} />
                  <FieldRow label="Owner">
                    <Select name="owner_id" defaultValue={application.owner_id ?? ""} className="w-full">
                      <option value="">Unassigned</option>
                      {staff.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.full_name || member.role}
                        </option>
                      ))}
                    </Select>
                  </FieldRow>
                  <FieldRow label="Score">
                    <Input name="score" type="number" min={0} max={100} defaultValue={application.score ?? ""} placeholder="0-100" />
                  </FieldRow>
                  <FieldRow label="Portfolio URL">
                    <Input name="portfolio_url" type="url" defaultValue={application.portfolio_url ?? ""} placeholder="https://..." />
                  </FieldRow>
                  <FieldRow label="LinkedIn URL">
                    <Input name="linkedin_url" type="url" defaultValue={application.linkedin_url ?? ""} placeholder="https://..." />
                  </FieldRow>
                  <Button type="submit" variant="outline" className="w-full justify-center">
                    Save profile
                  </Button>
                </form>
              </div>

              <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Stage control</h3>
                <form action={updateApplicationStatusAction} className="mt-4 space-y-3">
                  <input type="hidden" name="id" value={application.id} />
                  <Select name="status" defaultValue={application.status} className="w-full">
                    {applicationStatuses.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </Select>
                  <Textarea name="note" placeholder="Optional reason or next-step note..." />
                  <Button type="submit" variant="outline" className="w-full justify-center">
                    Save stage
                  </Button>
                </form>
                <form action={deleteApplicationAction} className="mt-3">
                  <input type="hidden" name="id" value={application.id} />
                  <Button type="submit" variant="danger" size="sm" className="w-full justify-center">
                    Delete application
                  </Button>
                </form>
              </div>

              <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Files</h3>
                <div className="mt-4">
                  {application.resumeDownloadUrl ? (
                    <a
                      href={application.resumeDownloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex border border-[var(--admin-accent)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-accent)] hover:bg-[var(--admin-accent-soft)]"
                    >
                      Open resume
                    </a>
                  ) : (
                    <p className="text-[12.5px] text-[var(--admin-muted)]">No resume is attached.</p>
                  )}
                </div>
              </div>

              <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Timeline</h3>
                <div className="mt-4 space-y-4">
                  <TimelineItem label="Submitted" detail={dateFmt.format(new Date(application.created_at))} meta={application.email} />
                  {application.history.map((event) => (
                    <TimelineItem
                      key={event.id}
                      label={`${event.from_status ? statusLabels[event.from_status] : "Initial"} -> ${statusLabels[event.to_status]}`}
                      detail={event.note || nextStep(event.to_status)}
                      meta={`${event.actorName} / ${dateFmt.format(new Date(event.created_at))}`}
                    />
                  ))}
                  {application.history.length === 0 ? (
                    <TimelineItem label="Current stage" detail={statusLabels[application.status]} meta={nextStep(application.status)} />
                  ) : null}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function ApplicationsBoard({ applications, staff }: { applications: ApplicationBoardRow[]; staff: StaffRow[] }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [owner, setOwner] = useState("all");
  const [status, setStatus] = useState<ApplicationStatus | "all">("all");
  // Drawer stays closed on mount — auto-opening the first application was
  // disorienting (especially on a fresh page load).
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const roles = useMemo(() => {
    return Array.from(new Set(applications.map((application) => roleName(application)))).sort((a, b) => a.localeCompare(b));
  }, [applications]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return applications.filter((application) => {
      const haystack = `${application.name} ${application.email} ${application.phone ?? ""} ${roleName(application)} ${application.ownerName ?? ""} ${application.cover_note ?? ""}`.toLowerCase();
      return (
        (!needle || haystack.includes(needle)) &&
        (role === "all" || roleName(application) === role) &&
        (owner === "all" || (owner === "unassigned" ? !application.owner_id : application.owner_id === owner)) &&
        (status === "all" || application.status === status)
      );
    });
  }, [applications, query, role, owner, status]);

  const grouped = applicationStatuses.map((stage) => ({
    status: stage,
    items: filtered.filter((application) => application.status === stage),
  }));

  const selected = applications.find((application) => application.id === selectedId) ?? null;
  const activeCount = applications.filter((application) => !["rejected"].includes(application.status)).length;
  const interviewCount = applications.filter((application) => ["interview", "offer"].includes(application.status)).length;
  const assignedCount = applications.filter((application) => application.owner_id).length;
  const averageScore =
    applications.length > 0
      ? Math.round(applications.reduce((total, application) => total + candidateSignal(application), 0) / applications.length)
      : 0;

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--admin-accent)]">Hiring OS</p>
          <h2 className="mt-2 max-w-[13ch] text-[34px] font-semibold leading-[1.02] tracking-tight text-[var(--admin-text)]">
            Build the bench without losing the thread.
          </h2>
          <p className="mt-4 max-w-[68ch] text-[14.5px] leading-relaxed text-[var(--admin-muted)]">
            Every applicant becomes a dossier: role context, score, owner, private resume, internal notes, and stage history in one place.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Total" value={applications.length} hint="All applications" />
          <MetricCard label="Active" value={activeCount} hint="Still in process" />
          <MetricCard label="Assigned" value={assignedCount} hint="Owned dossiers" />
          <MetricCard label="Avg Score" value={`${averageScore}%`} hint={`${interviewCount} interview+`} />
        </div>
      </section>

      <section className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto] xl:items-center">
          <label className="flex min-h-[44px] items-center gap-3 border border-[var(--admin-border)] bg-[var(--admin-surface-strong)] px-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-accent)]">Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, email, role, note"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-subtle)]"
            />
          </label>

          <Select value={role} onChange={(event) => setRole(event.target.value)} aria-label="Filter by role">
            <option value="all">All roles</option>
            {roles.map((roleOption) => (
              <option key={roleOption} value={roleOption}>
                {roleOption}
              </option>
            ))}
          </Select>

          <Select value={owner} onChange={(event) => setOwner(event.target.value)} aria-label="Filter by owner">
            <option value="all">All owners</option>
            <option value="unassigned">Unassigned</option>
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name || member.role}
              </option>
            ))}
          </Select>

          <div className="flex flex-wrap gap-2">
            <FilterChip active={status === "all"} onClick={() => setStatus("all")}>All</FilterChip>
            {applicationStatuses.map((stage) => (
              <FilterChip key={stage} active={status === stage} onClick={() => setStatus(stage)}>
                {statusLabels[stage]}
              </FilterChip>
            ))}
          </div>
        </div>
      </section>

      <div className="overflow-x-auto pb-3">
        <div className="grid min-w-[1320px] grid-cols-[repeat(5,minmax(250px,1fr))] gap-4">
          {grouped.map((column) => (
            <section key={column.status} className="min-h-[560px] border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <Badge tone={statusTones[column.status]}>{statusLabels[column.status]}</Badge>
                  <p className="mt-2 text-[12px] text-[var(--admin-subtle)]">{statusNotes[column.status]}</p>
                </div>
                <span className="font-mono text-[10px] text-[var(--admin-subtle)]">{String(column.items.length).padStart(2, "0")}</span>
              </div>

              <div className="flex flex-col gap-3">
                {column.items.length === 0 ? (
                  <div className="border border-dashed border-[var(--admin-border)] px-3 py-8 text-center text-[12.5px] text-[var(--admin-subtle)]">
                    No candidates
                  </div>
                ) : (
                  column.items.map((application) => (
                    <CandidateCard
                      key={application.id}
                      application={application}
                      selected={application.id === selectedId}
                      onOpen={() => setSelectedId(application.id)}
                    />
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      </div>

      <CandidateDrawer application={selected} staff={staff} onClose={() => setSelectedId(null)} />
    </div>
  );
}
