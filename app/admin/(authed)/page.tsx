import Link from "next/link";
import type { ReactNode } from "react";
import { getCurrentProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadBadgeCounts } from "@/lib/admin/signals";
import { UserValue } from "@/components/admin/ui/UserValue";

export const metadata = { title: "Dashboard - SADEEM Admin" };

/**
 * One screen, one question: what needs me today?
 *
 * This page used to show the same four numbers four different ways — needs-action
 * tiles, count tiles, a prose paragraph restating both, and three distribution bar
 * charts — and paid for the charts with three queries that each pulled up to 1000
 * rows just to count statuses in JS (which also silently went wrong past 1000 rows).
 * Now: one tile row that pairs "needs action" with the total, and three lists of
 * actual records.
 */
async function dashboardData() {
  const supabase = createSupabaseServerClient();
  const [
    leadsCount,
    bookingsCount,
    applicationsCount,
    proposalsCount,
    recentLeads,
    upcomingBookings,
    recentApplications,
  ] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase.from("applications").select("*", { count: "exact", head: true }),
    supabase.from("proposals").select("*", { count: "exact", head: true }),
    supabase.from("leads").select("id, name, email, source, status, created_at").order("created_at", { ascending: false }).limit(6),
    supabase
      .from("bookings")
      .select("id, name, email, slot_start, status, meet_link")
      .eq("status", "scheduled")
      .gte("slot_start", new Date().toISOString())
      .order("slot_start", { ascending: true })
      .limit(6),
    supabase
      .from("applications")
      .select("id, name, email, status, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  for (const result of [
    leadsCount,
    bookingsCount,
    applicationsCount,
    proposalsCount,
    recentLeads,
    upcomingBookings,
    recentApplications,
  ]) {
    if (result.error) throw result.error;
  }

  return {
    totals: {
      leads: leadsCount.count ?? 0,
      bookings: bookingsCount.count ?? 0,
      applications: applicationsCount.count ?? 0,
      proposals: proposalsCount.count ?? 0,
    },
    recentLeads: recentLeads.data ?? [],
    upcomingBookings: upcomingBookings.data ?? [],
    recentApplications: recentApplications.data ?? [],
  };
}

const dateFmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function Panel({ title, href, children }: { title: string; href: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)]">
      <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-4 py-3">
        <h2 className="sdm-eyebrow text-[var(--admin-muted)]">{title}</h2>
        <Link href={href} className="sdm-eyebrow text-[var(--admin-accent)] hover:brightness-110">
          Open
        </Link>
      </div>
      {children}
    </section>
  );
}

function EmptyMini({ text }: { text: string }) {
  return <p className="px-4 py-6 text-[13px] text-[var(--admin-subtle)]">{text}</p>;
}

/**
 * Pairs the number that needs action with the total, so one row of tiles
 * replaces the two rows this page used to stack.
 */
function CountTile({
  label,
  needsAction,
  actionLabel,
  total,
  href,
}: {
  label: string;
  needsAction: number;
  actionLabel: string;
  total: number;
  href: string;
}) {
  const hot = needsAction > 0;
  return (
    <Link
      href={href}
      className={`rounded-xl border px-5 py-5 transition-colors ${
        hot
          ? "border-[var(--admin-accent)] bg-[var(--admin-accent-soft)]"
          : "border-[var(--admin-border)] bg-[var(--admin-panel)] hover:border-[var(--admin-accent)]"
      }`}
    >
      <div className="sdm-eyebrow text-[var(--admin-subtle)]">{label}</div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className={`text-[34px] font-semibold leading-none tracking-tight ${hot ? "text-[var(--admin-accent)]" : "text-[var(--admin-text)]"}`}>
          {needsAction}
        </span>
        <span className="text-[13px] text-[var(--admin-muted)]">of {total}</span>
      </div>
      <p className="mt-3 text-[12.5px] text-[var(--admin-muted)]">{actionLabel}</p>
    </Link>
  );
}

