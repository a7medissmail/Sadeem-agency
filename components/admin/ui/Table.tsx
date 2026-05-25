import type { ReactNode } from "react";

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <section className="border border-[var(--admin-border)] rounded-xl bg-[var(--admin-panel)] overflow-hidden">
      {children}
    </section>
  );
}

export function TableHeader({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 px-5 py-3 border-b border-[var(--admin-border)] font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--admin-subtle)]">
      {children}
    </div>
  );
}

export function TableRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 px-5 py-3 items-center border-b border-[var(--admin-border-soft)] last:border-0 text-[13.5px]">
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
