import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

/**
 * Form controls — Sadeem Design System v1.0.
 *
 * Audit finding A05: every label in the product was 10 px uppercase mono at
 * 0.22em tracking. It looked sharp in isolation and was the least legible text
 * in the tool — and it was the style users had to read in order to fill in a
 * form. Labels are sentence-case Geist now.
 *
 * Audit finding A06: that same style made Arabic impossible. Uppercase is a
 * no-op in Arabic and letter-spacing breaks glyph joining, and there was no
 * untracked label token to switch to. Now there is.
 *
 * Optional is marked, not required. In an admin tool most fields are required,
 * so marking the exception is quieter and more honest than decorating almost
 * every field with an asterisk.
 */

export function Label({ children }: { children: ReactNode }) {
  return <span className="sdm-form-label text-[var(--sdm-text-secondary)]">{children}</span>;
}

const fieldBase = [
  "bg-[var(--sdm-surface-base)] text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)]",
  "border border-[var(--sdm-border-default)] rounded-[var(--sdm-radius-md)] px-3",
  "sdm-body-small outline-none",
  "transition-[border-color,box-shadow] duration-[var(--sdm-motion-fast)] ease-[var(--sdm-ease)]",
  "hover:border-[var(--sdm-border-strong)]",
  "focus:border-[var(--sdm-border-focus)] focus:shadow-[var(--sdm-ring-field)]",
  "aria-[invalid=true]:border-[var(--sdm-border-danger)]",
  "aria-[invalid=true]:focus:shadow-[var(--sdm-ring-field-danger)]",
  "disabled:opacity-50 disabled:cursor-not-allowed",
].join(" ");

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      {...rest}
      className={[fieldBase, "h-[var(--sdm-control-md)]", className].filter(Boolean).join(" ")}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea
      {...rest}
      className={[fieldBase, "min-h-[96px] resize-y py-2", className].filter(Boolean).join(" ")}
    />
  );
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      className={[fieldBase, "h-[var(--sdm-control-md)]", className].filter(Boolean).join(" ")}
    >
      {children}
    </select>
  );
}

export function FieldRow({
  label,
  hint,
  error,
  optional = false,
  children,
}: {
  label: string;
  /** Why the field exists or what shape the value takes. Sits under the control. */
  hint?: string;
  /** Validation message. Replaces the hint rather than stacking under it. */
  error?: string;
  /** Most admin fields are required, so the exception is what gets marked. */
  optional?: boolean;
  children: ReactNode;
}) {
  // The message line is reserved whenever a field can produce one, so
  // validation never reflows the form around it.
  const reservesMessageLine = Boolean(hint || error);

  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline gap-2">
        <Label>{label}</Label>
        {optional ? <span className="sdm-caption text-[var(--sdm-text-disabled)]">optional</span> : null}
      </span>
      {children}
      {reservesMessageLine ? (
        <span className="min-h-[18px]">
          {error ? (
            <span className="sdm-helper-text text-[var(--sdm-text-danger)]">{error}</span>
          ) : (
            <span className="sdm-helper-text text-[var(--sdm-text-tertiary)]">{hint}</span>
          )}
        </span>
      ) : null}
    </label>
  );
}
