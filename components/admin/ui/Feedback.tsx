import type { ReactNode } from "react";
import { toneClass, type StatusTone } from "@/lib/admin/status";

/**
 * Scoped feedback — Sadeem Design System v1.0.
 *
 * The system distinguishes three carriers and does not let them substitute for
 * one another:
 *
 *   Toast         a completed action, 5 s, with Undo where reversible
 *   InlineAlert   something scoped to a section — this component
 *   Banner        product-wide state only, such as maintenance mode
 *
 * Before this, the same twenty-one-times-repeated amber div carried every one
 * of those jobs, so a failed database read and a routine notice looked
 * identical and neither offered a way forward.
 */

export function InlineAlert({
  tone = "warning",
  title,
  action,
  children,
}: {
  tone?: StatusTone;
  /** A short statement of what happened. The body says what to do about it. */
  title?: ReactNode;
  /** The way forward. An alert with no next step is a dead end. */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`${toneClass[tone]} flex flex-wrap items-start justify-between gap-4 rounded-[var(--sdm-radius-md)] border border-[var(--tone-line)] bg-[var(--tone-bg)] px-4 py-3`}
    >
      <div className="min-w-0 flex-1">
        {title ? <p className="sdm-card-title text-[var(--tone-fg)]">{title}</p> : null}
        <div className={`sdm-body-small text-[var(--tone-fg)]${title ? " mt-1" : ""}`}>{children}</div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/**
 * Product-wide state. Deliberately separate from InlineAlert so that reaching
 * for it is a decision — a banner interrupts every screen, and almost nothing
 * earns that.
 */
export function Banner({
  tone = "warning",
  action,
  children,
}: {
  tone?: StatusTone;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      role="status"
      className={`${toneClass[tone]} flex flex-wrap items-center justify-between gap-4 border-b border-[var(--tone-line)] bg-[var(--tone-bg)] px-5 py-2.5 sdm-body-small text-[var(--tone-fg)]`}
    >
      <span className="min-w-0">{children}</span>
      {action ? <span className="shrink-0">{action}</span> : null}
    </div>
  );
}
