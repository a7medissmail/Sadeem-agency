"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { FieldRow, Input, Select, Textarea } from "@/components/admin/ui/Field";
import type { ProposalStatus } from "@/types/database";
import {
  createProposalAction,
  deleteProposalAction,
  markProposalSentAction,
  regenerateProposalTokenAction,
  updateProposalNotesAction,
  updateProposalStatusAction,
  type CreateProposalState,
  type RegenerateTokenState,
} from "./actions";
import { QuotationBuilder, type QuotationRow } from "./QuotationBuilder";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FormLite = { id: string; name: string; slug: string };

export type SubmissionLite = {
  id: string;
  respondent_name: string | null;
  respondent_email: string | null;
  created_at: string;
  answers: { field_key: string; value: unknown }[];
};

export type ProposalRow = {
  id: string;
  form_id: string | null;
  title: string;
  client_name: string;
  client_email: string;
  client_company: string | null;
  token_prefix: string;
  status: ProposalStatus;
  expires_at: string;
  sent_at: string | null;
  opened_at: string | null;
  submitted_at: string | null;
  created_at: string;
  internal_notes: string | null;
  form: FormLite | null;
  submission: SubmissionLite | null;
  quotation: QuotationRow | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_STATUSES: ProposalStatus[] = [
  "draft", "sent", "opened", "in_progress", "submitted", "reviewed", "converted", "expired",
];

const STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  opened: "Opened",
  in_progress: "In progress",
  submitted: "Submitted",
  reviewed: "Reviewed",
  converted: "Converted",
  expired: "Expired",
};

const STATUS_TONES: Record<ProposalStatus, "blue" | "amber" | "violet" | "green" | "red" | "orange"> = {
  draft: "blue",
  sent: "amber",
  opened: "violet",
  in_progress: "orange",
  submitted: "green",
  reviewed: "green",
  converted: "green",
  expired: "red",
};

const STATUS_HINTS: Record<ProposalStatus, string> = {
  draft: "Not sent to client",
  sent: "Link delivered",
  opened: "Client visited",
  in_progress: "Client started",
  submitted: "Awaiting review",
  reviewed: "Team reviewed",
  converted: "Moved to delivery",
  expired: "Link expired",
};

