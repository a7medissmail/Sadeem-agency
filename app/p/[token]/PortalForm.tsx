"use client";

import { useState, useTransition } from "react";
import { submitProposalAction } from "@/app/admin/(authed)/proposals/actions";

type FieldOption = string;

type PortalField = {
  id: string;
  field_key: string;
  label: string;
  type: string;
  placeholder: string | null;
  help_text: string | null;
  options: FieldOption[];
  is_required: boolean;
  sort_order: number;
};

type Props = {
  proposalId: string;
  formId: string;
  clientName: string;
  clientEmail: string;
  fields: PortalField[];
  submitLabel: string;
  successMessage: string | null;
};

export default function PortalForm({
  proposalId,
  formId,
  clientName,
  clientEmail,
  fields,
  submitLabel,
  successMessage,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [multiValues, setMultiValues] = useState<Record<string, string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function set(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function toggleMulti(key: string, val: string) {
    setMultiValues((prev) => {
      const current = prev[key] ?? [];
      return {
        ...prev,
        [key]: current.includes(val)
          ? current.filter((v) => v !== val)
          : [...current, val],
      };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Merge single + multi values
    const answers: Record<string, string> = { ...values };
    for (const [key, vals] of Object.entries(multiValues)) {
      answers[key] = vals.join(", ");
    }

    // Client-side required check
    for (const field of fields) {
      if (!field.is_required) continue;
      if (field.type === "multiselect") {
        if (!multiValues[field.field_key]?.length) {
          setError(`"${field.label}" is required.`);
          return;
        }
      } else if (field.type === "checkbox") {
        // checkbox required = must be checked
        if (!answers[field.field_key]) {
          setError(`"${field.label}" is required.`);
          return;
        }
      } else {
        if (!answers[field.field_key]?.trim()) {
          setError(`"${field.label}" is required.`);
          return;
        }
      }
    }

    startTransition(async () => {
      const result = await submitProposalAction(
        proposalId,
        formId,
        clientName,
        clientEmail,
        answers,
      );
      if (result.ok) {
        setSubmitted(true);
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  if (submitted) {
    return (
      <div className="portal-success">
        <span className="portal-success-tick" aria-hidden="true" />
        <h2 className="portal-success-heading">Brief received.</h2>
        <p className="portal-success-sub">
          {successMessage ||
            "Thank you. Our team will review your responses and be in touch shortly."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="portal-form" noValidate>
      {error ? (
        <div className="portal-error" role="alert">
          {error}
        </div>
      ) : null}

      {fields.map((field) => (
        <div key={field.id} className="portal-field">
          <label className="portal-label" htmlFor={field.field_key}>
            {field.label}
            {field.is_required ? (
              <span className="portal-required" aria-label="required"> *</span>
            ) : null}
          </label>

          {field.help_text ? (
            <p className="portal-help">{field.help_text}</p>
          ) : null}

          {/* ── Render by type ── */}
          {field.type === "textarea" ? (
            <textarea
              id={field.field_key}
              name={field.field_key}
              placeholder={field.placeholder ?? ""}
              required={field.is_required}
              className="portal-textarea"
              value={values[field.field_key] ?? ""}
              onChange={(e) => set(field.field_key, e.target.value)}
            />
          ) : field.type === "select" ? (
            <select
              id={field.field_key}
              name={field.field_key}
              required={field.is_required}
              className="portal-select"
              value={values[field.field_key] ?? ""}
              onChange={(e) => set(field.field_key, e.target.value)}
            >
              <option value="">Select an option</option>
              {field.options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : field.type === "multiselect" ? (
            <div className="portal-multiselect">
              {field.options.map((opt) => {
                const checked = (multiValues[field.field_key] ?? []).includes(opt);
                return (
                  <label key={opt} className={`portal-check-item ${checked ? "portal-check-item--active" : ""}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMulti(field.field_key, opt)}
                      className="sr-only"
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
          ) : field.type === "checkbox" ? (
            <label className="portal-checkbox-wrap">
              <input
                id={field.field_key}
                type="checkbox"
                className="portal-checkbox"
                checked={values[field.field_key] === "true"}
                onChange={(e) => set(field.field_key, e.target.checked ? "true" : "")}
              />
              <span>{field.placeholder || "Yes"}</span>
            </label>
          ) : field.type === "date" ? (
            <input
              id={field.field_key}
              type="date"
              name={field.field_key}
              required={field.is_required}
              className="portal-input"
              value={values[field.field_key] ?? ""}
              onChange={(e) => set(field.field_key, e.target.value)}
            />
          ) : field.type === "file" ? (
            <p className="portal-file-note">
              File uploads are not supported in this brief format. Please include a link or describe what you&apos;d like to share.
            </p>
          ) : (
            /* text | email | phone | url */
            <input
              id={field.field_key}
              type={
                field.type === "email" ? "email"
                  : field.type === "phone" ? "tel"
                  : field.type === "url" ? "url"
                  : "text"
              }
              name={field.field_key}
              placeholder={field.placeholder ?? ""}
              required={field.is_required}
              className="portal-input"
              value={values[field.field_key] ?? ""}
              onChange={(e) => set(field.field_key, e.target.value)}
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={isPending}
        className="portal-submit"
      >
        {isPending ? "Submitting…" : submitLabel}
      </button>
    </form>
  );
}
