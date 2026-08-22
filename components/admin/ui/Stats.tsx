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
    <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">{label}</p>
      <div className="mt-3 text-[30px] font-semibold leading-none text-[var(--admin-text)]">{value}</div>
      {hint ? <p className="mt-3 text-[12.5px] text-[var(--admin-muted)]">{hint}</p> : null}
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
      className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${
        active
          ? "border-[var(--admin-accent)] bg-[var(--admin-accent-soft)] text-[var(--admin-text)]"
          : "border-[var(--admin-border)] text-[var(--admin-muted)] hover:border-[var(--admin-accent)] hover:text-[var(--admin-text)]"
      }`}
    >
      {children}
      {count != null ? <span className="ml-2 opacity-60">{count}</span> : null}
    </button>
  );
}
