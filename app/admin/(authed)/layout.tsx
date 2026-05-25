import type { ReactNode } from "react";
import Link from "next/link";
import { requireUser, getCurrentProfile } from "@/lib/auth";
import { signOutAction } from "@/app/admin/login/actions";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/campaigns", label: "Email" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/success-stories", label: "Stories" },
  { href: "/admin/team", label: "Team" },
  { href: "/admin/jobs", label: "Careers" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/users", label: "Users" },
];

export const dynamic = "force-dynamic";

export default async function AuthedAdminLayout({ children }: { children: ReactNode }) {
  await requireUser();
  const profile = await getCurrentProfile();

  return (
    <div className="grid min-h-screen" style={{ gridTemplateColumns: "240px 1fr" }}>
      <aside className="border-r border-white/10 bg-[#0a0b0d] p-6 flex flex-col gap-8">
        <div>
          <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-[#ff6a00]">SADEEM</p>
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-white/45 mt-1">Admin</p>
        </div>
        <nav className="flex flex-col gap-1.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between px-3 py-2 text-[13.5px] text-white/75 hover:text-white hover:bg-white/5 rounded-md transition-colors"
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-3">
          <div className="text-[13px] leading-tight">
            <div className="text-white/85">{profile?.full_name || profile?.email}</div>
            <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#ff6a00]/85 mt-1">
              {profile?.role ?? "viewer"}
            </div>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="text-[12px] text-white/55 hover:text-white underline-offset-4 hover:underline"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="bg-[#0d0e10]">
        <header className="h-14 border-b border-white/10 flex items-center px-8 font-mono text-[10.5px] tracking-[0.22em] uppercase text-white/55">
          Operations
        </header>
        <div className="p-8 max-w-[1280px]">{children}</div>
      </main>
    </div>
  );
}
