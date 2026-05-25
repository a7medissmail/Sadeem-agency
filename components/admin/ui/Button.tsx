import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2.5 font-mono uppercase tracking-[0.22em] transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[10px]",
  md: "px-5 py-2.5 text-[11px]",
};
const variants: Record<Variant, string> = {
  primary: "bg-[var(--admin-accent)] text-white hover:brightness-110",
  outline:
    "border border-[var(--admin-accent)] text-[var(--admin-accent)] hover:bg-[var(--admin-accent-soft)]",
  ghost: "text-[var(--admin-muted)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-panel-hover)]",
  danger: "text-red-300 hover:text-red-200 hover:bg-red-500/10",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function Button({ variant = "primary", size = "md", className, children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={[base, sizes[size], variants[variant], className].filter(Boolean).join(" ")}
    >
      {children}
    </button>
  );
}
