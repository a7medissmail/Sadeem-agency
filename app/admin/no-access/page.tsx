import { signOutAction } from "@/app/admin/login/actions";

export const metadata = {
  title: "No access — SADEEM Admin",
  robots: { index: false, follow: false },
};

/**
 * Where a signed-in account that isn't staff lands.
 *
 * This page exists outside the (authed) group on purpose. Sending a non-staff
 * user back to /admin put them in a loop — the layout refused them, redirected
 * to /admin, and the layout refused them again — and sending them to
 * /admin/login was no better, because middleware bounces signed-in users off
 * the login page. A dead end that explains itself is the only exit that
 * terminates, and the sign-out button is what actually unsticks them.
 */
export default function NoAccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-[420px]">
        <p className="sdm-eyebrow mb-3 text-[var(--sdm-text-tertiary)]">SADEEM ADMIN</p>
        <h1 className="sdm-page-title mb-4">This account has no admin access.</h1>
        <p className="sdm-helper-text mb-8 text-[var(--sdm-text-secondary)]">
          You are signed in, but the account isn&apos;t on the SADEEM staff list. If this is
          wrong, ask an administrator to grant you a role, then sign in again.
        </p>
        <form action={signOutAction}>
          <button type="submit" className="admin-signout">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
