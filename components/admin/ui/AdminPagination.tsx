import Link from "next/link";

type Props = {
  page: number;
  totalPages: number;
  basePath: string;
  /** Extra query params to preserve (e.g. { q: "ahmed" }) */
  queryParams?: Record<string, string>;
};

function buildUrl(basePath: string, page: number, qp: Record<string, string>) {
  const p = new URLSearchParams({ ...qp, page: String(page) });
  return `${basePath}?${p.toString()}`;
}

/**
 * Simple server-rendered previous/next pagination.
 * Renders nothing when totalPages <= 1.
 */
export function AdminPagination({ page, totalPages, basePath, queryParams = {} }: Props) {
  if (totalPages <= 1) return null;

  const prevUrl = page > 1 ? buildUrl(basePath, page - 1, queryParams) : null;
  const nextUrl = page < totalPages ? buildUrl(basePath, page + 1, queryParams) : null;

  const linkCls =
    "border border-[var(--admin-border)] px-4 py-2 text-[var(--admin-muted)] transition-colors hover:border-[var(--admin-accent)] hover:text-[var(--admin-text)]";
  const disabledCls =
    "cursor-not-allowed border border-[var(--admin-border)] px-4 py-2 text-[var(--admin-muted)] opacity-30";

  return (
    <div className="flex items-center justify-between gap-4 border-t border-[var(--admin-border)] pt-5 font-mono text-[11px] uppercase tracking-[0.18em]">
      <span className="text-[var(--admin-muted)]">
        Page {page} / {totalPages}
      </span>
      <div className="flex gap-2">
        {prevUrl ? (
          <Link href={prevUrl} className={linkCls}>
            ← Prev
          </Link>
        ) : (
          <span className={disabledCls}>← Prev</span>
        )}
        {nextUrl ? (
          <Link href={nextUrl} className={linkCls}>
            Next →
          </Link>
        ) : (
          <span className={disabledCls}>Next →</span>
        )}
      </div>
    </div>
  );
}
