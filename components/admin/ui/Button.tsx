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
  primary: "bg-[#ff6a00] text-white hover:bg-[#ff7d20]",
  outline:
    "border border-[#ff6a00]/70 text-[#ff6a00] hover:bg-[#ff6a00]/10",
  ghost: "text-white/60 hover:text-white hover:bg-white/5",
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
