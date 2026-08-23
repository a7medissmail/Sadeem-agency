import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in — SADEEM Admin" };

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-[380px]">
        <p className="sdm-eyebrow mb-3 text-[var(--sdm-text-tertiary)]">SADEEM ADMIN</p>
        <h1 className="sdm-page-title mb-8">Sign in to continue.</h1>
        <LoginForm next={searchParams?.next} />
        <p className="sdm-helper-text mt-8 text-[var(--sdm-text-disabled)]">
          Access is restricted to SADEEM staff.
        </p>
      </div>
    </main>
  );
}
