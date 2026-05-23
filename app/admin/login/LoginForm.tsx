"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction, type LoginResult } from "./actions";

const initial: LoginResult = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex items-center justify-center gap-3 border border-[#ff6a00] bg-[#ff6a00] px-5 py-3 font-mono text-[11px] tracking-[0.24em] text-white uppercase transition-colors hover:bg-[#ff7d20] disabled:opacity-60"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export default function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useFormState(loginAction, initial);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <label className="flex flex-col gap-2">
        <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-white/55">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="bg-transparent border border-white/15 px-4 py-3 outline-none focus:border-[#ff6a00] text-white/95"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-white/55">Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          minLength={8}
          className="bg-transparent border border-white/15 px-4 py-3 outline-none focus:border-[#ff6a00] text-white/95"
        />
      </label>
      {state.error ? (
        <p className="text-[13px] text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
