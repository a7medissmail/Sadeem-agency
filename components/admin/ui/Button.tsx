import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Admin button — Sadeem Design System v1.0.
 *
 * Fixes three audit findings at once:
 *  • A02 — every variant now declares a focus-visible ring. Previously only
 *          inputs had one, so keyboard users lost their position entirely.
 *  • A03 — `danger` had no fill and no border, which made Delete lighter than
 *          Cancel. It now carries a border, a tinted fill, and fills solid on
 *          hover.
 *  • A01 — `outline` used to be an orange border with orange text, which spent
 *          the accent on secondary actions. It is now the neutral tertiary
 *          treatment; the name is kept so the 24 existing call sites still work.
 *
 * Sizes follow the system: sm 30 (table row actions) · md 36 (page headers and
 * forms) · lg 44 (touch and mobile primary).
 */

type Variant = "primary" | "secondary" | "tertiary" | "ghost" | "danger" | "link" | "icon";
type Size = "sm" | "md" | "lg";

const base = [
  "inline-flex items-center justify-center gap-2 whitespace-nowrap",
  "rounded-[var(--sdm-radius-md)] border",
  "font-semibold text-[13px] leading-4 tracking-[-0.005em]",
  "transition-[background-color,border-color,color,box-shadow] duration-[var(--sdm-motion-fast)] ease-[var(--sdm-ease)]",
  "outline-none focus-visible:shadow-[shadow:var(--sdm-ring)]",
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
].join(" ");

const sizes: Record<Size, string> = {
  sm: "h-[var(--sdm-control-sm)] px-3",
  md: "h-[var(--sdm-control-md)] px-4",
  lg: "h-[var(--sdm-control-lg)] px-5",
};

/** Icon-only buttons are square: width tracks the size token, padding goes to 0. */
const iconSizes: Record<Size, string> = {
  sm: "w-[var(--sdm-control-sm)] px-0",
  md: "w-[var(--sdm-control-md)] px-0",
  lg: "w-[var(--sdm-control-lg)] px-0",
};

const variants: Record<Variant, string> = {
  primary: [
    "border-[var(--sdm-action-primary)] bg-[var(--sdm-action-primary)] text-[var(--sdm-text-inverse)]",
    "hover:border-[var(--sdm-action-primary-hover)] hover:bg-[var(--sdm-action-primary-hover)]",
    "active:border-[var(--sdm-action-primary-active)] active:bg-[var(--sdm-action-primary-active)]",
  ].join(" "),
  secondary: [
    "border-[var(--sdm-border-strong)] bg-[var(--sdm-action-secondary)] text-[var(--sdm-text-primary)]",
    "hover:bg-[var(--sdm-surface-overlay)] hover:border-[var(--sdm-border-strong)]",
  ].join(" "),
  tertiary: [
    "border-[var(--sdm-border-default)] bg-transparent text-[var(--sdm-text-secondary)]",
    "hover:bg-[var(--sdm-surface-hover)] hover:text-[var(--sdm-text-primary)]",
  ].join(" "),
  ghost: [
    "border-transparent bg-transparent text-[var(--sdm-text-tertiary)]",
    "hover:bg-[var(--sdm-surface-hover)] hover:text-[var(--sdm-text-primary)]",
  ].join(" "),
  danger: [
    "border-[color-mix(in_srgb,var(--sdm-action-danger)_50%,transparent)]",
    "bg-[color-mix(in_srgb,var(--sdm-action-danger)_10%,transparent)]",
    "text-[var(--sdm-text-danger)]",
    "hover:border-[var(--sdm-action-danger)] hover:bg-[var(--sdm-action-danger)] hover:text-[var(--sdm-text-primary)]",
    "focus-visible:shadow-[shadow:var(--sdm-ring-danger)]",
  ].join(" "),
  link: [
    "border-transparent bg-transparent px-1 text-[var(--sdm-text-brand)]",
    "underline underline-offset-[3px] decoration-[color-mix(in_srgb,var(--sdm-text-brand)_40%,transparent)]",
    "hover:text-[var(--sdm-orange-300)] hover:decoration-[var(--sdm-orange-300)]",
  ].join(" "),
  icon: [
    "border-[var(--sdm-border-default)] bg-transparent text-[var(--sdm-text-tertiary)]",
    "hover:bg-[var(--sdm-surface-hover)] hover:text-[var(--sdm-text-primary)]",
  ].join(" "),
};

/**
 * Kept so the pre-system call sites keep compiling. `outline` was the orange
 * bordered button; it resolves to the neutral tertiary treatment now.
 */
type LegacyVariant = "outline";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant | LegacyVariant;
  size?: Size;
  /**
   * Keeps the button's width, swaps the label, and blocks re-submit.
   * Never the only explanation for why a control is unavailable.
   */
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
};

/** Forwards its ref so dialogs can put initial focus on a specific button. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, loadingLabel, className, disabled, children, ...rest },
  ref,
) {
  const resolved: Variant = variant === "outline" ? "tertiary" : variant;

  return (
    <button
      {...rest}
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        base,
        resolved === "icon" ? `${sizes[size]} ${iconSizes[size]}` : sizes[size],
        variants[resolved],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
});
