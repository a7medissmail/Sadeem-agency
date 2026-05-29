"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitApplicationAction, type SubmitApplicationState } from "@/lib/actions/applications";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import type { Database, FormFieldType, Json } from "@/types/database";

type ApplicationForm = Pick<
  Database["public"]["Tables"]["forms"]["Row"],
  "id" | "name" | "description" | "submit_label" | "success_message"
>;

type ApplicationField = Pick<
  Database["public"]["Tables"]["form_fields"]["Row"],
  "id" | "label" | "field_key" | "type" | "placeholder" | "help_text" | "options" | "is_required" | "sort_order"
>;

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

const fieldTypeLabels: Record<FormFieldType, string> = {
  text: "Text",
  textarea: "Long answer",
  email: "Email",
  phone: "Phone",
  url: "Link",
  select: "Select",
  multiselect: "Choose many",
  checkbox: "Checklist",
  file: "File",
  date: "Date",
};

function customName(field: ApplicationField) {
  return `custom__${field.field_key}`;
}

function optionList(options: Json) {
  if (!Array.isArray(options)) return [];
  return options
    .map((option) => {
      if (!option || typeof option !== "object" || Array.isArray(option)) return null;
      const label = "label" in option ? String(option.label ?? "") : "";
      const value = "value" in option ? String(option.value ?? "") : "";
      return label && value ? { label, value } : null;
    })
    .filter((option): option is { label: string; value: string } => Boolean(option));
}

function CustomFieldControl({ field, error }: { field: ApplicationField; error?: string[] }) {
  const name = customName(field);
  const common = {
    id: name,
    name,
    required: field.is_required,
    "aria-invalid": Boolean(error?.length),
  };
  const placeholder = field.placeholder ?? undefined;
  const options = optionList(field.options);

  if (field.type === "textarea") {
    return <textarea {...common} rows={5} placeholder={placeholder} />;
  }

  if (field.type === "select") {
    return (
      <select {...common} defaultValue="">
        <option value="" disabled>
          {placeholder || "Choose one"}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "multiselect" || field.type === "checkbox") {
    return (
      <div className="career-apply-options">
        {options.map((option) => (
          <label key={option.value} className="career-apply-option">
            <input name={name} value={option.value} type="checkbox" />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    );
  }

  if (field.type === "file") {
    return <p className="career-apply-note">Extra file uploads are not enabled for this form yet.</p>;
  }

  const inputType =
    field.type === "email" || field.type === "url" || field.type === "date"
      ? field.type
      : field.type === "phone"
        ? "tel"
        : "text";

  return <input {...common} type={inputType} placeholder={placeholder} />;
}

export default function JobApplicationForm({
  jobId,
  jobTitle,
  customForm,
  customFields = [],
}: {
  jobId: string;
  jobTitle: string;
  customForm?: ApplicationForm | null;
  customFields?: ApplicationField[];
}) {
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

      {customForm && customFields.length > 0 ? (
        <div className="career-apply-custom">
          <div className="career-apply-custom-head">
            <p>{customForm.name}</p>
            {customForm.description ? <span>{customForm.description}</span> : null}
          </div>
          {customFields.map((field) => {
            const name = customName(field);
            return (
              <label key={field.id} htmlFor={name}>
                <span>
                  {field.label}
                  {field.is_required ? " *" : ""}
                  <em>{fieldTypeLabels[field.type]}</em>
                </span>
                <CustomFieldControl field={field} error={errors[name]} />
                {field.help_text ? <small>{field.help_text}</small> : null}
                <FieldError message={errors[name]} />
              </label>
            );
          })}
        </div>
      ) : null}

      <TurnstileWidget />
      {state.status === "error" ? (
        <p className="course-register-error" role="alert">
          {state.message}
        </p>
      ) : null}

      <SubmitButton idle={state.status === "idle"} />
    </form>
  );
}
