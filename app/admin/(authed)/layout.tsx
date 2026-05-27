import type { ReactNode } from "react";
import { requireUser, getCurrentProfile } from "@/lib/auth";
import { signOutAction } from "@/app/admin/login/actions";
import { AdminCommandCenter, type AdminSignal } from "@/components/admin/AdminCommandCenter";
import { AdminNavLink } from "@/components/admin/AdminNavLink";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const navGroups = [
  {
    label: "Command",
    items: [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/leads", label: "CRM Leads" },
      { href: "/admin/bookings", label: "Consultations" },
      { href: "/admin/campaigns", label: "Email Studio" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/services", label: "Services" },
      { href: "/admin/courses", label: "Workshops" },
      { href: "/admin/success-stories", label: "Stories" },
      { href: "/admin/team", label: "Team" },
      { href: "/admin/clients", label: "Clients" },
    ],
  },
  {
    label: "Hiring",
    items: [
      { href: "/admin/jobs", label: "Roles" },
      { href: "/admin/applications", label: "Applications" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/proposals", label: "Proposals" },
      { href: "/admin/forms", label: "Form Builder" },
      { href: "/admin/settings", label: "Site Settings" },
      { href: "/admin/users", label: "Users & Roles" },
    ],
  },
] as const;

export const dynamic = "force-dynamic";

const signalDateFmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function signalWhen(value: string) {
  try {
    return signalDateFmt.format(new Date(value));
  } catch {
    return "recently";
  }
}

async function loadAdminSignals(): Promise<AdminSignal[]> {
  try {
    const supabase = createSupabaseServerClient();
    const now = new Date().toISOString();
    const [leads, bookings, applications, campaigns] = await Promise.all([
      supabase
        .from("leads")
        .select("name, email, source, created_at")
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("bookings")
        .select("name, email, slot_start, meet_link, status")
        .gte("slot_start", now)
        .order("slot_start", { ascending: true })
        .limit(3),
      supabase
        .from("applications")
        .select("name, email, status, created_at")
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("email_campaigns")
        .select("subject, status, created_at, sent_at")
        .order("created_at", { ascending: false })
        .limit(2),
    ]);

    for (const result of [leads, bookings, applications, campaigns]) {
      if (result.error) throw result.error;
    }

    const signals = [
      ...(leads.data ?? []).map((lead) => ({
        sortAt: lead.created_at,
        kind: "Lead",
        title: `${lead.name} entered via ${lead.source}.`,
        detail: lead.email,
        href: "/admin/leads",
        when: signalWhen(lead.created_at),
      })),
      ...(bookings.data ?? []).map((booking) => ({
        sortAt: booking.slot_start,
        kind: "Booking",
        title: `${booking.name} reserved a consultation.`,
        detail: booking.meet_link ? "Meeting link attached" : `${booking.status} - link pending`,
        href: "/admin/bookings",
        when: signalWhen(booking.slot_start),
        tone: booking.meet_link ? "muted" : "accent",
      })),
      ...(applications.data ?? []).map((application) => ({
        sortAt: application.created_at,
        kind: "Hiring",
        title: `${application.name} is in ${application.status}.`,
        detail: application.email,
        href: "/admin/applications",
        when: signalWhen(application.created_at),
      })),
      ...(campaigns.data ?? []).map((campaign) => ({
        sortAt: campaign.sent_at ?? campaign.created_at,
        kind: "Dispatch",
        title: campaign.subject,
        detail: campaign.status,
        href: "/admin/campaigns",
        when: signalWhen(campaign.sent_at ?? campaign.created_at),
        tone: "muted" as const,
      })),
    ];

    return signals
      .sort((a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime())
      .slice(0, 8)
      .map(({ sortAt: _sortAt, ...signal }) => signal);
  } catch {
    return [];
  }
}

export default async function AuthedAdminLayout({ children }: { children: ReactNode }) {
  await requireUser();
  const profile = await getCurrentProfile();
  const profileLabel = profile?.full_name || profile?.email || "SADEEM";
  const signals = await loadAdminSignals();

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
                  <AdminNavLink key={item.href} href={item.href} label={item.label} />
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
          <AdminCommandCenter role={profile?.role ?? "viewer"} profileLabel={profileLabel} signals={signals} />
        </header>
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
