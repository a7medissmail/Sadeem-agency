import Link from "next/link";

/**
 * Pagination — Sadeem Design System v1.0, audit finding A10.
 *
 * "Page 1 / 4" cannot answer the question triage actually asks, which is "how
 * much is there?". A queue of 19 and a queue of 1,900 need different plans for
 * the morning, and prev/next alone hides which one you are in.
 *
 * So: the range and the total in words, a page-size control, and numbered pages
 * around the current one. Counts are mono with tabular figures so they stop
 * jittering as you page through.
 */

type Props = {
  page: number;
  totalPages: number;
  basePath: string;
  /** Total matching records, not the count on this page. */
  total?: number;
  /** Rows per page, used to compute the displayed range. */
  pageSize?: number;
  /** Noun for the records, e.g. "leads". */
  unit?: string;
  /** Extra query params to preserve (e.g. { q: "ahmed" }) */
  queryParams?: Record<string, string>;
  /** Offered page sizes. Omit to hide the control. */
  pageSizes?: number[];
};

function buildUrl(basePath: string, params: Record<string, string>) {
  const p = new URLSearchParams(params);
  return `${basePath}?${p.toString()}`;
}

/** At most seven slots: first, a window around the current page, last. */
function pageWindow(page: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const out: (number | "gap")[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(totalPages - 1, page + 1);
  if (from > 2) out.push("gap");
  for (let i = from; i <= to; i++) out.push(i);
  if (to < totalPages - 1) out.push("gap");
  out.push(totalPages);
  return out;
}

const slot =
  "inline-flex h-[var(--sdm-control-sm)] min-w-[var(--sdm-control-sm)] items-center justify-center rounded-[var(--sdm-radius-md)] border px-2 sdm-metadata transition-colors outline-none focus-visible:shadow-[var(--sdm-ring)]";
const idle =
  "border-[var(--sdm-border-default)] text-[var(--admin-muted)] hover:border-[var(--sdm-border-strong)] hover:text-[var(--admin-text)]";
const current =
  "border-[var(--sdm-border-selected)] bg-[var(--sdm-surface-selected)] text-[var(--admin-text)]";
const disabled =
  "border-[var(--sdm-border-subtle)] text-[var(--sdm-text-disabled)] cursor-not-allowed";

export function AdminPagination({
  page,
  totalPages,
  basePath,
  total,
  pageSize,
  unit = "records",
  queryParams = {},
  pageSizes,
}: Props) {
  // Nothing to page through, but the count is still worth stating on its own.
  if (totalPages <= 1 && total === undefined) return null;

  const href = (p: number) => buildUrl(basePath, { ...queryParams, page: String(p) });
  const from = pageSize ? (page - 1) * pageSize + 1 : null;
  const to = pageSize && total !== undefined ? Math.min(page * pageSize, total) : null;

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--sdm-border-default)] pt-5"
    >
      <p className="sdm-metadata text-[var(--admin-muted)]">
        {total !== undefined && from !== null && to !== null ? (
          <>
            <span className="text-[var(--admin-text)]">
              {from}&ndash;{to}
            </span>{" "}
            of <span className="text-[var(--admin-text)]">{total}</span> {unit}
          </>
        ) : (
          <>
            Page {page} / {totalPages}
          </>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-4">
        {pageSizes?.length ? (
          <div className="flex items-center gap-1">
            <span className="sdm-metadata me-1 text-[var(--sdm-text-disabled)]">Rows</span>
            {pageSizes.map((size) => (
              <Link
                key={size}
                href={buildUrl(basePath, { ...queryParams, page: "1", pageSize: String(size) })}
                aria-current={pageSize === size ? "true" : undefined}
                className={`${slot} ${pageSize === size ? current : idle}`}
              >
                {size}
              </Link>
            ))}
          </div>
        ) : null}

        {totalPages > 1 ? (
          <div className="flex items-center gap-1">
            {page > 1 ? (
              <Link href={href(page - 1)} rel="prev" className={`${slot} ${idle}`}>
                Previous
              </Link>
            ) : (
              <span aria-hidden="true" className={`${slot} ${disabled}`}>
                Previous
              </span>
            )}

            {pageWindow(page, totalPages).map((p, i) =>
              p === "gap" ? (
                <span key={`gap-${i}`} className="sdm-metadata px-1 text-[var(--sdm-text-disabled)]">
                  &hellip;
                </span>
              ) : (
                <Link
                  key={p}
                  href={href(p)}
                  aria-current={p === page ? "page" : undefined}
                  className={`${slot} ${p === page ? current : idle}`}
                >
                  {p}
                </Link>
              ),
            )}

            {page < totalPages ? (
              <Link href={href(page + 1)} rel="next" className={`${slot} ${idle}`}>
                Next
              </Link>
            ) : (
              <span aria-hidden="true" className={`${slot} ${disabled}`}>
                Next
              </span>
            )}
          </div>
        ) : null}
      </div>
    </nav>
  );
}
