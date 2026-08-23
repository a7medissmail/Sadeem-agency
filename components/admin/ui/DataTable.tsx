"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Button } from "./Button";

/**
 * DataTable — Sadeem Design System v1.0, audit finding A09.
 *
 * The most consequential fix in the system. The admin's most important
 * component was its least capable one: a div grid with no semantic table, no
 * sortable header, no sticky header, no row selection, no bulk actions, no
 * column control and no row hover. Every board that needed any of those grew
 * its own version.
 *
 * What the system fixes in here:
 *   · a real <table> with <thead>/<th scope="col">, so screen readers and
 *     keyboard users get the structure the visual grid was only implying
 *   · sticky header, 44 px single-line rows
 *   · sort on the columns the caller says are sortable, and only those —
 *     never offer a sort the server cannot honour
 *   · selection with a bulk bar that *replaces* the toolbar rather than
 *     floating over the content the user is trying to read
 *   · a column control, six visible maximum
 *   · below 720 px rows become cards, never a shrunken table
 *
 * Column rules the type encodes: column one is the human identifier and links
 * to the detail page, status lives in the first three, dates are mono with
 * tabular figures, actions are last and right-aligned, and cells truncate
 * rather than wrapping onto a second line.
 */

export type Column<T> = {
  key: string;
  label: string;
  cell: (row: T) => ReactNode;
  /**
   * Sort accessor. Omit to leave the column unsortable — do that whenever the
   * server cannot sort on it, so the header never promises what it cannot do.
   */
  sortValue?: (row: T) => string | number | null | undefined;
  /** Grid width for this column, e.g. "2fr" or "160px". */
  width?: string;
  /**
   * 1 survives every breakpoint · 2 drops below 1080 · 3 drops below 1280.
   * The identifier column is pinned regardless.
   */
  priority?: 1 | 2 | 3;
  align?: "start" | "end";
  /** Machine-shaped value: mono, tabular figures. Dates, IDs, counts. */
  mono?: boolean;
  /** Hidden by default; reachable from the Columns control. */
  optional?: boolean;
};