const dateFmt = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });
const shortFmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPortalUrl(tokenRaw?: string) {
  if (!tokenRaw) return "";
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/p/${tokenRaw}`;
}

function isExpired(p: ProposalRow) {
  return new Date(p.expires_at) < new Date();
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function MetricCard({ label, value, hint }: { label: string; value: number | string; hint: string }) {
  return (
    <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">{label}</p>
      <div className="mt-3 text-[30px] font-semibold leading-none text-[var(--admin-text)]">{value}</div>
      <p className="mt-3 text-[12.5px] text-[var(--admin-muted)]">{hint}</p>
    </div>
  );
}

function FilterChip({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
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

function CopyButton({ text, label }: { text: string; label: string }) {
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
      className="border border-[var(--admin-accent)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-accent)] hover:bg-[var(--admin-accent-soft)] transition-colors"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}

// ─── Proposal Card ────────────────────────────────────────────────────────────

function ProposalCard({
  proposal,
  selected,
  onOpen,
}: {
  proposal: ProposalRow;
  selected: boolean;
  onOpen: () => void;
}) {
  const expired = isExpired(proposal);
  return (
    <article
      className={`group border bg-[var(--admin-surface-strong)] p-4 transition-colors cursor-pointer ${
        selected
          ? "border-[var(--admin-accent)]"
          : "border-[var(--admin-border)] hover:border-[var(--admin-accent)]"
      }`}
      onClick={onOpen}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-[var(--admin-text)]">{proposal.title}</p>
          <p className="mt-1 truncate text-[12.5px] text-[var(--admin-muted)]">{proposal.client_name}</p>
        </div>
        <Badge tone={STATUS_TONES[proposal.status]}>{STATUS_LABELS[proposal.status]}</Badge>
      </div>

      <div className="flex flex-col gap-1.5 font-mono text-[10.5px] text-[var(--admin-subtle)]">
        <span className="truncate">{proposal.client_email}</span>
        {proposal.client_company ? <span className="truncate">{proposal.client_company}</span> : null}
        {proposal.form ? <span>Form: {proposal.form.name}</span> : <span className="text-amber-400/80">No form linked</span>}
        <span className={expired && proposal.status !== "submitted" ? "text-red-400" : ""}>
          Expires {shortFmt.format(new Date(proposal.expires_at))}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--admin-border-soft)] pt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">
        <span>{shortFmt.format(new Date(proposal.created_at))}</span>
        <span className="text-[var(--admin-accent)]/70 transition-colors group-hover:text-[var(--admin-accent)]" aria-hidden="true">
          Open →
        </span>
      </div>
    </article>
  );
}

// ─── Proposal Drawer ──────────────────────────────────────────────────────────

function ProposalDrawer({
  proposal,
  forms,
  onClose,
}: {
  proposal: ProposalRow | null;
  forms: FormLite[];
  onClose: () => void;
}) {
  const [regenState, regenAction] = useFormState<RegenerateTokenState, FormData>(
    regenerateProposalTokenAction,
    {},
  );
  const [rawToken, setRawToken] = useState<string | null>(null);
  const prevRegenRef = useRef(regenState);

  useEffect(() => {
    if (regenState !== prevRegenRef.current && regenState.rawToken) {
      setRawToken(regenState.rawToken);
    }
    prevRegenRef.current = regenState;
  }, [regenState]);

  if (!proposal) return null;
  const portalUrl = rawToken ? getPortalUrl(rawToken) : null;
  const expired = isExpired(proposal);

  return (
    <div className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
      <aside
        className="ml-auto flex h-full w-full max-w-[960px] flex-col border-l border-[var(--admin-border)] bg-[var(--admin-surface-strong)] shadow-[var(--admin-shadow)]"
        role="dialog"
        aria-modal="true"
        aria-label={`Proposal: ${proposal.title}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="border-b border-[var(--admin-border)] px-8 py-6">
          <div className="mb-5 flex items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--admin-accent)]">Proposal Brief</p>
              <h2 className="mt-2 truncate text-[30px] font-semibold leading-none tracking-tight text-[var(--admin-text)]">
                {proposal.title}
              </h2>
              <p className="mt-2 text-[14px] text-[var(--admin-muted)]">
                {proposal.client_name}
                {proposal.client_company ? ` · ${proposal.client_company}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 border border-[var(--admin-border)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-muted)] hover:border-[var(--admin-accent)] hover:text-[var(--admin-text)]"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Status" value={STATUS_LABELS[proposal.status]} hint={STATUS_HINTS[proposal.status]} />
            <MetricCard
              label="Sent"
              value={proposal.sent_at ? shortFmt.format(new Date(proposal.sent_at)) : "—"}
              hint={proposal.opened_at ? `Opened ${shortFmt.format(new Date(proposal.opened_at))}` : "Not opened yet"}
            />
            <MetricCard
              label="Expires"
              value={shortFmt.format(new Date(proposal.expires_at))}
              hint={expired ? "Link expired" : "Still active"}
            />
          </div>
        </header>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* Left col */}
            <section className="space-y-5">

              {/* Magic link */}
              <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Magic link</h3>
                {portalUrl ? (
                  <div className="mt-4 space-y-3">
                    <p className="break-all rounded bg-[var(--admin-surface-strong)] p-3 font-mono text-[11px] text-[var(--admin-text)]">
                      {portalUrl}
                    </p>
                    <CopyButton text={portalUrl} label="Copy link" />
                    <p className="text-[12px] text-amber-400">
                      Save this link now — it won&apos;t be shown again. Regenerating invalidates the old one.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <p className="text-[13px] text-[var(--admin-muted)]">
                      The raw token is only shown once at creation or after regeneration. Use the button below to get a new link.
                    </p>
                    {regenState.error ? (
                      <p className="text-[12.5px] text-red-400">{regenState.error}</p>
                    ) : null}
                    <form action={regenAction}>
                      <input type="hidden" name="id" value={proposal.id} />
                      <Button type="submit" variant="outline">
                        Regenerate link
                      </Button>
                    </form>
                  </div>
                )}
              </div>

              {/* Submission */}
              {proposal.submission ? (
                <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Brief Submission</h3>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400">● Received</span>
                  </div>
                  <p className="mt-2 text-[12px] text-[var(--admin-subtle)]">
                    {dateFmt.format(new Date(proposal.submission.created_at))}
                  </p>
                  <div className="mt-5 space-y-5">
                    {proposal.submission.answers.map((answer) => {
                      const raw = Array.isArray(answer.value)
                        ? (answer.value as string[]).join(", ")
                        : String(answer.value ?? "");
                      if (!raw) return null;
                      const label = answer.field_key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase());
                      return (
                        <div key={answer.field_key}>
                          <p className="mb-1.5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-[var(--admin-accent)]">
                            {label}
                          </p>
                          <p className="text-[13.5px] leading-relaxed text-[var(--admin-text)]">
                            {raw}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-[var(--admin-border)] p-5">
                  <p className="text-[13px] text-[var(--admin-subtle)]">
                    {proposal.status === "draft"
                      ? "Send the link to the client before expecting a submission."
                      : "No submission received yet."}
                  </p>
                </div>
              )}

              {/* Quotation builder — available once brief is submitted */}
              {["submitted", "reviewed", "converted", "draft", "sent", "opened", "in_progress"].includes(proposal.status) && (
                <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
                  <h3 className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Quotation</h3>
                  <QuotationBuilder
                    proposalId={proposal.id}
                    existingQuotation={proposal.quotation}
                  />
                </div>
              )}

              {/* Internal notes */}
              <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Internal notes</h3>
                <form action={updateProposalNotesAction} className="mt-4 space-y-3">
                  <input type="hidden" name="id" value={proposal.id} />
                  <Textarea
                    name="internal_notes"
                    defaultValue={proposal.internal_notes ?? ""}
                    placeholder="Team context, budget signals, next steps..."
                    className="min-h-[100px]"
                  />
                  <Button type="submit" variant="outline" className="w-full justify-center">
                    Save notes
                  </Button>
                </form>
              </div>
            </section>

            {/* Right col */}
            <aside className="space-y-4">

              {/* Client info */}
              <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Client</p>
                <div className="mt-4 space-y-1">
                  <p className="text-[15px] font-semibold text-[var(--admin-text)]">{proposal.client_name}</p>
                  {proposal.client_company && (
                    <p className="text-[13px] text-[var(--admin-muted)]">{proposal.client_company}</p>
                  )}
                  <a
                    href={`mailto:${proposal.client_email}`}
                    className="block pt-1 text-[12.5px] text-[var(--admin-accent)] hover:underline break-all"
                  >
                    {proposal.client_email}
                  </a>
                </div>
              </div>

              {/* Status control */}
              <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Update status</p>
                <form action={updateProposalStatusAction} className="mt-4 space-y-3">
                  <input type="hidden" name="id" value={proposal.id} />
                  <Select name="status" defaultValue={proposal.status} className="w-full">
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </Select>
                  <Button type="submit" variant="outline" className="w-full justify-center">
                    Save
                  </Button>
                </form>
                {proposal.status === "draft" && (
                  <form action={markProposalSentAction} className="mt-2">
                    <input type="hidden" name="id" value={proposal.id} />
                    <Button type="submit" variant="ghost" className="w-full justify-center">
                      Mark as sent
                    </Button>
                  </form>
                )}
              </div>

              {/* Timeline */}
              <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Timeline</p>
                <ol className="mt-5 space-y-0">
                  {[
                    { label: "Created",   at: proposal.created_at,  done: true },
                    { label: "Sent",      at: proposal.sent_at,     done: Boolean(proposal.sent_at) },
                    { label: "Opened",    at: proposal.opened_at,   done: Boolean(proposal.opened_at) },
                    { label: "Submitted", at: proposal.submitted_at, done: Boolean(proposal.submitted_at) },
                  ].map((item, i, arr) => (
                    <li key={item.label} className="relative flex gap-4 pb-5 last:pb-0">
                      {/* connector line */}
                      {i < arr.length - 1 && (
                        <span className={`absolute left-[7px] top-4 h-full w-px ${item.done ? "bg-[var(--admin-accent)]/40" : "bg-[var(--admin-border)]"}`} />
                      )}
                      <span className={`relative mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                        item.done
                          ? "border-[var(--admin-accent)] bg-[var(--admin-accent)]"
                          : "border-[var(--admin-border)] bg-transparent"
                      }`} />
                      <div className="min-w-0">
                        <p className={`text-[13.5px] font-medium ${item.done ? "text-[var(--admin-text)]" : "text-[var(--admin-subtle)]"}`}>
                          {item.label}
                        </p>
                        {item.at ? (
                          <p className="mt-0.5 text-[11.5px] text-[var(--admin-subtle)]">
                            {dateFmt.format(new Date(item.at))}
                          </p>
                        ) : (
                          <p className="mt-0.5 text-[11.5px] text-[var(--admin-border)]">Pending</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Delete */}
              <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Danger zone</p>
                <form action={deleteProposalAction} className="mt-4">
                  <input type="hidden" name="id" value={proposal.id} />
                  <Button type="submit" variant="danger" size="sm" className="w-full justify-center">
                    Delete proposal
                  </Button>
                </form>
              </div>

            </aside>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ─── Create Form ──────────────────────────────────────────────────────────────

function CreateProposalPanel({
  forms,
  onCreated,
}: {
  forms: FormLite[];
  onCreated: (token: string) => void;
}) {
  const [state, action] = useFormState<CreateProposalState, FormData>(createProposalAction, {});
  const didCreate = useRef(false);

  useEffect(() => {
    if (state.ok && state.rawToken && !didCreate.current) {
      didCreate.current = true;
      onCreated(state.rawToken);
    }
  }, [state, onCreated]);

  return (
    <form action={action} className="space-y-4">
      {state.error ? (
        <p className="rounded border border-red-500/30 bg-red-500/[0.06] px-3 py-2 text-[13px] text-red-300">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <FieldRow label="Brief title *">
          <Input name="title" placeholder="Q3 Growth Strategy" required />
        </FieldRow>
        <FieldRow label="Linked form">
          <Select name="form_id" className="w-full">
            <option value="">No form (informational only)</option>
            {forms.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </Select>
        </FieldRow>
        <FieldRow label="Client name *">
          <Input name="client_name" placeholder="Ahmed Al-Rashidi" required />
        </FieldRow>
        <FieldRow label="Client email *">
          <Input name="client_email" type="email" placeholder="ahmed@company.com" required />
        </FieldRow>
        <FieldRow label="Company">
          <Input name="client_company" placeholder="Acme Corp" />
        </FieldRow>
        <FieldRow label="Expires in (days)">
          <Input name="expires_days" type="number" min={1} max={90} defaultValue="14" />
        </FieldRow>
      </div>

      <Button type="submit" className="mt-2">
        Create proposal &amp; generate link
      </Button>
    </form>
  );
}

// ─── Main Board ───────────────────────────────────────────────────────────────

export function ProposalBoard({
  proposals,
  forms,
}: {
  proposals: ProposalRow[];
  forms: FormLite[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [newTokenUrl, setNewTokenUrl] = useState<string | null>(null);

  const filtered = proposals.filter((p) => {
    const needle = query.trim().toLowerCase();
    const haystack = `${p.title} ${p.client_name} ${p.client_email} ${p.client_company ?? ""} ${p.form?.name ?? ""}`.toLowerCase();
    return (
      (!needle || haystack.includes(needle)) &&
      (statusFilter === "all" || p.status === statusFilter)
    );
  });

  const selected = proposals.find((p) => p.id === selectedId) ?? null;

  const draftCount = proposals.filter((p) => p.status === "draft").length;
  const activeCount = proposals.filter((p) => ["sent", "opened", "in_progress"].includes(p.status)).length;
  const submittedCount = proposals.filter((p) => ["submitted", "reviewed"].includes(p.status)).length;
  const convertedCount = proposals.filter((p) => p.status === "converted").length;

  function handleCreated(token: string) {
    const url = `${window.location.origin}/p/${token}`;
    setNewToken(token);
    setNewTokenUrl(url);
    setShowCreate(false);
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Hero + metrics */}
      <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--admin-accent)]">Proposal OS</p>
          <h2 className="mt-2 max-w-[15ch] text-[34px] font-semibold leading-[1.02] tracking-tight text-[var(--admin-text)]">
            Send briefs. Capture context. Close faster.
          </h2>
          <p className="mt-4 max-w-[68ch] text-[14.5px] leading-relaxed text-[var(--admin-muted)]">
            Generate a private magic link for each client. They fill the brief on a clean branded portal.
            You see the answers the moment they submit.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Draft" value={draftCount} hint="Not yet sent" />
          <MetricCard label="Active" value={activeCount} hint="In client hands" />
          <MetricCard label="Submitted" value={submittedCount} hint="Need review" />
          <MetricCard label="Converted" value={convertedCount} hint="Moved to delivery" />
        </div>
      </section>

      {/* New token banner */}
      {newTokenUrl ? (
        <div className="border border-emerald-500/30 bg-emerald-500/[0.06] p-5">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-400">Proposal created</p>
              <p className="mt-2 break-all font-mono text-[12px] text-[var(--admin-text)]">{newTokenUrl}</p>
              <p className="mt-2 text-[12.5px] text-emerald-300/80">
                Copy this link and send it to the client. It won&apos;t be shown again.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <CopyButton text={newTokenUrl} label="Copy link" />
              <button
                type="button"
                onClick={() => { setNewToken(null); setNewTokenUrl(null); }}
                className="border border-[var(--admin-border)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-muted)] hover:border-[var(--admin-accent)] hover:text-[var(--admin-text)]"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Create panel */}
      {showCreate ? (
        <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-accent)]">New proposal</p>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
            >
              Cancel
            </button>
          </div>
          <CreateProposalPanel forms={forms} onCreated={handleCreated} />
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="border border-[var(--admin-accent)] px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--admin-accent)] hover:bg-[var(--admin-accent-soft)] transition-colors"
          >
            + New proposal
          </button>
        </div>
      )}

      {/* Filter bar */}
      <section className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
          <label className="flex min-h-[44px] items-center gap-3 border border-[var(--admin-border)] bg-[var(--admin-surface-strong)] px-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-accent)]">Search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Title, client, email, company"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-subtle)]"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>All</FilterChip>
            {(["draft", "sent", "in_progress", "submitted", "converted"] as ProposalStatus[]).map((s) => (
              <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                {STATUS_LABELS[s]}
              </FilterChip>
            ))}
          </div>
        </div>
      </section>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="border border-dashed border-[var(--admin-border)] px-6 py-16 text-center text-[13px] text-[var(--admin-subtle)]">
          {proposals.length === 0
            ? "No proposals yet. Create one above."
            : "No proposals match your filter."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <ProposalCard
              key={p.id}
              proposal={p}
              selected={p.id === selectedId}
              onOpen={() => setSelectedId(p.id)}
            />
          ))}
        </div>
      )}

      {/* Drawer */}
      <ProposalDrawer
        proposal={selected}
        forms={forms}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
