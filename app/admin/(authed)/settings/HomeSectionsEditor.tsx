"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/admin/ui/Button";
import type { ResolvedHomeSection } from "@/lib/site/homeSections";
import { saveHomeSectionsAction } from "./actions";

type Entry = Pick<ResolvedHomeSection, "key" | "label" | "tone" | "hint" | "anchor" | "locked" | "enabled">;

function ToneDot({ tone }: { tone: "light" | "dark" }) {
  return (
    <span
      title={tone === "dark" ? "Dark background" : "Light background"}
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full border ${
        tone === "dark" ? "border-[var(--admin-border)] bg-[#111]" : "border-[var(--admin-border)] bg-[#f4f4f2]"
      }`}
    />
  );
}

function SortableSection({
  entry,
  number,
  onToggle,
}: {
  entry: Entry;
  number: string | null;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.key });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        position: "relative",
        zIndex: isDragging ? 1 : "auto",
      }}
      className={`flex items-stretch border ${
        entry.enabled ? "border-[var(--admin-border)]" : "border-dashed border-[var(--admin-border)]"
      } bg-[var(--admin-panel)]`}
    >
      <button
        type="button"
        className="form-drag-handle"
        title="Drag to reorder"
        aria-label={`Drag to reorder ${entry.label}`}
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>

      <div className="flex flex-1 flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            className={`w-[3ch] font-mono text-[13px] tabular-nums ${
              number ? "text-[var(--admin-accent)]" : "text-[var(--admin-subtle)]"
            }`}
          >
            {number ?? "—"}
          </span>
          <ToneDot tone={entry.tone} />
          <div>
            <p className={`text-[14px] ${entry.enabled ? "text-[var(--admin-text)]" : "text-[var(--admin-subtle)]"}`}>
              {entry.label}
              {entry.locked ? (
                <span className="ms-2 sdm-eyebrow text-[var(--admin-subtle)]">
                  Locked
                </span>
              ) : null}
            </p>
            <p className="mt-0.5 text-[12px] text-[var(--admin-muted)]">
              {entry.hint}
              {entry.anchor ? <span className="ms-2 font-mono text-[11px]">/#{entry.anchor}</span> : null}
            </p>
          </div>
        </div>

        <label
          className={`flex items-center gap-2 sdm-eyebrow ${
            entry.locked ? "cursor-not-allowed text-[var(--admin-subtle)]" : "cursor-pointer text-[var(--admin-muted)]"
          }`}
        >
          <input
            type="checkbox"
            checked={entry.enabled}
            disabled={entry.locked}
            onChange={onToggle}
            className="h-4 w-4 accent-[var(--admin-accent)]"
          />
          {entry.enabled ? "Visible" : "Hidden"}
        </label>
      </div>
    </div>
  );
}

export function HomeSectionsEditor({ sections }: { sections: ResolvedHomeSection[] }) {
  const [entries, setEntries] = useState<Entry[]>(() =>
    sections.map(({ key, label, tone, hint, anchor, locked, enabled }) => ({
      key,
      label,
      tone,
      hint,
      anchor,
      locked,
      enabled,
    })),
  );
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // The published number is position among *visible* sections — exactly what
  // the homepage computes, so this preview is the real thing.
  let visible = 0;
  const numbered = entries.map((entry) => ({
    entry,
    number: entry.enabled ? String((visible += 1)).padStart(2, "0") : null,
  }));
  const visibleCount = visible;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = entries.findIndex((entry) => entry.key === String(active.id));
    const newIndex = entries.findIndex((entry) => entry.key === String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    setEntries(arrayMove(entries, oldIndex, newIndex));
    setDirty(true);
    setStatus(null);
  }

  function toggle(key: string) {
    setEntries((current) =>
      current.map((entry) => (entry.key === key ? { ...entry, enabled: !entry.enabled } : entry)),
    );
    setDirty(true);
    setStatus(null);
  }

  function save() {
    startTransition(async () => {
      const result = await saveHomeSectionsAction(
        entries.map((entry) => ({ key: entry.key, enabled: entry.enabled })),
      );
      if (result.error) {
        setStatus(result.error);
        return;
      }
      setDirty(false);
      setStatus("Homepage updated.");
    });
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="sdm-eyebrow text-[var(--admin-subtle)]">
          Homepage sections — {visibleCount} visible, {entries.length - visibleCount} hidden
        </h2>
        <p className="text-[12.5px] text-[var(--admin-muted)]">
          Drag to reorder, uncheck to hide. Numbers re-flow automatically. ⚫⚪ = section background — keep dark and
          light alternating.
        </p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={entries.map((entry) => entry.key)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {numbered.map(({ entry, number }) => (
              <SortableSection key={entry.key} entry={entry} number={number} onToggle={() => toggle(entry.key)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={save} disabled={!dirty || saving}>
          {saving ? "Publishing…" : "Publish layout"}
        </Button>
        {dirty && !saving ? (
          <span className="sdm-eyebrow text-amber-400">Unpublished changes</span>
        ) : null}
        {status ? <span className="text-[13px] text-[var(--admin-muted)]">{status}</span> : null}
      </div>
    </section>
  );
}
