"use client";

import { useTransition, useState } from "react";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import type { FormSubmissionStatus } from "@/types/database";
import { updateSubmissionStatusAction } from "../../actions";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FieldMeta = {
  field_key: string;
  label: string;
  type: string;
};

export type AnswerRow = {
  field_key: string;
  value: unknown;
};

export type SubmissionRow = {
  id: string;
  form_id: string;
  respondent_name: string | null;
  respondent_email: string | null;
  related_type: string | null;
  related_id: string | null;
  status: FormSubmissionStatus;
  created_at: string;
  answers: AnswerRow[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const dateFmt = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });
const shortFmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

const STATUS_TONES: Record<FormSubmissionStatus, "blue" | "amber" | "green" | "neutral"> = {
  new: "blue",
  reviewed: "green",
  converted: "green",
  archived: "neutral",
};

const STATUS_LABELS: Record<FormSubmissionStatus, string> = {
  new: "New",
  reviewed: "Reviewed",
  converted: "Converted",
  archived: "Archived",
};

const ALL_STATUSES: FormSubmissionStatus[] = ["new", "reviewed", "converted", "archived"];

function formatValue(value: unknown, type: string): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (type === "checkbox") return value ? "Yes" : "No";
  return String(value);
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="ml-1.5 font-mono text-[10px] text-[var(--admin-accent)] hover:underline"
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}

// ─── Submission Card ──────────────────────────────────────────────────────────

