import type { ReactNode } from "react";
import { statusTone, toneClass, type StatusEntity, type StatusTone } from "@/lib/admin/status";

/**
 * Status badge — Sadeem Design System v1.0, audit finding A08.
 *
 * Tones are no longer free-choice Tailwind colours. Each one is a position on
 * the semantic ladder in lib/admin/status.ts, so a colour means the same thing
 * whichever board it appears on. A leading dot gives shape as a second channel:
 * status is a word first, a colour second, and never a colour alone.
 *
 * Prefer <StatusBadge entity="lead" status={lead.status}> — it takes the
 * lifecycle, not a colour, which is the whole point of the finding.
 */

/**
 * The pre-system tone names, kept so the existing call sites compile. They map
 * onto the ladder rather than onto their old Tailwind hue: `orange` was doing
 * emphasis duty (A01) and lands on brand, and `violet` had no meaning at all
 * beyond "a fifth colour", so it lands on info.
 */
const legacyTones = {
  neutral: "neutral",
  orange: "brand",
  blue: "info",
  green: "success",
  amber: "warning",
  red: "danger",
  violet: "info",
} as const satisfies Record<string, StatusTone>;

type LegacyTone = keyof typeof legacyTones;

const base =
  "inline-flex items-center gap-1.5 rounded-[var(--sdm-radius-sm)] border px-2 py-0.5 sdm-eyebrow " +
  "border-[var(--tone-line)] bg-[var(--tone-bg)] text-[var(--tone-fg)]";

export function Badge({
  tone = "neutral",
  dot = true,
  children,
}: {
  tone?: StatusTone | LegacyTone;
  /** Drop the dot only where shape is already carried by something else. */
  dot?: boolean;
  children: ReactNode;
}) {
  const resolved: StatusTone = tone in legacyTones ? legacyTones[tone as LegacyTone] : (tone as StatusTone);

  return (
    <span className={`${toneClass[resolved]} ${base}`}>
      {dot ? (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 shrink-0 rounded-[var(--sdm-radius-full)] bg-[var(--tone-fg)]"
        />
      ) : null}
      {children}
    </span>
  );
}

/**
 * Takes an entity and a stage, not a colour. Adding a stage to a lifecycle
 * means editing the ladder once, not hunting through nine boards.
 */
export function StatusBadge<E extends StatusEntity>({
  entity,
  status,
  label,
  dot = true,
}: {
  entity: E;
  status: Parameters<typeof statusTone<E>>[1];
  /** Display text, when it differs from the stored value. */
  label?: ReactNode;
  dot?: boolean;
}) {
  return (
    <Badge tone={statusTone(entity, status)} dot={dot}>
      {label ?? String(status)}
    </Badge>
  );
}
