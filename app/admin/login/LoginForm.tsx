"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/admin/ui/Button";
import { loginAction, type LoginResult } from "./actions";

const initial: LoginResult = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  // Was a hand-rolled button with hard-coded hexes, sitting outside the system
  // on the one screen every session starts with.
  return (
    <Button type="submit" size="lg" loading={pending} loadingLabel="Signing in…" className="mt-2">
      Sign in
    </Button>
  );
}

export default function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useFormState(loginAction, initial);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <label className="flex flex-col gap-2">
        <span className="sdm-eyebrow text-white/55">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="bg-transparent border border-white/15 px-4 py-3 outline-none focus:border-[#ff6a00] text-white/95"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="sdm-eyebrow text-white/55">Password</span>
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
