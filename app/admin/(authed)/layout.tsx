import type { ReactNode } from "react";
import { requireUser, getCurrentProfile } from "@/lib/auth";
import { signOutAction } from "@/app/admin/login/actions";
import { AdminCommandCenter } from "@/components/admin/AdminCommandCenter";
import { AdminNavLink } from "@/components/admin/AdminNavLink";
import { loadAdminSignals, loadBadgeCounts } from "@/lib/admin/signals";

// href → badge count mapping (populated from loadBadgeCounts)
type BadgeMap = Record<string, number>;

const navGroups = [
  {
    label: "Command",
    items: [
      { href: "/admin",            label: "Dashboard" },
      { href: "/admin/leads",      label: "CRM Leads" },
      { href: "/admin/bookings",   label: "Consultations" },
      { href: "/admin/campaigns",  label: "Email Studio" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/services",           label: "Services" },
      { href: "/admin/services/categories",label: "Categories" },
      { href: "/admin/courses",            label: "Workshops" },
      { href: "/admin/success-stories",    label: "Stories" },
      { href: "/admin/team",               label: "Team" },
      { href: "/admin/clients",            label: "Clients" },
    ],
  },
  {
    label: "Hiring",
    items: [
      { href: "/admin/jobs",         label: "Roles" },
      { href: "/admin/applications", label: "Applications" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/proposals",  label: "Proposals" },
      { href: "/admin/forms",      label: "Form Builder" },
      { href: "/admin/settings",   label: "Site Settings" },
      { href: "/admin/users",      label: "Users & Roles" },
    ],
  },
] as const;

export const dynamic = "force-dynamic";

export default async function AuthedAdminLayout({ children }: { children: ReactNode }) {
  await requireUser();
  const profile = await getCurrentProfile();
  const profileLabel = profile?.full_name || profile?.email || "SADEEM";

  // Load signals and badge counts in parallel
  const [signals, badgeCounts] = await Promise.all([
    loadAdminSignals(),
    loadBadgeCounts(),
  ]);

  const badges: BadgeMap = {
    "/admin/leads":        badgeCounts.leads,
    "/admin/bookings":     badgeCounts.bookings,
    "/admin/applications": badgeCounts.applications,
    "/admin/proposals":    badgeCounts.proposals,
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <p className="admin-kicker">SADEEM</p>
          <p className="admin-brand-title">Operating System</p>
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
          <div>
            <p className="admin-topbar-kicker">Admin command center</p>
            <p className="admin-topbar-title">Operations</p>
          </div>
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
