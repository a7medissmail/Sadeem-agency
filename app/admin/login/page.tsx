import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in — SADEEM Admin" };

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-[380px]">
        <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-[#ff6a00] mb-3">SADEEM ADMIN</p>
        <h1 className="text-[28px] font-semibold tracking-tight mb-8">Sign in to continue.</h1>
        <LoginForm next={searchParams?.next} />
        <p className="mt-8 font-mono text-[10px] tracking-[0.18em] uppercase text-white/35">
          Access is restricted to SADEEM staff.
        </p>
      </div>
    </main>
  );
}
