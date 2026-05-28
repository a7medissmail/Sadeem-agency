import Link from "next/link";
import { Button } from "@/components/admin/ui/Button";

/**
 * Admin-section 404 — rendered inside the authed admin shell (sidebar + topbar).
 * Triggered when a dynamic route like /admin/leads/[id] returns notFound().
 */
export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-start gap-8 py-16">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--admin-accent)]">
          ERR · 404
        </p>
        <h1 className="mt-3 text-[40px] font-semibold leading-none tracking-tight text-[var(--admin-text)]">
          Page not found.
        </h1>
        <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-[var(--admin-muted)]">
          The resource you requested doesn&apos;t exist or was removed. Use the
          sidebar to navigate to a valid page.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin">
          <Button>← Dashboard</Button>
        </Link>
        <Link href="/admin/leads">
          <Button variant="ghost">Leads</Button>
        </Link>
        <Link href="/admin/proposals">
          <Button variant="ghost">Proposals</Button>
        </Link>
      </div>
    </div>
  );
}
