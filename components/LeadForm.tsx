"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitLeadAction, type SubmitLeadState } from "@/lib/actions/leads";

const initial: SubmitLeadState = { status: "idle" };

type Source = "homepage" | "course" | "consultation" | "other";

function Submit({ idle }: { idle: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex items-center justify-center gap-3 bg-[var(--accent)] text-white px-6 py-3 font-mono text-[11px] tracking-[0.24em] uppercase hover:brightness-110 transition disabled:opacity-60"
    >
      {pending ? "Sending..." : idle ? "Send" : "Try again"}
    </button>
  );
}

export default function LeadForm({
  source = "homepage",
  compact = false,
}: {
  source?: Source;
  compact?: boolean;
}) {
  const [state, formAction] = useFormState(submitLeadAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  if (state.status === "success") {
    return (
      <div className="border border-[var(--accent)]/40 rounded-xl bg-[var(--accent)]/[0.05] p-6">
        <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-[var(--accent)]">RECEIVED</p>
        <h3 className="mt-3 text-[22px] font-semibold tracking-tight">Thank you.</h3>
        <p className="mt-2 text-[14.5px] text-black/65 max-w-[40ch]">
          Your message reached us. A SADEEM team member will reach out shortly, usually within one business day.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="source" value={source} />
      {/* honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <div className={compact ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-black/55">Name</span>
          <input
            name="name"
            required
            autoComplete="name"
            className="bg-white border border-black/15 px-3.5 py-3 outline-none focus:border-[var(--accent)] text-black"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-black/55">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="bg-white border border-black/15 px-3.5 py-3 outline-none focus:border-[var(--accent)] text-black"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-black/55">
            Phone <span className="text-black/30">(optional)</span>
          </span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            className="bg-white border border-black/15 px-3.5 py-3 outline-none focus:border-[var(--accent)] text-black"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-black/55">
            Company <span className="text-black/30">(optional)</span>
          </span>
          <input
            name="company"
            autoComplete="organization"
            className="bg-white border border-black/15 px-3.5 py-3 outline-none focus:border-[var(--accent)] text-black"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-black/55">
          What would you like to explore?
        </span>
        <textarea
          name="message"
          rows={4}
          className="bg-white border border-black/15 px-3.5 py-3 outline-none focus:border-[var(--accent)] text-black resize-y"
        />
      </label>
      {state.status === "error" ? (
        <p className="text-[13.5px] text-red-600" role="alert">
          {state.message}
        </p>
      ) : null}
      <Submit idle={state.status === "idle"} />
    </form>
  );
}
