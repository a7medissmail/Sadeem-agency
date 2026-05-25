import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

export function Label({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--admin-muted)]">{children}</span>
  );
}

const fieldBase =
  "bg-transparent border border-[var(--admin-border)] px-3 py-2 outline-none focus:border-[var(--admin-accent)] aria-[invalid=true]:border-red-400/70 text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)] transition-colors";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input {...rest} className={[fieldBase, className].filter(Boolean).join(" ")} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea {...rest} className={[fieldBase, "min-h-[96px] resize-y", className].filter(Boolean).join(" ")} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      className={[
        "bg-[var(--admin-surface-strong)] border border-[var(--admin-border)] px-3 py-2 outline-none focus:border-[var(--admin-accent)] text-[var(--admin-text)] transition-colors",
        className,
      ].filter(Boolean).join(" ")}
    >
      {children}
    </select>
  );
}

export function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </label>
  );
}
