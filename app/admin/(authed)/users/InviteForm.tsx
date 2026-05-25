"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/admin/ui/Button";
import { FieldRow, Input, Select } from "@/components/admin/ui/Field";
import { inviteUserAction, type ActionResult } from "./actions";

const initial: ActionResult = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Sending..." : "Send invite"}</Button>;
}

export default function InviteForm() {
  const [state, formAction] = useFormState(inviteUserAction, initial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={ref}
      action={formAction}
      className="flex max-w-[760px] flex-col gap-4 border border-[var(--admin-border)] bg-[var(--admin-panel)] p-6"
    >
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-accent)]">Invite a staff user</p>
        <h2 className="mt-2 text-[18px] font-semibold tracking-tight text-[var(--admin-text)]">New user</h2>
        <p className="mt-1 text-[13px] text-[var(--admin-muted)]">
          They&apos;ll receive an email from Supabase to set their password. Roles can be changed any time.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <FieldRow label="Full name">
          <Input name="full_name" required />
        </FieldRow>
        <FieldRow label="Email">
          <Input name="email" type="email" required />
        </FieldRow>
      </div>

      <div className="max-w-[260px]">
        <FieldRow label="Role">
          <Select name="role" defaultValue="viewer">
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </Select>
        </FieldRow>
      </div>

      {state.error ? <p className="text-[13px] text-red-400" role="alert">{state.error}</p> : null}
      {state.ok ? <p className="text-[13px] text-emerald-300">Invitation sent.</p> : null}
      <SubmitButton />
    </form>
  );
}
