"use client";

import type { ReactNode } from "react";

/**
 * Shared stat tile and filter chip.
 *
 * Both used to be copy-pasted into every board — MetricCard in 13 files,
 * FilterChip in 5 — with identical bodies. One definition each, so the admin
 * reads as one tool instead of 13 separate products.
 */

export function MetricCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-[var(--sdm-radius-lg)] border border-[var(--sdm-border-default)] bg-[var(--admin-panel)] p-5">
      <p className="sdm-eyebrow text-[var(--sdm-text-tertiary)]">{label}</p>
      {/*
        A01 — two of the four dashboard tiles used to glow orange with nothing
        to say whether that meant "selected", "urgent" or "good". A number is
        information; the tile stays neutral and the words carry the meaning.
      */}
      <div className="sdm-display mt-3 tabular-nums text-[var(--admin-text)]">{value}</div>
      {hint ? <p className="sdm-helper-text mt-3 text-[var(--admin-muted)]">{hint}</p> : null}
    </div>
  );
}

export function FilterChip({
  active,
  count,
  children,
  onClick,
}: {
  active: boolean;
  /** Optional tally rendered after the label. */
  count?: number;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`sdm-eyebrow rounded-[var(--sdm-radius-md)] border px-3 py-2 transition-colors outline-none focus-visible:shadow-[var(--sdm-ring)] ${
        active
          ? "border-[var(--sdm-border-selected)] bg-[var(--sdm-surface-selected)] text-[var(--admin-text)]"
          : "border-[var(--sdm-border-default)] text-[var(--admin-muted)] hover:border-[var(--sdm-border-strong)] hover:text-[var(--admin-text)]"
      }`}
    >
      {children}
      {count != null ? <span className="ml-2 opacity-60">{count}</span> : null}
    </button>
  );
}