function SubmissionCard({
  submission,
  selected,
  onOpen,
}: {
  submission: SubmissionRow;
  selected: boolean;
  onOpen: () => void;
}) {
  const name = submission.respondent_name || "Anonymous";
  return (
    <article
      className={`group cursor-pointer border bg-[var(--admin-surface-strong)] p-4 transition-colors ${
        selected
          ? "border-[var(--admin-accent)]"
          : "border-[var(--admin-border)] hover:border-[var(--admin-accent)]"
      }`}
      onClick={onOpen}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[var(--admin-accent-soft)] text-[11px] font-semibold text-[var(--admin-accent)]">
            {getInitials(submission.respondent_name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-[var(--admin-text)]">{name}</p>
            {submission.respondent_email ? (
              <p className="truncate font-mono text-[11px] text-[var(--admin-muted)]">
                {submission.respondent_email}
              </p>
            ) : null}
          </div>
        </div>
        <Badge tone={STATUS_TONES[submission.status]}>{STATUS_LABELS[submission.status]}</Badge>
      </div>

      <div className="flex items-center justify-between font-mono text-[10.5px] text-[var(--admin-subtle)]">
        <span>{shortFmt.format(new Date(submission.created_at))}</span>
        <span>{submission.answers.length} answer{submission.answers.length !== 1 ? "s" : ""}</span>
        <span className="text-[var(--admin-accent)]/70 transition-colors group-hover:text-[var(--admin-accent)]" aria-hidden="true">
          Open →
        </span>
      </div>
    </article>
  );
}

// ─── Submission Drawer ────────────────────────────────────────────────────────

function SubmissionDrawer({
  submission,
  fields,
  onClose,
}: {
  submission: SubmissionRow | null;
  fields: FieldMeta[];
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  if (!submission) return null;

  const fieldMap = new Map(fields.map((f) => [f.field_key, f]));

  function handleStatus(status: FormSubmissionStatus) {
    const fd = new FormData();
    fd.set("id", submission!.id);
    fd.set("form_id", submission!.form_id);
    fd.set("status", status);
    startTransition(() => updateSubmissionStatusAction(fd));
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col overflow-y-auto bg-[var(--admin-bg)] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--admin-border)] bg-[var(--admin-bg)] px-6 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-accent)]">
              Submission
            </p>
            <p className="mt-1 text-[18px] font-semibold leading-tight text-[var(--admin-text)]">
              {submission.respondent_name || "Anonymous"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center text-[var(--admin-muted)] transition-colors hover:text-[var(--admin-text)]"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-6 p-6">
          {/* Meta */}
          <section className="grid grid-cols-2 gap-4">
            <div>
              <dt className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-[var(--admin-subtle)]">
                Email
              </dt>
              <dd className="mt-1 font-mono text-[12px] text-[var(--admin-text)]">
                {submission.respondent_email ? (
                  <>
                    <a
                      href={`mailto:${submission.respondent_email}`}
                      className="text-[var(--admin-accent)] hover:underline"
                    >
                      {submission.respondent_email}
                    </a>
                    <CopyButton text={submission.respondent_email} />
                  </>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-[var(--admin-subtle)]">
                Received
              </dt>
              <dd className="mt-1 font-mono text-[12px] text-[var(--admin-text)]">
                {dateFmt.format(new Date(submission.created_at))}
              </dd>
            </div>
            {submission.related_type ? (
              <div className="col-span-2">
                <dt className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-[var(--admin-subtle)]">
                  Linked to
                </dt>
                <dd className="mt-1 font-mono text-[12px] text-[var(--admin-muted)]">
                  {submission.related_type} / {submission.related_id?.slice(0, 8)}…
                </dd>
              </div>
            ) : null}
          </section>

          {/* Answers */}
          <section>
            <h3 className="mb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--admin-accent)]">
              Answers
            </h3>
            {submission.answers.length === 0 ? (
              <p className="text-[13px] text-[var(--admin-subtle)]">No answers recorded.</p>
            ) : (
              <dl className="flex flex-col divide-y divide-[var(--admin-border-soft)]">
                {submission.answers.map((answer) => {
                  const meta = fieldMap.get(answer.field_key);
                  const label = meta?.label || answer.field_key;
                  const type = meta?.type || "text";
                  return (
                    <div key={answer.field_key} className="py-3">
                      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">
                        {label}
                      </dt>
                      <dd className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-[var(--admin-text)]">
                        {formatValue(answer.value, type)}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            )}
          </section>

          {/* Status */}
          <section className="border-t border-[var(--admin-border)] pt-6">
            <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--admin-accent)]">
              Status
            </h3>
            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={isPending || submission.status === s}
                  onClick={() => handleStatus(s)}
                  className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    submission.status === s
                      ? "border-[var(--admin-accent)] bg-[var(--admin-accent-soft)] text-[var(--admin-text)]"
                      : "border-[var(--admin-border)] text-[var(--admin-muted)] hover:border-[var(--admin-accent)] hover:text-[var(--admin-text)]"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            {isPending ? (
              <p className="mt-2 font-mono text-[10px] text-[var(--admin-subtle)]">Saving…</p>
            ) : null}
          </section>
        </div>
      </aside>
    </>
  );
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────

function FilterChip({
  active,
  count,
  children,
  onClick,
}: {
  active: boolean;
  count?: number;
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
      {count !== undefined ? ` (${count})` : ""}
    </button>
  );
}

// ─── Main Board ───────────────────────────────────────────────────────────────

export function SubmissionsBoard({
  submissions,
  fields,
}: {
  submissions: SubmissionRow[];
  fields: FieldMeta[];
}) {
  const [selected, setSelected] = useState<SubmissionRow | null>(null);
  const [statusFilter, setStatusFilter] = useState<FormSubmissionStatus | "all">("all");

  const filtered =
    statusFilter === "all"
      ? submissions
      : submissions.filter((s) => s.status === statusFilter);

  const counts = {
    all: submissions.length,
    new: submissions.filter((s) => s.status === "new").length,
    reviewed: submissions.filter((s) => s.status === "reviewed").length,
    converted: submissions.filter((s) => s.status === "converted").length,
    archived: submissions.filter((s) => s.status === "archived").length,
  };

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={statusFilter === "all"} count={counts.all} onClick={() => setStatusFilter("all")}>
          All
        </FilterChip>
        {ALL_STATUSES.map((s) => (
          counts[s] > 0 ? (
            <FilterChip
              key={s}
              active={statusFilter === s}
              count={counts[s]}
              onClick={() => setStatusFilter(s)}
            >
              {STATUS_LABELS[s]}
            </FilterChip>
          ) : null
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="border border-dashed border-[var(--admin-border)] bg-[var(--admin-panel)] px-5 py-14 text-center text-[13px] text-[var(--admin-subtle)]">
          {submissions.length === 0
            ? "No submissions yet. Share the form link to start collecting responses."
            : "No submissions match this filter."}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <SubmissionCard
              key={s.id}
              submission={s}
              selected={selected?.id === s.id}
              onOpen={() => setSelected(s)}
            />
          ))}
        </div>
      )}

      {/* Drawer */}
      {selected ? (
        <SubmissionDrawer
          submission={selected}
          fields={fields}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}
