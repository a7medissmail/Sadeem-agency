"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitApplicationAction, type SubmitApplicationState } from "@/lib/actions/applications";

const initial: SubmitApplicationState = { status: "idle" };

function SubmitButton({ idle }: { idle: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="career-apply-submit" disabled={pending}>
      <span>{pending ? "Sending application" : idle ? "Submit application" : "Try again"}</span>
      <span aria-hidden>+</span>
    </button>
  );
}

function FieldError({ message }: { message?: string[] }) {
  if (!message?.length) return null;
  return <p className="career-apply-field-error">{message[0]}</p>;
}

export default function JobApplicationForm({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const [state, formAction] = useFormState(submitApplicationAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  if (state.status === "success") {
    return (
      <div className="career-apply-success">
        <p className="course-register-kicker">APPLICATION RECEIVED</p>
        <h3>We have your profile.</h3>
        <p>
          The SADEEM team will review your application for {jobTitle} and follow up if there is a strong fit.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} encType="multipart/form-data" className="career-apply-form">
      <input type="hidden" name="job_id" value={jobId} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="course-register-row">
        <label>
          <span>Name</span>
          <input name="name" required autoComplete="name" aria-invalid={Boolean(errors.name)} />
          <FieldError message={errors.name} />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" required autoComplete="email" aria-invalid={Boolean(errors.email)} />
          <FieldError message={errors.email} />
        </label>
      </div>

      <label>
        <span>Phone</span>
        <input name="phone" type="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} />
        <FieldError message={errors.phone} />
      </label>

      <label>
        <span>Resume (PDF / DOC / DOCX, under 5 MB)</span>
        <input
          name="resume"
          type="file"
          required
          accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          aria-invalid={Boolean(errors.resume)}
        />
        <FieldError message={errors.resume} />
      </label>

      <label>
        <span>Why this role?</span>
        <textarea
          name="cover_note"
          rows={6}
          placeholder="Share the work you want to own, what you have built, and why SADEEM feels like the right room."
          aria-invalid={Boolean(errors.cover_note)}
        />
        <FieldError message={errors.cover_note} />
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
