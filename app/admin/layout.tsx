import type { ReactNode } from "react";

export const metadata = {
  title: "SADEEM — Admin",
  robots: { index: false, follow: false },
};

/**
 * Direction of the admin chrome.
 *
 * The admin CSS carries no physical left/right any more — margins, padding,
 * borders, insets and text alignment are all logical, the nav's active bar
 * mirrors on [dir="rtl"], and directional icons flip via .sdm-mirror. So
 * turning the whole tool over to Arabic is this constant and nothing else.
 *
 * It is not wired to a preference yet because the admin has no UI language
 * setting to read one from — `locale` in this codebase is the language of a
 * proposal or brief sent to a client, not the language of the tool. Adding
 * that setting is a product decision; the layout work it would have needed is
 * already done.
 */
const ADMIN_DIR = "ltr" as const;
const ADMIN_LANG = ADMIN_DIR === "ltr" ? "en" : "ar";

// Minimal wrapper: every /admin/* page renders into this.
// The cinematic Lenis smooth-scroll is intentionally absent for admin work.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-root min-h-screen" dir={ADMIN_DIR} lang={ADMIN_LANG}>
      {children}
    </div>
  );
}
