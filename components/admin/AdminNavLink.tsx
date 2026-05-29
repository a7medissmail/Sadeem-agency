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
  /** "Needs attention" count — shown as a badge instead of the active dot */
  badge?: number;
}) {
  const pathname = usePathname();
  const isActive =
    href === "/admin"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link href={href} className={`admin-nav-link${isActive ? " is-active" : ""}`}>
      <span>{label}</span>
      {badge && badge > 0 ? (
        <span
          className="admin-nav-badge"
          aria-label={`${badge} item${badge !== 1 ? "s" : ""} need attention`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      ) : (
        <span className="admin-nav-link-dot" aria-hidden="true" />
      )}
    </Link>
  );
}
