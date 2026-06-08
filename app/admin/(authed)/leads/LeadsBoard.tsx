"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { Select } from "@/components/admin/ui/Field";
import type { Database, LeadSource, LeadStatus } from "@/types/database";
import {
  addLeadNoteAction,
  assignLeadOwnerAction,
  createBriefFromLeadAction,
  deleteLeadAction,
  moveLeadAction,
  updateLeadStatusAction,
} from "./actions";
import { Textarea } from "@/components/admin/ui/Field";
import { QuickBriefPanel, type BriefFormLite } from "@/components/admin/ui/QuickBrief";

type LeadNote = {
  id: string;
  lead_id: string;
  author_id: string | null;
  note: string;
  created_at: string;
  author: { full_name: string | null } | null;
};

export type LeadBoardRow = Pick<
  Database["public"]["Tables"]["leads"]["Row"],
  "id" | "name" | "email" | "phone" | "company" | "message" | "source" | "status" | "owner_id" | "marketing_unsubscribed_at" | "created_at"
> & {
  notes: LeadNote[];
};

export type StaffRow = {
  id: string;
  full_name: string | null;
  role: "admin" | "editor" | "viewer";
};

const statuses: LeadStatus[] = ["new", "contacted", "qualified", "won", "lost"];
const sources: LeadSource[] = ["homepage", "course", "consultation", "other"];

const statusLabels: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  won: "Won",
  lost: "Lost",
};

const sourceLabels: Record<LeadSource, string> = {
  homepage: "Homepage",
  course: "Course",
  consultation: "Consultation",
  other: "Other",
};

const statusTones: Record<LeadStatus, "blue" | "amber" | "violet" | "green" | "red"> = {
  new: "blue",
  contacted: "amber",
  qualified: "violet",
  won: "green",
  lost: "red",
};

const statusNotes: Record<LeadStatus, string> = {
  new: "Needs triage",
  contacted: "First touch made",
  qualified: "Worth pursuing",
  won: "Converted",
  lost: "Closed out",
};

const dateFmt = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });
const shortDateFmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

function ownerName(lead: LeadBoardRow, staff: StaffRow[]) {
  if (!lead.owner_id) return "Unassigned";
  return staff.find((member) => member.id === lead.owner_id)?.full_name || "Unnamed owner";
}

function leadSignal(lead: LeadBoardRow) {
  let score = 38;
  if (lead.phone) score += 12;
  if (lead.company) score += 10;
  if (lead.message && lead.message.length > 80) score += 16;
  if (lead.source === "consultation") score += 18;
  if (lead.status === "qualified") score += 14;
  if (lead.status === "won") score += 24;
  if (lead.status === "lost") score -= 18;
  return Math.max(10, Math.min(98, score));
}

function nextMove(status: LeadStatus) {
  if (status === "new") return "Assign owner and reply";
  if (status === "contacted") return "Capture need and budget";
  if (status === "qualified") return "Prepare next conversation";
  if (status === "won") return "Move into delivery handoff";
  return "No active follow-up";
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

function MetricCard({ label, value, hint }: { label: string; value: number | string; hint: string }) {
  return (
    <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">{label}</p>
      <div className="mt-3 text-[30px] font-semibold leading-none text-[var(--admin-text)]">{value}</div>
      <p className="mt-3 text-[12.5px] text-[var(--admin-muted)]">{hint}</p>
    </div>
  );
}

function SourceDot({ source }: { source: LeadSource }) {
  const tone = source === "consultation" ? "bg-sky-400" : source === "course" ? "bg-violet-400" : source === "homepage" ? "bg-[var(--admin-accent)]" : "bg-[var(--admin-muted)]";
  return <span className={`h-2 w-2 rounded-full ${tone}`} aria-hidden="true" />;
}

// ─── Drag wrapper ─────────────────────────────────────────────────────────────

function DraggableCard({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`touch-none ${isDragging ? "opacity-30" : ""}`}
    >
      {children}
    </div>
  );
}

// ─── Droppable column ─────────────────────────────────────────────────────────

/**
 * The entire column (header + cards list) is the droppable target so the user
 * can drop a card anywhere inside the column, not just over existing cards.
 */
