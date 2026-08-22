import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import { signOutAction } from "@/app/admin/login/actions";
import { AdminCommandCenter } from "@/components/admin/AdminCommandCenter";
import { AdminNavLink } from "@/components/admin/AdminNavLink";
import { loadAdminSignals, loadBadgeCounts } from "@/lib/admin/signals";
import { navGroups } from "@/lib/admin/navigation";

export const dynamic = "force-dynamic";

export default async function AuthedAdminLayout({ children }: { children: ReactNode }) {
  const profile = await requireRole(["admin", "editor"]);
  const profileLabel = profile?.full_name || profile?.email || "SADEEM";

  // Load signals and badge counts in parallel
  const [signals, badgeCounts] = await Promise.all([
    loadAdminSignals(),
    loadBadgeCounts(),
  ]);

  const badges: Record<string, number> = {
    "/admin/leads":        badgeCounts.leads,
    "/admin/bookings":     badgeCounts.bookings,
    "/admin/applications": badgeCounts.applications,
    "/admin/proposals":    badgeCounts.proposals,
  };

  return (
    <div className="admin-shell">
      {/*
        CSS-only nav disclosure. Below 1080px the sidebar used to render as a
        full block above the content, so reaching the page meant scrolling past
        all 17 links. Now it collapses to a brand row + Menu button.
      */}
      <input type="checkbox" id="admin-nav-toggle" className="admin-nav-checkbox" />
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div>
            <p className="admin-kicker">SADEEM</p>
            <p className="admin-brand-title">Admin</p>
          </div>
          <label htmlFor="admin-nav-toggle" className="admin-nav-toggle">
            Menu
          </label>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          {navGroups.map((group) => (
            <div key={group.label} className="admin-nav-group">
              <p className="admin-nav-group-label">{group.label}</p>
              <div className="admin-nav-group-links">
                {group.items.map((item) => (
                  <AdminNavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    badge={badges[item.href]}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-profile-card">
            <div className="admin-profile-avatar" aria-hidden="true">
              {profileLabel.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="admin-profile-name">{profileLabel}</div>
              <div className="admin-profile-role">{profile?.role ?? "viewer"}</div>
            </div>
          </div>
          <form action={signOutAction}>
            <button type="submit" className="admin-signout">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <AdminCommandCenter
            role={profile?.role ?? "viewer"}
            profileLabel={profileLabel}
            initialSignals={signals}
          />
        </header>
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
