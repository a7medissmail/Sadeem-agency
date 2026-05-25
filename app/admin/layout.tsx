import type { ReactNode } from "react";

export const metadata = {
  title: "SADEEM — Admin",
  robots: { index: false, follow: false },
};

// Minimal wrapper: every /admin/* page renders into this.
// The cinematic Lenis smooth-scroll is intentionally absent for admin work.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-root min-h-screen" data-admin-theme="dark">
      {children}
    </div>
  );
}
