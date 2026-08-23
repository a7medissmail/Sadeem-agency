import type { ReactNode } from "react";
import { UserValue } from "@/components/admin/ui/UserValue";

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
        {/*
          Audit finding A01 — the eyebrow used to be orange, which spent the
          accent on a decorative label. A section marker is metadata, not an
          action, so it is neutral now.
        */}
        {eyebrow ? <p className="sdm-eyebrow text-[var(--sdm-text-tertiary)]">{eyebrow}</p> : null}
        {/* On every detail page this H1 is a record name the user typed. */}
        <h1 className="sdm-page-title mt-2">
          <UserValue>{title}</UserValue>
        </h1>
        {description ? (
          <p className="sdm-body mt-2 text-[var(--admin-muted)] max-w-[60ch]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
    </div>
  );
}
