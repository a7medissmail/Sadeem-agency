"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitDynamicFormAction, type DynamicFormState } from "@/lib/actions/dynamicForms";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import type { Database, FormFieldType, Json } from "@/types/database";

type FormRow = Pick<
  Database["public"]["Tables"]["forms"]["Row"],
  "id" | "slug" | "name" | "purpose" | "description" | "submit_label" | "success_message" | "is_active"
>;
type FieldRow = Pick<
  Database["public"]["Tables"]["form_fields"]["Row"],
  "id" | "form_id" | "label" | "field_key" | "type" | "placeholder" | "help_text" | "options" | "is_required" | "sort_order"
>;

const initial: DynamicFormState = { status: "idle" };

const fieldTypeLabels: Record<FormFieldType, string> = {
  text: "Text",
  textarea: "Long answer",
  email: "Email",
  phone: "Phone",
  url: "URL",
  select: "Select",
  multiselect: "Choose many",
  checkbox: "Checklist",
  file: "File",
  date: "Date",
};

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

function SubmitButton({ label, preview }: { label: string; preview: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || preview} className="dynamic-form-submit">
      <span>{preview ? "Preview only" : pending ? "Sending..." : label}</span>
      <span aria-hidden>-&gt;</span>
    </button>
  );
}

function FieldControl({
  field,
  error,
  preview,
}: {
  field: FieldRow;
  error?: string;
  preview: boolean;
}) {
  const common = {
    name: field.field_key,
    id: field.field_key,
    required: field.is_required,
    disabled: preview,
    "aria-invalid": Boolean(error),
  };

  const options = optionList(field.options);
  const placeholder = field.placeholder ?? undefined;

  if (field.type === "textarea") {
    return <textarea {...common} rows={5} placeholder={placeholder} className="dynamic-form-input dynamic-form-textarea" />;
  }

  if (field.type === "select") {
    return (
      <select {...common} defaultValue="" className="dynamic-form-input">
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
      <div className="dynamic-form-options">
        {options.length === 0 ? (
          <p>No options configured.</p>
        ) : (
          options.map((option) => (
            <label key={option.value} className="dynamic-form-option">
              <input name={field.field_key} value={option.value} type="checkbox" disabled={preview} />
              <span>{option.label}</span>
            </label>
          ))
        )}
      </div>
    );
  }

  const inputType =
    field.type === "email" || field.type === "url" || field.type === "date"
      ? field.type
      : field.type === "phone"
        ? "tel"
        : field.type === "file"
          ? "file"
          : "text";

  return <input {...common} type={inputType} placeholder={placeholder} className="dynamic-form-input" />;
}

export default function DynamicFormRenderer({
  form,
  fields,
  preview = false,
}: {
  form: FormRow;
  fields: FieldRow[];
  preview?: boolean;
}) {
  const [state, formAction] = useFormState(submitDynamicFormAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const sortedFields = useMemo(
    () => [...fields].sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label)),
    [fields],
  );

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  if (state.status === "success") {
    return (
      <div className="dynamic-form-success">
        <p>RECEIVED</p>
        <h2>{form.success_message || state.message || "Your response has been received."}</h2>
      </div>
    );
  }

  return (
    <form ref={formRef} action={preview ? undefined : formAction} className="dynamic-form-shell">
      <input type="hidden" name="form_id" value={form.id} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="dynamic-form-head">
        <p>{form.purpose}</p>
        <h2>{form.name}</h2>
        {form.description ? <span>{form.description}</span> : null}
      </div>

      <div className="dynamic-form-fields">
        {sortedFields.length === 0 ? (
          <div className="dynamic-form-empty">No fields configured yet.</div>
        ) : (
          sortedFields.map((field) => (
            <label key={field.id} className="dynamic-form-field" htmlFor={field.field_key}>
              <span className="dynamic-form-label">
                <span>
                  {field.label}
                  {field.is_required ? <b>*</b> : null}
                </span>
                <em>{fieldTypeLabels[field.type]}</em>
              </span>
              <FieldControl field={field} error={state.fieldErrors?.[field.field_key]} preview={preview} />
              {field.help_text ? <small>{field.help_text}</small> : null}
              {state.fieldErrors?.[field.field_key] ? <strong>{state.fieldErrors[field.field_key]}</strong> : null}
            </label>
          ))
        )}
      </div>

      <TurnstileWidget />
      {state.status === "error" ? (
        <p className="dynamic-form-error" role="alert">
          {state.message}
        </p>
      ) : null}

      <SubmitButton label={form.submit_label} preview={preview} />
    </form>
  );
}
