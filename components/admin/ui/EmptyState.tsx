import type { ReactNode } from "react";

/**
 * Empty states — Sadeem Design System v1.0, audit finding A11.
 *
 * The old EmptyState took a title and a hint and nothing else, so "No upcoming
 * bookings." told the user nothing about what to do next — and it could not
 * tell apart a board nobody has used yet from a filter that happens to match
 * zero rows. Those are completely different problems and they were rendering
 * identically across eighteen hand-written copies.
 *
 *   first-use  nothing exists yet     dashed border, primary action
 *   filtered   the filters matched 0  solid panel, quote the filters, clear them
 *   forbidden  the role lacks access  explain the role, offer to request it
 *   error      the read failed        say what failed, offer to retry
 */

type Kind = "first-use" | "filtered" | "forbidden" | "error";

const frame: Record<Kind, string> = {
  // Dashed reads as "this space is waiting to be filled".
  "first-use": "border border-dashed border-[var(--sdm-border-default)] bg-transparent",
  // Solid reads as "there is a real thing here, it is just hidden right now".
  filtered: "border border-[var(--sdm-border-default)] bg-[var(--admin-panel)]",
  forbidden: "border border-[var(--sdm-border-default)] bg-[var(--admin-panel)]",
  error: "sdm-tone-danger border border-[var(--tone-line)] bg-[var(--tone-bg)]",
};

export function EmptyState({
  kind = "first-use",
  title,
  /** What this board is for, or which filters are active, or which role is missing. */
  hint,
  /** Create the first record · clear the filters · request access · retry. */
  action,
}: {
  kind?: Kind;
  title: string;
  hint?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={`${frame[kind]} rounded-[var(--sdm-radius-lg)] px-5 py-12 text-center`}>
      <p
        className={`sdm-card-title ${
          kind === "error" ? "text-[var(--tone-fg)]" : "text-[var(--admin-text)]"
        }`}
      >
        {title}
      </p>
      {hint ? (
        <p className="sdm-body-small mx-auto mt-2 max-w-[52ch] text-[var(--admin-muted)]">{hint}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

