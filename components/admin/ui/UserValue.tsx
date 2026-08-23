import type { ReactNode } from "react";

/**
 * Bidi isolation for anything a user typed.
 *
 * Sadeem's records are mostly Arabic names sitting inside English chrome, and
 * without isolation the browser resolves the whole line as one bidi paragraph:
 * an Arabic company name followed by " · LEAD-0147" pushes the identifier to
 * the wrong end of the row, and a trailing bracket or comma jumps with it. The
 * row looks scrambled and nothing in the data is wrong.
 *
 * <bdi> is the element the spec provides for exactly this. It costs one inline
 * element and it matters today — the admin does not have to be switched to
 * Arabic for Arabic names to be in it.
 */
export function UserValue({ children, className }: { children: ReactNode; className?: string }) {
  return <bdi className={className}>{children}</bdi>;
}
