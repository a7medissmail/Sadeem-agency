"use client";

import type { AutoSaveStatus } from "@/components/admin/hooks/useAutoSave";

/**
 * Inline save-state indicator that replaces the submit button in auto-save
 * edit forms. Renders nothing when status is "idle".
 */
export function SaveStatus({ status, error }: { status: AutoSaveStatus; error?: string | null }) {
  if (status === "idle") return null;

  // A08 — status colour comes from the Sadeem ramp, not from Tailwind defaults.
  const color =
    status === "saved"
      ? "text-[var(--sdm-text-success)]"
      : status === "error"
        ? "text-[var(--sdm-text-danger)]"
        : "text-[var(--admin-muted)]";

  const dot =
    status === "saving" ? (
      <span className="animate-pulse" aria-hidden="true">
        ●
      </span>
    ) : status === "saved" ? (
      <span aria-hidden="true">✓</span>
    ) : (
      <span aria-hidden="true">✕</span>
    );

  const label =
    status === "saving" ? "Saving" : status === "saved" ? "Saved" : (error ?? "Error");

  return (
    <div
      role="status"
      aria-live="polite"
      className={`sdm-eyebrow flex items-center gap-2 transition-colors ${color}`}
    >
      {dot}
      <span>{label}</span>
    </div>
  );
}
