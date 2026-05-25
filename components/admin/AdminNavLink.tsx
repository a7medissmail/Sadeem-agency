"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link href={href} className={`admin-nav-link${isActive ? " is-active" : ""}`}>
      <span>{label}</span>
      <span className="admin-nav-link-dot" aria-hidden="true" />
    </Link>
  );
}
