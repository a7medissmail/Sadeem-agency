import type { ReactNode } from "react";

type Tone = "neutral" | "orange" | "blue" | "green" | "amber" | "red" | "violet";

const tones: Record<Tone, string> = {
  neutral: "text-[var(--admin-muted)] border-[var(--admin-border)] bg-[var(--admin-panel)]",
  orange: "text-[var(--admin-accent)] border-[var(--admin-accent)] bg-[var(--admin-accent-soft)]",
  blue: "text-sky-300 border-sky-400/30 bg-sky-400/[0.08]",
  green: "text-emerald-300 border-emerald-400/30 bg-emerald-400/[0.08]",
  amber: "text-amber-200 border-amber-400/30 bg-amber-400/[0.08]",
  red: "text-red-300 border-red-400/30 bg-red-400/[0.08]",
  violet: "text-violet-300 border-violet-400/30 bg-violet-400/[0.08]",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={[
        "inline-flex items-center px-2 py-0.5 rounded-full border font-mono text-[10px] tracking-[0.16em] uppercase",
        tones[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}
