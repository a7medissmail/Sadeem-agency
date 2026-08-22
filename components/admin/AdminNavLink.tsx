"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNavLink({
  href,
  label,
  badge,
}: {
  href: string;
  label: string;
  /**
   * "Needs attention" count. Renders alongside the active state rather than
   * replacing it (audit finding A13) — being the current page and having
   * pending items are two different facts and both get shown.
   */
  badge?: number;
}) {
  const pathname = usePathname();
  const isActive =
    href === "/admin"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`admin-nav-link${isActive ? " is-active" : ""}`}
    >
      <span>{label}</span>
      {badge && badge > 0 ? (
        <span
          className="admin-nav-badge"
          aria-label={`${badge} item${badge !== 1 ? "s" : ""} need attention`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}