type SortDir = "asc" | "desc";

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  /** Rendered above the table: search, filter chips. Replaced by the bulk bar. */
  toolbar,
  /** Given the selected ids. Omit to disable selection entirely. */
  bulkActions,
  /** At most two visible. Destructive actions live on the detail page, not here. */
  rowActions,
  /** Shown in place of the table body when there is nothing to show. */
  empty,
  caption,
  /** Rendered under the table — pagination, usually. */
  footer,
}: {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  toolbar?: ReactNode;
  bulkActions?: (selected: string[], clear: () => void) => ReactNode;
  rowActions?: (row: T) => ReactNode;
  empty?: ReactNode;
  caption?: string;
  footer?: ReactNode;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [hidden, setHidden] = useState<string[]>(() =>
    columns.filter((c) => c.optional).map((c) => c.key),
  );
  const [columnsOpen, setColumnsOpen] = useState(false);

  const visible = columns.filter((c) => !hidden.includes(c.key));
  const selectable = Boolean(bulkActions);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return rows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1; // empties sink, whichever direction
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, columns, sortKey, sortDir]);

  const allIds = sorted.map(getRowId);
  const allSelected = allIds.length > 0 && selected.length === allIds.length;
  const someSelected = selected.length > 0 && !allSelected;
  const clear = () => setSelected([]);

  function toggleSort(col: Column<T>) {
    if (!col.sortValue) return;
    if (sortKey === col.key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(col.key);
      setSortDir("asc");
    }
  }

  const priorityClass = (p?: 1 | 2 | 3) =>
    p === 3 ? "hidden xl:table-cell" : p === 2 ? "hidden lg:table-cell" : "";

  return (
    <section className="flex flex-col gap-4">
      {/*
        The bulk bar replaces the toolbar rather than floating over the content
        — a bar hovering above the rows hides the very thing being acted on.
      */}
      {selectable && selected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--sdm-radius-md)] border border-[var(--sdm-border-selected)] bg-[var(--sdm-surface-selected)] px-4 py-2.5">
          <span className="sdm-metadata text-[var(--admin-text)]">
            {selected.length} selected
          </span>
          <Button variant="ghost" size="sm" onClick={clear}>
            Clear
          </Button>
          <span className="ms-auto flex flex-wrap items-center gap-2">
            {bulkActions!(selected, clear)}
          </span>
        </div>
      ) : (
        (toolbar || columns.some((c) => c.optional)) && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{toolbar}</div>
            {columns.some((c) => c.optional) ? (
              <div className="relative">
                <Button
                  variant="tertiary"
                  size="sm"
                  aria-expanded={columnsOpen}
                  onClick={() => setColumnsOpen((o) => !o)}
                >
                  Columns
                </Button>
                {columnsOpen ? (
                  <div className="absolute end-0 z-30 mt-1 min-w-[200px] rounded-[var(--sdm-radius-lg)] border border-[var(--sdm-border-strong)] bg-[var(--sdm-surface-overlay)] p-2 shadow-[var(--sdm-elevation-medium)]">
                    {columns.map((c, i) => (
                      <label
                        key={c.key}
                        className="flex cursor-pointer items-center gap-2 rounded-[var(--sdm-radius-md)] px-2 py-1.5 sdm-body-small hover:bg-[var(--sdm-surface-hover)]"
                      >
                        <input
                          type="checkbox"
                          className="accent-[var(--sdm-action-primary)]"
                          checked={!hidden.includes(c.key)}
                          // Column one is the identifier; hiding it leaves rows
                          // with nothing to identify them by.
                          disabled={i === 0}
                          onChange={(e) =>
                            setHidden((h) =>
                              e.target.checked ? h.filter((k) => k !== c.key) : [...h, c.key],
                            )
                          }
                        />
                        {c.label}
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )
      )}

      {sorted.length === 0 && empty ? (
        empty
      ) : (
        <>
          {/* ≥720: the real table. */}
          <div className="hidden overflow-x-auto rounded-[var(--sdm-radius-lg)] border border-[var(--sdm-border-default)] sm:block">
            <table className="w-full border-collapse text-start">
              {caption ? <caption className="sr-only">{caption}</caption> : null}
              <thead className="sticky top-0 z-10 bg-[var(--sdm-surface-subtle)]">
                <tr className="border-b border-[var(--sdm-border-default)]">
                  {selectable ? (
                    <th scope="col" className="w-[44px] px-3">
                      <input
                        type="checkbox"
                        aria-label={allSelected ? "Clear selection" : "Select all rows"}
                        className="accent-[var(--sdm-action-primary)]"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected;
                        }}
                        onChange={() => setSelected(allSelected ? [] : allIds)}
                      />
                    </th>
                  ) : null}

                  {visible.map((c) => {
                    const active = sortKey === c.key;
                    return (
                      <th
                        key={c.key}
                        scope="col"
                        aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                        className={`sdm-table-header whitespace-nowrap px-3 py-2.5 text-[var(--sdm-text-tertiary)] ${
                          c.align === "end" ? "text-end" : "text-start"
                        } ${priorityClass(c.priority)}`}
                        style={c.width ? { width: c.width } : undefined}
                      >
                        {c.sortValue ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(c)}
                            className="inline-flex items-center gap-1 rounded-[var(--sdm-radius-sm)] outline-none transition-colors hover:text-[var(--admin-text)] focus-visible:shadow-[var(--sdm-ring)]"
                          >
                            {c.label}
                            <span aria-hidden="true" className={active ? "" : "opacity-0"}>
                              {sortDir === "asc" ? "↑" : "↓"}
                            </span>
                          </button>
                        ) : (
                          c.label
                        )}
                      </th>
                    );
                  })}

                  {rowActions ? (
                    <th scope="col" className="sdm-table-header px-3 py-2.5 text-end text-[var(--sdm-text-tertiary)]">
                      Actions
                    </th>
                  ) : null}
                </tr>
              </thead>

              <tbody>
                {sorted.map((row) => {
                  const id = getRowId(row);
                  const isSelected = selected.includes(id);
                  return (
                    <tr
                      key={id}
                      data-selected={isSelected || undefined}
                      className="border-b border-[var(--sdm-border-subtle)] transition-colors last:border-0 hover:bg-[var(--sdm-surface-hover)] data-[selected]:bg-[var(--sdm-surface-selected)]"
                    >
                      {selectable ? (
                        <td className="px-3">
                          <input
                            type="checkbox"
                            aria-label={`Select row ${id}`}
                            className="accent-[var(--sdm-action-primary)]"
                            checked={isSelected}
                            onChange={() =>
                              setSelected((s) =>
                                s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
                              )
                            }
                          />
                        </td>
                      ) : null}

                      {visible.map((c) => (
                        <td
                          key={c.key}
                          className={`h-[44px] max-w-0 truncate px-3 ${
                            c.mono ? "sdm-metadata" : "sdm-table-cell"
                          } ${c.align === "end" ? "text-end" : "text-start"} ${priorityClass(c.priority)}`}
                        >
                          {c.cell(row)}
                        </td>
                      ))}

                      {rowActions ? (
                        <td className="h-[44px] whitespace-nowrap px-3 text-end">
                          <span className="inline-flex items-center justify-end gap-1">
                            {rowActions(row)}
                          </span>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/*
            <720: cards. Identifier, status, one metadata line, one action —
            never a shrunken table, which is unreadable at both ends.
          */}
          <ul className="flex flex-col gap-2 sm:hidden">
            {sorted.map((row) => {
              const id = getRowId(row);
              const [identifier, ...rest] = visible;
              const badge = rest.find((c) => c.priority === 1);
              const meta = rest.filter((c) => c !== badge).slice(0, 2);
              return (
                <li
                  key={id}
                  className="rounded-[var(--sdm-radius-lg)] border border-[var(--sdm-border-default)] bg-[var(--admin-panel)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="sdm-card-title min-w-0 truncate">{identifier.cell(row)}</div>
                    {badge ? <div className="shrink-0">{badge.cell(row)}</div> : null}
                  </div>
                  {meta.length ? (
                    <p className="sdm-metadata mt-2 truncate text-[var(--admin-muted)]">
                      {meta.map((c, i) => (
                        <span key={c.key}>
                          {i > 0 ? " · " : ""}
                          {c.cell(row)}
                        </span>
                      ))}
                    </p>
                  ) : null}
                  {rowActions ? <div className="mt-3 flex gap-2">{rowActions(row)}</div> : null}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {footer}
    </section>
  );
}
