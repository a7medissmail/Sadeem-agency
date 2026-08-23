/**
 * lib/admin/status.ts
 * ───────────────────
 * Which stage of which entity earns which tone — audit finding A08.
 *
 * Before this file, every board picked its own colours: "new" was orange on
 * Applications and blue on Leads, "draft" was blue on Proposals and neutral on
 * Campaigns. sky-300, emerald-300, amber-200, red-300 and violet-300 were
 * Tailwind defaults sitting inside a hand-tuned warm-neutral palette.
 *
 * The ladder is the same shape for every entity, so a colour means the same
 * thing whichever board it appears on:
 *
 *   neutral   parked        nothing is happening and nothing should be
 *   info      in flight     moving, no action needed from us
 *   brand     nearly there  the last step before the outcome
 *   warning   waiting on us the queue that should be worked today
 *   success   won           the good terminal state
 *   danger    lost          the bad terminal state
 *
 * Note what is deliberately absent: nothing is "orange because it matters".
 * Brand is a position on the ladder, not an emphasis dial.
 */

export type StatusTone = "neutral" | "info" | "brand" | "warning" | "success" | "danger";

export const toneClass: Record<StatusTone, string> = {
  neutral: "sdm-tone-neutral",
  info: "sdm-tone-info",
  brand: "sdm-tone-brand",
  warning: "sdm-tone-warning",
  success: "sdm-tone-success",
  danger: "sdm-tone-danger",
};

/**
 * Every lifecycle in the product. Keys match the database values, so a new
 * stage that is not listed here fails loudly at the call site rather than
 * silently rendering grey.
 */
export const statusLadders = {
  lead: {
    new: "warning",
    contacted: "info",
    qualified: "brand",
    won: "success",
    lost: "danger",
  },
  booking: {
    scheduled: "info",
    completed: "success",
    cancelled: "neutral",
    no_show: "danger",
  },
  application: {
    new: "warning",
    review: "info",
    interview: "info",
    offer: "brand",
    rejected: "danger",
  },
  proposal: {
    draft: "neutral",
    sent: "info",
    opened: "info",
    in_progress: "info",
    submitted: "warning",
    reviewed: "brand",
    converted: "success",
    expired: "neutral",
  },
  submission: {
    new: "warning",
    reviewed: "info",
    converted: "success",
    archived: "neutral",
  },
  campaign: {
    draft: "neutral",
    sending: "info",
    sent: "success",
    failed: "danger",
  },
} as const satisfies Record<string, Record<string, StatusTone>>;

export type StatusEntity = keyof typeof statusLadders;

/**
 * Published / active / open all mean the same thing across nine boards, so
 * they share one helper rather than nine inline ternaries.
 */
export function publicationTone(isLive: boolean): StatusTone {
  return isLive ? "success" : "neutral";
}

export function statusTone<E extends StatusEntity>(
  entity: E,
  status: keyof (typeof statusLadders)[E],
): StatusTone {
  return statusLadders[entity][status] as StatusTone;
}
