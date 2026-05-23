import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div>
        {eyebrow ? (
          <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-[#ff6a00]">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-2 text-[14px] text-white/55 max-w-[60ch]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
    </div>
  );
}
