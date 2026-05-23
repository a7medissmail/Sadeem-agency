import type { ReactNode } from "react";

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <section className="border border-white/10 rounded-xl bg-white/[0.02] overflow-hidden">
      {children}
    </section>
  );
}

export function TableHeader({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 px-5 py-3 border-b border-white/10 font-mono text-[10px] tracking-[0.2em] uppercase text-white/45">
      {children}
    </div>
  );
}

export function TableRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 px-5 py-3 items-center border-b border-white/5 last:border-0 text-[13.5px]">
      {children}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-[14px] text-white/70">{title}</p>
      {hint ? <p className="mt-1 text-[13px] text-white/40">{hint}</p> : null}
    </div>
  );
}
