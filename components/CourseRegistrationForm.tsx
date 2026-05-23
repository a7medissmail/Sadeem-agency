"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitLeadAction, type SubmitLeadState } from "@/lib/actions/leads";

const initial: SubmitLeadState = { status: "idle" };

function SubmitButton({ idle }: { idle: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="course-register-submit" disabled={pending}>
      <span>{pending ? "Sending request" : idle ? "Request a seat" : "Try again"}</span>
      <span aria-hidden>+</span>
    </button>
  );
}

export default function CourseRegistrationForm({
  courseTitle,
  dateRange,
}: {
  courseTitle: string;
  dateRange: string | null;
}) {
  const [state, formAction] = useFormState(submitLeadAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  if (state.status === "success") {
    return (
      <div className="course-register-success">
        <p className="course-register-kicker">REQUEST RECEIVED</p>
        <h3>We have your seat request.</h3>
        <p>
          The SADEEM team will review the cohort fit and reply with the next step. We usually respond within one
          business day.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="course-register-form">
      <input type="hidden" name="source" value="course" />
      <input
        type="hidden"
        name="context"
        value={`Workshop interest: ${courseTitle}${dateRange ? ` (${dateRange})` : ""}`}
      />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="course-register-row">
        <label>
          <span>Name</span>
          <input name="name" required autoComplete="name" />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" required autoComplete="email" />
        </label>
      </div>

      <div className="course-register-row">
        <label>
          <span>Phone</span>
          <input name="phone" type="tel" autoComplete="tel" />
        </label>
        <label>
          <span>Company / project</span>
          <input name="company" autoComplete="organization" />
        </label>
      </div>

      <label>
        <span>Your ecommerce challenge</span>
        <textarea
          name="message"
          rows={5}
          placeholder="Tell us what you are building, where you are stuck, or who from your team should attend."
        />
      </label>

      {state.status === "error" ? (
        <p className="course-register-error" role="alert">
          {state.message}
        </p>
      ) : null}

      <SubmitButton idle={state.status === "idle"} />
    </form>
  );
}
