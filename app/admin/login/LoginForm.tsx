"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/admin/ui/Button";
import { FieldRow, Input } from "@/components/admin/ui/Field";
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
      {/* Was two hand-rolled inputs with their own border, focus colour and
          text colour. Same control as every other form in the tool now. */}
      <FieldRow label="Email">
        <Input name="email" type="email" required autoComplete="email" />
      </FieldRow>
      <FieldRow label="Password">
        <Input name="password" type="password" required autoComplete="current-password" minLength={8} />
      </FieldRow>
      {state.error ? (
        <p className="text-[13px] text-[var(--sdm-text-danger)]" role="alert">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
