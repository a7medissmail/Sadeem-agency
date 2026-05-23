import { getCurrentProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard — SADEEM Admin" };

async function counts() {
  const supabase = createSupabaseServerClient();
  const queries = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase.from("courses").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("applications").select("*", { count: "exact", head: true }),
  ]);
  return {
    leads: queries[0].count ?? 0,
    bookings: queries[1].count ?? 0,
    activeCourses: queries[2].count ?? 0,
    applications: queries[3].count ?? 0,
  };
}

export default async function AdminDashboard() {
  const profile = await getCurrentProfile();
  let stats: Awaited<ReturnType<typeof counts>> | null = null;
  try {
    stats = await counts();
  } catch {
    stats = null;
  }

  const tiles = [
    { label: "Leads", value: stats?.leads ?? "—" },
    { label: "Bookings", value: stats?.bookings ?? "—" },
    { label: "Active courses", value: stats?.activeCourses ?? "—" },
    { label: "Applications", value: stats?.applications ?? "—" },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-[#ff6a00]">OVERVIEW</p>
        <h1 className="mt-2 text-[32px] font-semibold tracking-tight">
          Hello, {profile?.full_name || profile?.email || "there"}.
        </h1>
        <p className="mt-2 text-white/55 text-[14.5px] max-w-[60ch]">
          Foundation is in place. Tables, RLS, and auth are wired; the rest will fill in by phase.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 max-w-[820px]">
        {tiles.map((t) => (
          <div key={t.label} className="border border-white/10 rounded-xl px-5 py-5 bg-white/[0.02]">
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/45">{t.label}</div>
            <div className="mt-3 text-[34px] font-semibold tracking-tight">{t.value}</div>
          </div>
        ))}
      </div>

      {!stats ? (
        <div className="border border-amber-500/30 bg-amber-500/[0.06] text-amber-200 text-[13px] rounded-md px-4 py-3 max-w-[820px]">
          Couldn't read counts. Confirm your <code>.env.local</code> Supabase values and that{" "}
          <code>supabase/migrations/0001_init.sql</code> has been applied.
        </div>
      ) : null}
    </div>
  );
}