function DroppableColumn({
  status,
  count,
  children,
}: {
  status: LeadStatus;
  count: number;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      className={`min-h-[300px] border p-4 transition-colors ${
        isOver
          ? "border-[var(--admin-accent)] bg-[var(--admin-accent-soft)]"
          : "border-[var(--admin-border)] bg-[var(--admin-panel)]"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <Badge tone={statusTones[status]}>{statusLabels[status]}</Badge>
          <p className="mt-2 text-[12px] text-[var(--admin-subtle)]">
            {statusNotes[status]}
          </p>
        </div>
        <span className="font-mono text-[10px] text-[var(--admin-subtle)]">
          {String(count).padStart(2, "0")}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {children}
      </div>
    </section>
  );
}

// ─── Compact card ─────────────────────────────────────────────────────────────

/**
 * Compact Trello-style card — shows only what's needed to triage.
 * Full details open in the drawer.
 */
function LeadCard({
  lead,
  selected,
  onOpen,
}: {
  lead: LeadBoardRow;
  selected: boolean;
  staff: StaffRow[];
  onOpen: () => void;
}) {
  const signal = leadSignal(lead);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group w-full border bg-[var(--admin-surface-strong)] px-3 py-2.5 text-left transition-colors ${
        selected
          ? "border-[var(--admin-accent)]"
          : "border-[var(--admin-border)] hover:border-[var(--admin-accent)]"
      }`}
    >
      {/* Row 1: name + signal */}
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate text-[13.5px] font-semibold leading-snug text-[var(--admin-text)]">
          {lead.name}
        </p>
        <span className="shrink-0 font-mono text-[9px] tabular-nums text-[var(--admin-accent)]">
          {String(signal).padStart(2, "0")}
        </span>
      </div>

      {/* Row 2: source dot + label · date · optional note badge */}
      <div className="mt-1.5 flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--admin-subtle)]">
        <SourceDot source={lead.source} />
        <span>{sourceLabels[lead.source]}</span>
        <span className="opacity-40">·</span>
        <span>{shortDateFmt.format(new Date(lead.created_at))}</span>
        {lead.notes.length > 0 && (
          <>
            <span className="opacity-40">·</span>
            <span className="text-[var(--admin-accent)]">
              {lead.notes.length}n
            </span>
          </>
        )}
        {lead.marketing_unsubscribed_at ? (
          <>
            <span className="opacity-40">·</span>
            <span className="text-red-400/70">unsub</span>
          </>
        ) : null}
      </div>
    </button>
  );
}