export default async function AdminDashboard() {
  const profile = await getCurrentProfile();
  let data: Awaited<ReturnType<typeof dashboardData>> | null = null;
  let badgeCounts: Awaited<ReturnType<typeof loadBadgeCounts>> | null = null;
  try {
    [data, badgeCounts] = await Promise.all([dashboardData(), loadBadgeCounts()]);
  } catch {
    data = null;
    badgeCounts = null;
  }

  const actions = [
    { label: "New lead", href: "/admin/leads/new" },
    { label: "New booking", href: "/admin/bookings/new" },
    { label: "New proposal", href: "/admin/proposals" },
    { label: "Write campaign", href: "/admin/campaigns" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-[28px] font-semibold tracking-tight">
          Hello, {profile?.full_name || profile?.email || "there"}.
        </h1>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="border border-[var(--admin-border)] px-3 py-2 sdm-eyebrow text-[var(--admin-muted)] transition-colors hover:border-[var(--admin-accent)] hover:text-[var(--admin-text)]"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {!data ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200">
          Couldn&apos;t read dashboard data. Confirm Supabase env vars and migrations are applied.
        </div>
      ) : null}

      {data && badgeCounts ? (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <CountTile label="Leads" needsAction={badgeCounts.leads} actionLabel="New, need triage" total={data.totals.leads} href="/admin/leads" />
          <CountTile label="Bookings" needsAction={badgeCounts.bookings} actionLabel="Missing meet link" total={data.totals.bookings} href="/admin/bookings" />
          <CountTile label="Applications" needsAction={badgeCounts.applications} actionLabel="New, unreviewed" total={data.totals.applications} href="/admin/applications" />
          <CountTile label="Proposals" needsAction={badgeCounts.proposals} actionLabel="Submitted, need review" total={data.totals.proposals} href="/admin/proposals" />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Upcoming bookings" href="/admin/bookings">
          {data?.upcomingBookings.length ? (
            data.upcomingBookings.map((booking) => (
              <div key={booking.id} className="border-b border-[var(--admin-border-soft)] px-4 py-3 last:border-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[14px] text-[var(--admin-text)]"><UserValue>{booking.name}</UserValue></p>
                  <span className="shrink-0 sdm-eyebrow text-[var(--admin-subtle)]">
                    {booking.meet_link ? "Linked" : "No link"}
                  </span>
                </div>
                <p className="mt-1 sdm-eyebrow text-[var(--admin-accent)]">
                  {dateFmt.format(new Date(booking.slot_start))}
                </p>
              </div>
            ))
          ) : (
            <EmptyMini text="No upcoming bookings." />
          )}
        </Panel>

        <Panel title="Latest leads" href="/admin/leads">
          {data?.recentLeads.length ? (
            data.recentLeads.map((lead) => (
              <div key={lead.id} className="border-b border-[var(--admin-border-soft)] px-4 py-3 last:border-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[14px] text-[var(--admin-text)]"><UserValue>{lead.name}</UserValue></p>
                  <span className="shrink-0 sdm-eyebrow text-[var(--admin-accent)]">{lead.status}</span>
                </div>
                <p className="mt-1 sdm-eyebrow text-[var(--admin-subtle)]">
                  {lead.source} / {dateFmt.format(new Date(lead.created_at))}
                </p>
              </div>
            ))
          ) : (
            <EmptyMini text="No leads yet." />
          )}
        </Panel>

        <Panel title="Recent applications" href="/admin/applications">
          {data?.recentApplications.length ? (
            data.recentApplications.map((application) => (
              <div key={application.id} className="border-b border-[var(--admin-border-soft)] px-4 py-3 last:border-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[14px] text-[var(--admin-text)]">{application.name}</p>
                  <span className="shrink-0 sdm-eyebrow text-[var(--admin-accent)]">{application.status}</span>
                </div>
                <p className="mt-1 sdm-eyebrow text-[var(--admin-subtle)]">
                  {dateFmt.format(new Date(application.created_at))}
                </p>
              </div>
            ))
          ) : (
            <EmptyMini text="No applications yet." />
          )}
        </Panel>
      </div>
    </div>
  );
}
