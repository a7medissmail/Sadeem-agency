"use client";

import { useState, useEffect, useTransition } from "react";
import { submitProposalAction } from "@/app/admin/(authed)/proposals/actions";
import { BRIEF_STEPS, briefUi, tb, type BriefLocale, type BriefField } from "./briefSchema";

type BriefData = Record<string, string | string[]>;

type BriefStepperProps = {
  proposalId: string;
  formId: string | null;
  clientName: string;
  clientEmail: string;
  successMessage?: string | null;
  locale?: string;
};

const STORAGE_KEY_PREFIX = "sadeem_brief_draft_";

// ─── Field control ──────────────────────────────────────────────────────────
function FieldControl({
  field,
  locale,
  value,
  onChange,
}: {
  field: BriefField;
  locale: BriefLocale;
  value: string | string[];
  onChange: (v: string | string[]) => void;
}) {
  if (field.type === "select") {
    return (
      <select className="brief-select" name={field.name} value={(value as string) || ""} onChange={(e) => onChange(e.target.value)}>
        {field.placeholder ? <option value="">{tb(field.placeholder, locale)}</option> : null}
        {field.options?.map((o) => {
          const label = tb(o, locale);
          return <option key={label} value={label}>{label}</option>;
        })}
      </select>
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        className="brief-textarea"
        name={field.name}
        rows={field.rows ?? 4}
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder ? tb(field.placeholder, locale) : undefined}
      />
    );
  }

  if (field.type === "multichip") {
    const arr = (value as string[]) || [];
    const toggle = (label: string) =>
      onChange(arr.includes(label) ? arr.filter((v) => v !== label) : [...arr, label]);
    return (
      <div className="brief-chips">
        {field.options?.map((o) => {
          const label = tb(o, locale);
          return (
            <button
              key={label}
              type="button"
              onClick={() => toggle(label)}
              className={`brief-chip${arr.includes(label) ? " brief-chip--on" : ""}`}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <input
      type="text"
      className="brief-input"
      name={field.name}
      value={(value as string) || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder ? tb(field.placeholder, locale) : undefined}
    />
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BriefStepper({
  proposalId,
  formId,
  clientName,
  clientEmail,
  successMessage,
  locale: localeProp,
}: BriefStepperProps) {
  const locale: BriefLocale = localeProp === "ar" ? "ar" : "en";

  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<BriefData>({});
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const storageKey = `${STORAGE_KEY_PREFIX}${proposalId}`;
  const step = BRIEF_STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === BRIEF_STEPS.length - 1;
  const visibleFields = step.fields.filter((f) => !f.showIf || f.showIf(data));

  // Load / save draft
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setData(JSON.parse(saved));
    } catch { /* ignore */ }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch { /* ignore */ }
  }, [data, storageKey]);

  function setField(name: string, value: string | string[]) {
    setData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  }

  function validate(): string | null {
    for (const f of visibleFields) {
      const v = data[f.name];
      const empty = v == null || v === "" || (Array.isArray(v) && v.length === 0);
      if (f.required && empty) return tb(briefUi.errRequired, locale);
      if (f.minLength && typeof v === "string" && v.trim().length < f.minLength) return tb(briefUi.errMore, locale);
    }
    return null;
  }

  function handleNext() {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setStepIndex((i) => i + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    setError(null);
    setStepIndex((i) => i - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSubmit() {
    const err = validate();
    if (err) { setError(err); return; }

    const answers: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) answers[k] = Array.isArray(v) ? v.join(", ") : String(v);
    answers["_brief_version"] = "2";
    answers["_locale"] = locale;

    startTransition(async () => {
      const result = await submitProposalAction(proposalId, formId, clientName, clientEmail, answers);
      if (result.ok) {
        try { localStorage.removeItem(storageKey); } catch { /* ok */ }
        setSubmitted(true);
      } else if (result.error === "already_submitted") {
        setSubmitted(true);
      } else if (result.error === "expired") {
        setError(tb(briefUi.errExpired, locale));
      } else {
        setError(result.error ?? tb(briefUi.errGeneric, locale));
      }
    });
  }

  if (submitted) {
    return (
      <div className="brief-success">
        <div className="brief-success-icon" aria-hidden="true">✓</div>
        <h2 className="brief-success-title">{tb(briefUi.successTitle, locale)}</h2>
        <p className="brief-success-body">{successMessage || tb(briefUi.successBody, locale)}</p>
      </div>
    );
  }

  return (
    <div className="brief-stepper">
      {/* Progress bar */}
      <div className="brief-progress" aria-hidden="true">
        <div className="brief-progress-fill" style={{ width: `${((stepIndex + 1) / BRIEF_STEPS.length) * 100}%` }} />
      </div>

      {/* Step nav dots */}
      <div className="brief-steps-nav" role="list" aria-label="Brief steps">
        {BRIEF_STEPS.map((s, i) => (
          <div
            key={s.id}
            role="listitem"
            className={`brief-step-dot ${i < stepIndex ? "brief-step-dot--done" : ""} ${i === stepIndex ? "brief-step-dot--active" : ""}`}
            aria-current={i === stepIndex ? "step" : undefined}
          >
            <span className="brief-step-num">{i < stepIndex ? "✓" : i + 1}</span>
            <span className="brief-step-label">{tb(s.title, locale)}</span>
          </div>
        ))}
      </div>

      {/* Step header */}
      <div className="brief-step-header">
        <p className="brief-step-count">
          {tb(briefUi.stepCount, locale)} {stepIndex + 1} {tb(briefUi.of, locale)} {BRIEF_STEPS.length}
        </p>
        <h2 className="brief-step-title">{tb(step.title, locale)}</h2>
        <p className="brief-step-subtitle">{tb(step.subtitle, locale)}</p>
      </div>

      {/* Step content */}
      <div className="brief-step-body">
        <div className="brief-fields">
          {visibleFields.map((f) => (
            <div key={f.name} className="brief-field">
              <label className="brief-label">
                {tb(f.label, locale)}
                {f.required ? <span className="brief-required">*</span> : null}
              </label>
              {f.hint ? <p className="brief-hint">{tb(f.hint, locale)}</p> : null}
              <FieldControl
                field={f}
                locale={locale}
                value={data[f.name] ?? (f.type === "multichip" ? [] : "")}
                onChange={(v) => setField(f.name, v)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error ? <p className="brief-error" role="alert">{error}</p> : null}

      {/* Navigation */}
      <div className="brief-nav">
        {!isFirst ? (
          <button type="button" onClick={handleBack} className="brief-btn-back" disabled={isPending}>
            {tb(briefUi.back, locale)}
          </button>
        ) : <span />}

        {!isLast ? (
          <button type="button" onClick={handleNext} className="brief-btn-next" disabled={isPending}>
            {tb(briefUi.continue, locale)}
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} className="brief-btn-submit" disabled={isPending}>
            {isPending ? tb(briefUi.submitting, locale) : tb(briefUi.submit, locale)}
          </button>
        )}
      </div>

      {/* Draft saved notice */}
      <p className="brief-draft-note">{tb(briefUi.draftNote, locale)}</p>
    </div>
  );
}
