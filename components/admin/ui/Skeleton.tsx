/**
 * Loading skeletons — Sadeem Design System v1.0.
 *
 * The skeleton carries the real geometry: same row height, same column ratios,
 * same badge shape. Nothing jumps when the data lands, which is the only reason
 * a skeleton beats a spinner. A skeleton that is three grey bars of arbitrary
 * width is just a spinner that takes up more room.
 *
 * Spinners are allowed inside a button, or for a wait under 400 ms. Nowhere
 * else.
 *
 * The pulse stops under prefers-reduced-motion, via the admin-scoped rule in
 * globals.css — an indefinite animation is the clearest case the preference is
 * asking about.
 */

const bone = "animate-pulse rounded-[var(--sdm-radius-sm)] bg-[var(--sdm-surface-hover)]";

export function Skeleton({ className = "", width }: { className?: string; width?: string }) {
  return <span aria-hidden="true" className={`block ${bone} ${className}`} style={width ? { width } : undefined} />;
}

/**
 * Rows matching the table's own geometry — 44 px rows, the column ratios you
 * pass in, and a pill in whichever column holds the status.
 */
export function SkeletonRows({
  rows = 8,
  /** Same grid template the real table uses, so the columns line up exactly. */
  columns = "2fr 2fr 1fr 1fr 1fr",
  /** Zero-based index of the column that renders a badge rather than text. */
  badgeColumn,
  label = "Loading",
}: {
  rows?: number;
  columns?: string;
  badgeColumn?: number;
  label?: string;
}) {
  // Uneven widths so the placeholder reads as text rather than as a chart.
  const widths = ["78%", "88%", "62%", "70%", "54%", "66%"];
  const count = columns.trim().split(/\s+/).length;

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className="overflow-hidden rounded-[var(--sdm-radius-lg)] border border-[var(--sdm-border-default)]"
    >
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid min-h-[44px] items-center gap-4 border-b border-[var(--sdm-border-subtle)] px-3 last:border-0"
          style={{ gridTemplateColumns: columns }}
        >
          {Array.from({ length: count }).map((__, c) =>
            c === badgeColumn ? (
              <Skeleton key={c} className="h-[18px] w-[76px] rounded-[var(--sdm-radius-full)]" />
            ) : (
              <Skeleton key={c} className="h-[10px]" width={widths[(r + c) % widths.length]} />
            ),
          )}
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Card-shaped placeholder for the metric tiles above a board. */
export function SkeletonTiles({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-busy="true" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-[var(--sdm-radius-lg)] border border-[var(--sdm-border-default)] bg-[var(--admin-panel)] p-5"
        >
          <Skeleton className="h-[11px] w-[52%]" />
          <Skeleton className="mt-3 h-[34px] w-[38%]" />
          <Skeleton className="mt-3 h-[10px] w-[70%]" />
        </div>
      ))}
    </div>
  );
}
