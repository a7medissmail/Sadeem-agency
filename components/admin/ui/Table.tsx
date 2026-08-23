import type { ReactNode } from "react";

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <section className="border border-[var(--sdm-border-default)] rounded-[var(--sdm-radius-lg)] bg-[var(--admin-panel)] overflow-hidden">
      {children}
    </section>
  );
}

export function TableHeader({ children }: { children: ReactNode }) {
  return (
    <div className="sdm-table-header grid gap-4 px-3 py-3 border-b border-[var(--sdm-border-default)] text-[var(--sdm-text-tertiary)]">
      {children}
    </div>
  );
}

export function TableRow({ children }: { children: ReactNode }) {
  return (
    <div className="sdm-table-cell grid min-h-[44px] gap-4 px-3 items-center border-b border-[var(--sdm-border-subtle)] last:border-0">
      {children}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-[14px] text-[var(--admin-muted)]">{title}</p>
      {hint ? <p className="mt-1 text-[13px] text-[var(--admin-subtle)]">{hint}</p> : null}
    </div>
  );
}
