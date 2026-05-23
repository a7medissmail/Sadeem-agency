import type { ReactNode } from "react";

export const metadata = {
  title: "SADEEM — Admin",
  robots: { index: false, follow: false },
};

// Minimal wrapper: every /admin/* page renders into this.
// The cinematic Lenis smooth-scroll is intentionally absent for admin work.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="admin-root min-h-screen bg-[#0d0e10] text-[#f5f3f0]">{children}</div>;
}
