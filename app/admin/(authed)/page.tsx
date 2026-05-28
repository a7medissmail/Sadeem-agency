import Link from "next/link";
import type { ReactNode } from "react";
import { getCurrentProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard - SADEEM Admin" };

async function dashboardData() {
  const supabase = createSupabaseServerClient();
  const [
    leadsCount,
    bookingsCount,
    activeCoursesCount,
    applicationsCount,
    proposalsCount,
    openProposalsCount,
    recentLeads,
    upcomingBookings,
    recentApplications,
    leadStatuses,
    bookingStatuses,
    applicationStatuses,
  ] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase.from("courses").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("applications").select("*", { count: "exact", head: true }),
    supabase.from("proposals").select("*", { count: "exact", head: true }),
    supabase.from("proposals").select("*", { count: "exact", head: true }).in("status", ["sent", "opened"]),
    supabase.from("leads").select("id, name, email, source, status, created_at").order("created_at", { ascending: false }).limit(5),
    supabase
      .from("bookings")
      .select("id, name, email, slot_start, status, meet_link")
      .eq("status", "scheduled")
      .gte("slot_start", new Date().toISOString())
      .order("slot_start", { ascending: true })
      .limit(5),
    supabase
      .from("applications")
      .select("id, name, email, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("leads").select("status").limit(1000),
    supabase.from("bookings").select("status").limit(1000),
    supabase.from("applications").select("status").limit(1000),
  ]);

  for (const result of [
    leadsCount,
    bookingsCount,
    activeCoursesCount,
    applicationsCount,
    proposalsCount,
    openProposalsCount,
    recentLeads,
    upcomingBookings,
    recentApplications,
    leadStatuses,
    bookingStatuses,
    applicationStatuses,
  ]) {
    if (result.error) throw result.error;
  }

  function countStatuses(rows: { status: string }[]) {
    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    }, {});
  }

  return {
    counts: {
      leads: leadsCount.count ?? 0,
      bookings: bookingsCount.count ?? 0,
      activeCourses: activeCoursesCount.count ?? 0,
      applications: applicationsCount.count ?? 0,
      proposals: proposalsCount.count ?? 0,
      openProposals: openProposalsCount.count ?? 0,
    },
    statusCounts: {
      leads: countStatuses(leadStatuses.data ?? []),
      bookings: countStatuses(bookingStatuses.data ?? []),
      applications: countStatuses(applicationStatuses.data ?? []),
    },
    recentLeads: recentLeads.data ?? [],
    upcomingBookings: upcomingBookings.data ?? [],
    recentApplications: recentApplications.data ?? [],
  };
}

const dateFmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function EmptyMini({ text }: { text: string }) {
  return <p className="px-4 py-6 text-[13px] text-[var(--admin-subtle)]">{text}</p>;
}

function Panel({ title, href, children }: { title: string; href: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)]">
      <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-4 py-3">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-muted)]">{title}</h2>
        <Link href={href} className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-accent)] hover:brightness-110">
          Open
        </Link>
      </div>
      {children}
    </section>
  );
}

function StatusBar({ label, value, total, tone = "accent" }: { label: string; value: number; total: number; tone?: "accent" | "muted" | "danger" }) {
  const pct = total > 0 ? Math.max(4, Math.round((value / total) * 100)) : 0;
  const fill =
    tone === "danger"
      ? "bg-[var(--admin-danger)]"
      : tone === "muted"
        ? "bg-[var(--admin-muted)]"
        : "bg-[var(--admin-accent)]";

  return (
    <div className="grid grid-cols-[122px_1fr_36px] items-center gap-3">
      <span className="truncate font-mono text-[10px] uppercase tracking-[0.17em] text-[var(--admin-subtle)]">{label}</span>
      <span className="h-1.5 overflow-hidden rounded-full bg-[var(--admin-border-soft)]">
        <span className={`block h-full origin-left rounded-full ${fill}`} style={{ transform: `scaleX(${pct / 100})` }} />
      </span>
      <span className="text-right font-mono text-[10px] text-[var(--admin-muted)]">{value}</span>
    </div>
  );
}

