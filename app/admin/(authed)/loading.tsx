/**
 * Admin section loading skeleton.
 * Rendered inside admin-content while a page server component is streaming.
 * The sidebar and topbar remain visible (they live in the layout).
 */
export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-8 animate-pulse" aria-hidden="true">
      {/* PageHeader skeleton */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3">
          <div className="h-2.5 w-24 rounded bg-[var(--admin-border)]" />
          <div className="h-8 w-56 rounded bg-[var(--admin-border)]" />
          <div className="h-4 w-96 max-w-full rounded bg-[var(--admin-border-soft)]" />
        </div>
        <div className="h-8 w-28 rounded bg-[var(--admin-border-soft)]" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex gap-3">
        <div className="h-9 w-64 rounded bg-[var(--admin-border-soft)]" />
        <div className="h-9 w-36 rounded bg-[var(--admin-border-soft)]" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)]">
        {/* Table header */}
        <div className="flex items-center gap-6 border-b border-[var(--admin-border)] px-4 py-3">
          {[48, 96, 80, 72, 56].map((w) => (
            <div key={w} className="h-2.5 rounded bg-[var(--admin-border)]" style={{ width: w }} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-6 border-b border-[var(--admin-border-soft)] px-4 py-4 last:border-0"
          >
            <div className="h-3.5 w-36 rounded bg-[var(--admin-border-soft)]" />
            <div className="h-3 w-48 rounded bg-[var(--admin-border-soft)]" />
            <div className="h-3 w-24 rounded bg-[var(--admin-border-soft)]" />
            <div className="h-5 w-16 rounded-full bg-[var(--admin-border-soft)]" />
            <div className="h-3 w-20 rounded bg-[var(--admin-border-soft)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
