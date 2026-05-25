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
    recentLeads,
    upcomingBookings,
    recentApplications,
  ] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase.from("courses").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("applications").select("*", { count: "exact", head: true }),
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
  ]);

  for (const result of [
    leadsCount,
    bookingsCount,
    activeCoursesCount,
    applicationsCount,
    recentLeads,
    upcomingBookings,
    recentApplications,
  ]) {
    if (result.error) throw result.error;
  }

  return {
    counts: {
      leads: leadsCount.count ?? 0,
      bookings: bookingsCount.count ?? 0,
      activeCourses: activeCoursesCount.count ?? 0,
      applications: applicationsCount.count ?? 0,
    },
    recentLeads: recentLeads.data ?? [],
    upcomingBookings: upcomingBookings.data ?? [],
    recentApplications: recentApplications.data ?? [],
  };
}

const dateFmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function EmptyMini({ text }: { text: string }) {
  return <p className="px-4 py-6 text-[13px] text-white/35">{text}</p>;
}

function Panel({ title, href, children }: { title: string; href: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/55">{title}</h2>
        <Link href={href} className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ff6a00] hover:text-[#ff8c3a]">
          Open
        </Link>
      </div>
      {children}
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
  ];

  const actions = [
    { label: "Write campaign", href: "/admin/campaigns" },
    { label: "Add workshop", href: "/admin/courses/new" },
    { label: "Add story", href: "/admin/success-stories/new" },
    { label: "Add job", href: "/admin/jobs/new" },
    { label: "Site settings", href: "/admin/settings" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#ff6a00]">OVERVIEW</p>
          <h1 className="mt-2 text-[32px] font-semibold tracking-tight">
            Hello, {profile?.full_name || profile?.email || "there"}.
          </h1>
          <p className="mt-2 max-w-[62ch] text-[14.5px] leading-relaxed text-white/55">
            Your operational snapshot: new demand, upcoming conversations, content controls, and hiring activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/65 transition-colors hover:border-[#ff6a00]/60 hover:text-white"
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href} className="rounded-xl border border-white/10 bg-white/[0.02] px-5 py-5 transition-colors hover:border-[#ff6a00]/45 hover:bg-white/[0.04]">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">{tile.label}</div>
            <div className="mt-3 text-[34px] font-semibold tracking-tight">{tile.value}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Latest leads" href="/admin/leads">
          {data?.recentLeads.length ? (
            data.recentLeads.map((lead) => (
              <div key={lead.id} className="border-b border-white/5 px-4 py-3 last:border-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[14px] text-white/90">{lead.name}</p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#ff6a00]">{lead.status}</span>
                </div>
                <p className="mt-1 truncate font-mono text-[11px] text-white/40">{lead.email}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/30">
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
              <div key={booking.id} className="border-b border-white/5 px-4 py-3 last:border-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[14px] text-white/90">{booking.name}</p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                    {booking.meet_link ? "Linked" : "Pending"}
                  </span>
                </div>
                <p className="mt-1 truncate font-mono text-[11px] text-white/40">{booking.email}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#ff6a00]">
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
              <div key={application.id} className="border-b border-white/5 px-4 py-3 last:border-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[14px] text-white/90">{application.name}</p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#ff6a00]">{application.status}</span>
                </div>
                <p className="mt-1 truncate font-mono text-[11px] text-white/40">{application.email}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/30">
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