function PulsePanel({
  title,
  total,
  rows,
}: {
  title: string;
  total: number;
  rows: { label: string; value: number; tone?: "accent" | "muted" | "danger" }[];
}) {
  return (
    <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-muted)]">{title}</h2>
          <p className="mt-2 text-[13px] text-[var(--admin-subtle)]">Live distribution</p>
        </div>
        <span className="font-mono text-[22px] leading-none text-[var(--admin-text)]">{total}</span>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <StatusBar key={row.label} label={row.label} value={row.value} total={total} tone={row.tone} />
        ))}
      </div>
    </section>
  );
}

export default async function AdminDashboard() {
  const profile = await getCurrentProfile();
  let data: Awaited<ReturnType<typeof dashboardData>> | null = null;
  try {
    data = await dashboardData();
  } catch {
    data = null;
  }

  const tiles = [
    { label: "Leads", value: data?.counts.leads ?? "-", href: "/admin/leads" },
    { label: "Bookings", value: data?.counts.bookings ?? "-", href: "/admin/bookings" },
    { label: "Active courses", value: data?.counts.activeCourses ?? "-", href: "/admin/courses" },
    { label: "Applications", value: data?.counts.applications ?? "-", href: "/admin/applications" },
    { label: "Proposals", value: data?.counts.proposals ?? "-", href: "/admin/proposals" },
  ];

  const actions = [
    { label: "New lead", href: "/admin/leads/new" },
    { label: "New booking", href: "/admin/bookings/new" },
    { label: "Write campaign", href: "/admin/campaigns" },
    { label: "Add workshop", href: "/admin/courses/new" },
    { label: "Add story", href: "/admin/success-stories/new" },
    { label: "Add job", href: "/admin/jobs/new" },
    { label: "Build form", href: "/admin/forms/new" },
    { label: "Site settings", href: "/admin/settings" },
  ];

  const newLeads = data?.statusCounts.leads.new ?? 0;
  const scheduledBookings = data?.statusCounts.bookings.scheduled ?? 0;
  const reviewApplications = (data?.statusCounts.applications.review ?? 0) + (data?.statusCounts.applications.interview ?? 0);
  const openProposals = data?.counts.openProposals ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--admin-accent)]">OVERVIEW</p>
          <h1 className="mt-2 text-[32px] font-semibold tracking-tight">
            Hello, {profile?.full_name || profile?.email || "there"}.
          </h1>
          <p className="mt-2 max-w-[62ch] text-[14.5px] leading-relaxed text-[var(--admin-muted)]">
            Your operational snapshot: new demand, upcoming conversations, content controls, and hiring activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="border border-[var(--admin-border)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-muted)] transition-colors hover:border-[var(--admin-accent)] hover:text-[var(--admin-text)]"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {!data ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200">
          Couldn't read dashboard data. Confirm Supabase env vars and migrations are applied.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href} className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] px-5 py-5 transition-colors hover:border-[var(--admin-accent)] hover:bg-[var(--admin-panel-hover)]">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--admin-subtle)]">{tile.label}</div>
            <div className="mt-3 text-[34px] font-semibold tracking-tight">{tile.value}</div>
          </Link>
        ))}
      </div>

      <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr] xl:items-center">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--admin-accent)]">THE BRIEF</p>
            <h2 className="mt-2 max-w-[15ch] text-[32px] font-semibold leading-[1.02] tracking-tight">
              A calm day with clear signals.
            </h2>
          </div>
          <p className="max-w-[72ch] text-[15px] leading-relaxed text-[var(--admin-muted)]">
            {newLeads} new leads need triage, {scheduledBookings} consultations are scheduled,{" "}
            {reviewApplications} candidates are in active review
            {openProposals > 0 ? `, and ${openProposals} ${openProposals === 1 ? "proposal awaits" : "proposals await"} client response` : ""}.
            {" "}The next admin pass should turn these signals into assigned work, reminders, and clean handoffs.
          </p>
        </div>
      </section>

      {data ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <PulsePanel
            title="Lead pipeline"
            total={data.counts.leads}
            rows={[
              { label: "New", value: data.statusCounts.leads.new ?? 0 },
              { label: "Contacted", value: data.statusCounts.leads.contacted ?? 0, tone: "muted" },
              { label: "Qualified", value: data.statusCounts.leads.qualified ?? 0 },
              { label: "Won", value: data.statusCounts.leads.won ?? 0 },
              { label: "Lost", value: data.statusCounts.leads.lost ?? 0, tone: "danger" },
            ]}
          />
          <PulsePanel
            title="Booking health"
            total={data.counts.bookings}
            rows={[
              { label: "Scheduled", value: data.statusCounts.bookings.scheduled ?? 0 },
              { label: "Completed", value: data.statusCounts.bookings.completed ?? 0, tone: "muted" },
              { label: "No show", value: data.statusCounts.bookings.no_show ?? 0, tone: "danger" },
              { label: "Cancelled", value: data.statusCounts.bookings.cancelled ?? 0, tone: "danger" },
            ]}
          />
          <PulsePanel
            title="Hiring funnel"
            total={data.counts.applications}
            rows={[
              { label: "New", value: data.statusCounts.applications.new ?? 0 },
              { label: "Review", value: data.statusCounts.applications.review ?? 0 },
              { label: "Interview", value: data.statusCounts.applications.interview ?? 0 },
              { label: "Offer", value: data.statusCounts.applications.offer ?? 0 },
              { label: "Rejected", value: data.statusCounts.applications.rejected ?? 0, tone: "danger" },
            ]}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Latest leads" href="/admin/leads">
          {data?.recentLeads.length ? (
            data.recentLeads.map((lead) => (
              <div key={lead.id} className="border-b border-[var(--admin-border-soft)] px-4 py-3 last:border-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[14px] text-[var(--admin-text)]">{lead.name}</p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--admin-accent)]">{lead.status}</span>
                </div>
                <p className="mt-1 truncate font-mono text-[11px] text-[var(--admin-subtle)]">{lead.email}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--admin-subtle)]">
                  {lead.source} / {dateFmt.format(new Date(lead.created_at))}
                </p>
              </div>
            ))
          ) : (
            <EmptyMini text="No leads yet." />
          )}
        </Panel>

        <Panel title="Upcoming bookings" href="/admin/bookings">
          {data?.upcomingBookings.length ? (
            data.upcomingBookings.map((booking) => (
              <div key={booking.id} className="border-b border-[var(--admin-border-soft)] px-4 py-3 last:border-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[14px] text-[var(--admin-text)]">{booking.name}</p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--admin-subtle)]">
                    {booking.meet_link ? "Linked" : "Pending"}
                  </span>
                </div>
                <p className="mt-1 truncate font-mono text-[11px] text-[var(--admin-subtle)]">{booking.email}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--admin-accent)]">
                  {dateFmt.format(new Date(booking.slot_start))}
                </p>
              </div>
            ))
          ) : (
            <EmptyMini text="No upcoming bookings." />
          )}
        </Panel>

        <Panel title="Recent applications" href="/admin/applications">
          {data?.recentApplications.length ? (
            data.recentApplications.map((application) => (
              <div key={application.id} className="border-b border-[var(--admin-border-soft)] px-4 py-3 last:border-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[14px] text-[var(--admin-text)]">{application.name}</p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--admin-accent)]">{application.status}</span>
                </div>
                <p className="mt-1 truncate font-mono text-[11px] text-[var(--admin-subtle)]">{application.email}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--admin-subtle)]">
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