function LeadDrawer({
  lead,
  staff,
  forms,
  onClose,
}: {
  lead: LeadBoardRow | null;
  staff: StaffRow[];
  forms: BriefFormLite[];
  onClose: () => void;
}) {
  if (!lead) return null;

  const signal = leadSignal(lead);
  const timeline = [
    { label: "Captured", detail: dateFmt.format(new Date(lead.created_at)), done: true },
    { label: "Source", detail: sourceLabels[lead.source], done: true },
    { label: "Owner", detail: ownerName(lead, staff), done: Boolean(lead.owner_id) },
    { label: "Next move", detail: nextMove(lead.status), done: lead.status !== "lost" },
  ];

  return (
    <div className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
      <aside
        className="ml-auto flex h-full w-full max-w-[820px] flex-col border-l border-[var(--admin-border)] bg-[var(--admin-surface-strong)] shadow-[var(--admin-shadow)]"
        role="dialog"
        aria-modal="true"
        aria-label={`Lead dossier for ${lead.name}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="border-b border-[var(--admin-border)] p-6">
          <div className="mb-5 flex items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--admin-accent)]">Lead dossier</p>
              <h2 className="mt-2 truncate text-[34px] font-semibold leading-none tracking-tight text-[var(--admin-text)]">
                {lead.name}
              </h2>
              <p className="mt-2 text-[14px] text-[var(--admin-muted)]">{lead.company || sourceLabels[lead.source]}</p>
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
            <MetricCard label="Signal" value={`${signal}%`} hint="Intent quality" />
            <MetricCard label="Stage" value={statusLabels[lead.status]} hint={statusNotes[lead.status]} />
            <MetricCard label="Received" value={shortDateFmt.format(new Date(lead.created_at))} hint="Inbound date" />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_0.82fr]">
            <section className="space-y-5">
              <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Message</h3>
                <p className="mt-4 whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--admin-muted)]">
                  {lead.message || "No message was submitted."}
                </p>
              </div>

              <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Notes</h3>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-accent)]">
                    {String(lead.notes.length).padStart(2, "0")}
                  </span>
                </div>
                <form action={addLeadNoteAction} className="mt-4 space-y-3">
                  <input type="hidden" name="id" value={lead.id} />
                  <Textarea name="note" placeholder="Conversation summary, budget signal, next move..." required />
                  <Button type="submit" variant="outline" className="w-full justify-center">
                    Add note
                  </Button>
                </form>
                <div className="mt-5 space-y-3">
                  {lead.notes.length === 0 ? (
                    <p className="border border-dashed border-[var(--admin-border)] p-4 text-[12.5px] text-[var(--admin-subtle)]">
                      No internal notes yet.
                    </p>
                  ) : (
                    lead.notes.map((note) => (
                      <article key={note.id} className="border border-[var(--admin-border-soft)] bg-[var(--admin-surface-strong)] p-4">
                        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--admin-muted)]">{note.note}</p>
                        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--admin-subtle)]">
                          {note.author?.full_name ?? "Staff"} / {dateFmt.format(new Date(note.created_at))}
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </div>

              <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Process timeline</h3>
                <div className="mt-4 space-y-3">
                  {timeline.map((item) => (
                    <div key={item.label} className="grid grid-cols-[18px_1fr] gap-3">
                      <span className={`mt-1 h-2 w-2 rounded-full ${item.done ? "bg-[var(--admin-accent)]" : "bg-[var(--admin-border)]"}`} />
                      <div>
                        <p className="text-[13.5px] font-semibold text-[var(--admin-text)]">{item.label}</p>
                        <p className="mt-1 text-[12.5px] text-[var(--admin-muted)]">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside className="space-y-5">
              <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Contact</h3>
                <div className="mt-4 space-y-3 text-[13px]">
                  <a href={`mailto:${lead.email}`} className="block break-all text-[var(--admin-text)] hover:text-[var(--admin-accent)]">
                    {lead.email}
                  </a>
                  {lead.phone ? (
                    <a href={`tel:${lead.phone}`} className="block text-[var(--admin-muted)] hover:text-[var(--admin-accent)]">
                      {lead.phone}
                    </a>
                  ) : null}
                  {lead.company ? <p className="text-[var(--admin-muted)]">{lead.company}</p> : null}
                </div>
              </div>

              <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Stage control</h3>
                <form action={updateLeadStatusAction} className="mt-4 space-y-3">
                  <input type="hidden" name="id" value={lead.id} />
                  <Select name="status" defaultValue={lead.status} className="w-full">
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </Select>
                  <Button type="submit" variant="outline" className="w-full justify-center">
                    Save stage
                  </Button>
                </form>

                <form action={assignLeadOwnerAction} className="mt-3 space-y-3">
                  <input type="hidden" name="id" value={lead.id} />
                  <Select name="owner_id" defaultValue={lead.owner_id ?? ""} className="w-full">
                    <option value="">Unassigned</option>
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name || "Unnamed"}
                      </option>
                    ))}
                  </Select>
                  <Button type="submit" variant="ghost" className="w-full justify-center">
                    Assign owner
                  </Button>
                </form>
              </div>

              <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Actions</h3>
                <a
                  href={`mailto:${lead.email}?subject=${encodeURIComponent("Following up from SADEEM")}`}
                  className="mt-4 inline-flex w-full justify-center border border-[var(--admin-accent)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-accent)] hover:bg-[var(--admin-accent-soft)]"
                >
                  Email lead
                </a>
                <QuickBriefPanel
                  forms={forms}
                  createBrief={(formId, days, emailNow, locale) =>
                    createBriefFromLeadAction(lead.id, formId, days, emailNow, locale)
                  }
                />
                <form
                  action={deleteLeadAction}
                  className="mt-3"
                  onSubmit={(e) => {
                    if (!window.confirm(`Delete ${lead.name}? This cannot be undone.`)) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="id" value={lead.id} />
                  <Button type="submit" variant="danger" size="sm" className="w-full justify-center">
                    Delete lead
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

export function LeadsBoard({ leads, staff, forms }: { leads: LeadBoardRow[]; staff: StaffRow[]; forms: BriefFormLite[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Optimistic overrides: id → new status, applied while server action is in flight
  const [optimistic, setOptimistic] = useState<Record<string, LeadStatus>>({});
  // DnD active card id (for DragOverlay)
  const [activeId, setActiveId] = useState<string | null>(null);

  // Merge server data with optimistic overrides
  const mergedLeads = useMemo(
    () =>
      Object.keys(optimistic).length === 0
        ? leads
        : leads.map((l) => ({ ...l, status: optimistic[l.id] ?? l.status })),
    [leads, optimistic],
  );

  // Source/status remain client-side — fast within the current page's records
  const [source, setSource] = useState<LeadSource | "all">("all");
  const [status, setStatus] = useState<LeadStatus | "all">("all");
  // Drawer stays closed on mount — auto-opening the first lead was disorienting
  // (especially on a fresh page load).
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      mergedLeads.filter(
        (lead) =>
          (source === "all" || lead.source === source) &&
          (status === "all" || lead.status === status),
      ),
    [mergedLeads, source, status],
  );

  const grouped = statuses.map((stage) => ({
    status: stage,
    items: filtered.filter((lead) => lead.status === stage),
  }));

  const selected = mergedLeads.find((lead) => lead.id === selectedId) ?? null;
  const newCount = mergedLeads.filter((lead) => lead.status === "new").length;
  const qualifiedCount = mergedLeads.filter((lead) =>
    ["qualified", "won"].includes(lead.status),
  ).length;
  const assignedCount = mergedLeads.filter((lead) => lead.owner_id).length;

  // ─── DnD sensors: require 8px movement so click still works ───────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const leadId = String(active.id);
    const newStatus = String(over.id) as LeadStatus;
    const lead = mergedLeads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    // Optimistic UI
    setOptimistic((prev) => ({ ...prev, [leadId]: newStatus }));

    startTransition(async () => {
      try {
        await moveLeadAction(leadId, newStatus);
        router.refresh();
      } catch {
        // Revert on failure
        setOptimistic((prev) => {
          const next = { ...prev };
          delete next[leadId];
          return next;
        });
      }
    });
  }

  const activeLead = activeId ? mergedLeads.find((l) => l.id === activeId) : null;

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--admin-accent)]">CRM OS</p>
          <h2 className="mt-2 max-w-[13ch] text-[34px] font-semibold leading-[1.02] tracking-tight text-[var(--admin-text)]">
            Turn inbound demand into clear next moves.
          </h2>
          <p className="mt-4 max-w-[68ch] text-[14.5px] leading-relaxed text-[var(--admin-muted)]">
            Every message becomes an operator card: source, intent signal, owner, timeline, and the next action without hunting through a table.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Total" value={leads.length} hint="All captured leads" />
          <MetricCard label="New" value={newCount} hint="Need first action" />
          <MetricCard label="Qualified+" value={qualifiedCount} hint="High intent demand" />
          <MetricCard label="Assigned" value={assignedCount} hint="Owned follow-ups" />
        </div>
      </section>

      <section className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Select value={source} onChange={(event) => setSource(event.target.value as LeadSource | "all")} aria-label="Filter by source">
            <option value="all">All sources</option>
            {sources.map((sourceOption) => (
              <option key={sourceOption} value={sourceOption}>
                {sourceLabels[sourceOption]}
              </option>
            ))}
          </Select>

          <div className="flex flex-wrap gap-2">
            <FilterChip active={status === "all"} onClick={() => setStatus("all")}>All</FilterChip>
            {statuses.map((stage) => (
              <FilterChip key={stage} active={status === stage} onClick={() => setStatus(stage)}>
                {statusLabels[stage]}
              </FilterChip>
            ))}
          </div>
        </div>
      </section>


      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto pb-3">
          <div className="grid min-w-[1320px] grid-cols-[repeat(5,minmax(250px,1fr))] gap-4">
            {grouped.map((column) => (
              <DroppableColumn
                key={column.status}
                status={column.status}
                count={column.items.length}
              >
                {column.items.length === 0 ? (
                  <div className="border border-dashed border-[var(--admin-border)] px-3 py-6 text-center text-[12px] text-[var(--admin-subtle)]">
                    No leads
                  </div>
                ) : (
                  column.items.map((lead) => (
                    <DraggableCard key={lead.id} id={lead.id}>
                      <LeadCard
                        lead={lead}
                        staff={staff}
                        selected={lead.id === selectedId}
                        onOpen={() => setSelectedId(lead.id)}
                      />
                    </DraggableCard>
                  ))
                )}
              </DroppableColumn>
            ))}
          </div>
        </div>

        {/* Ghost card that follows the cursor while dragging */}
        <DragOverlay dropAnimation={null}>
          {activeLead ? (
            <div className="-rotate-1 shadow-2xl opacity-95">
              <LeadCard
                lead={activeLead}
                staff={staff}
                selected={false}
                onOpen={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <LeadDrawer lead={selected} staff={staff} forms={forms} onClose={() => setSelectedId(null)} />
    </div>
  );
}
