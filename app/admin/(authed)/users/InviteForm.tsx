"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { inviteUserAction, type ActionResult } from "./actions";

const initial: ActionResult = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start inline-flex items-center gap-3 border border-[#ff6a00] bg-[#ff6a00] px-5 py-2.5 font-mono text-[10.5px] tracking-[0.24em] uppercase text-white hover:bg-[#ff7d20] transition-colors disabled:opacity-60"
    >
      {pending ? "Sending…" : "Send invite"}
    </button>
  );
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
      className="border border-white/10 rounded-xl bg-white/[0.02] p-6 flex flex-col gap-4 max-w-[640px]"
    >
      <div>
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#ff6a00]">INVITE A STAFF USER</p>
        <h2 className="mt-2 text-[18px] font-semibold tracking-tight">New user</h2>
        <p className="mt-1 text-[13px] text-white/55">
          They'll receive an email from Supabase to set their password. Roles can be changed any time.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/55">Full name</span>
          <input
            name="full_name"
            required
            className="bg-transparent border border-white/15 px-3 py-2 outline-none focus:border-[#ff6a00] text-white/95"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/55">Email</span>
          <input
            name="email"
            type="email"
            required
            className="bg-transparent border border-white/15 px-3 py-2 outline-none focus:border-[#ff6a00] text-white/95"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 max-w-[220px]">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/55">Role</span>
        <select
          name="role"
          defaultValue="viewer"
          className="bg-[#0a0b0d] border border-white/15 px-3 py-2 outline-none focus:border-[#ff6a00] text-white/95"
        >
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      {state.error ? (
        <p className="text-[13px] text-red-400" role="alert">{state.error}</p>
      ) : null}
      {state.ok ? <p className="text-[13px] text-emerald-300">Invitation sent.</p> : null}
      <SubmitButton />
    </form>
  );
}
