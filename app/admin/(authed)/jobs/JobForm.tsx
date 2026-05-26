"use client";

import { useState, type KeyboardEvent } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/admin/ui/Button";
import { SaveStatus } from "@/components/admin/ui/SaveStatus";
import { useAutoSave } from "@/components/admin/hooks/useAutoSave";
import { FieldRow, Input, Select, Textarea } from "@/components/admin/ui/Field";
import { jobTypes, type JobFieldErrors } from "@/lib/validation/careers";
import type { JobType } from "@/types/database";
import { createJobAction, updateJobAction, type JobFormState } from "./actions";

const initial: JobFormState = {};

type JobFormValues = {
  id?: string;
  title?: string;
  slug?: string;
  type?: JobType;
  department?: string | null;
  location?: string | null;
  body?: string | null;
  requirements?: string | null;
  application_form_id?: string | null;
  is_open?: boolean;
};

type ApplicationFormOption = {
  id: string;
  name: string;
  purpose: string;
  is_active: boolean;
};

function toSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-[12.5px] leading-snug text-red-300">{messages[0]}</p>;
}

function onCodeEditorKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
  if (event.key !== "Tab" || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
  event.preventDefault();
  const textarea = event.currentTarget;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const nextValue = `${textarea.value.slice(0, start)}  ${textarea.value.slice(end)}`;
  textarea.value = nextValue;
  textarea.selectionStart = start + 2;
  textarea.selectionEnd = start + 2;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function Fields({
  job,
  forms = [],
  errors = {},
  onTitleChange,
  slug,
  setSlug,
  setSlugTouched,
  title,
}: {
  job?: JobFormValues;
  forms?: ApplicationFormOption[];
  errors?: Record<string, string[]>;
  onTitleChange?: (v: string) => void;
  slug: string;
  setSlug: (v: string) => void;
  setSlugTouched: (v: boolean) => void;
  title: string;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <FieldRow label="Title">
          <Input
            name="title"
            required
            value={title}
            onChange={(e) => onTitleChange?.(e.target.value)}
            aria-invalid={Boolean(errors.title)}
            placeholder="Senior Growth Operator"
          />
          <FieldError messages={errors.title} />
        </FieldRow>

        <FieldRow label="Slug">
          <Input
            name="slug"
            required
            value={slug}
            onBlur={(e) => setSlug(toSlug(e.target.value) || e.target.value.trim())}
            onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
            aria-invalid={Boolean(errors.slug)}
            placeholder="senior-growth-operator"
          />
          <FieldError messages={errors.slug} />
        </FieldRow>

        <FieldRow label="Type">
          <Select name="type" defaultValue={job?.type ?? "job"} aria-invalid={Boolean(errors.type)}>
            {jobTypes.map((type) => (
              <option key={type} value={type}>{type === "job" ? "Job" : "Internship"}</option>
            ))}
          </Select>
          <FieldError messages={errors.type} />
        </FieldRow>

        <FieldRow label="Department">
          <Input name="department" defaultValue={job?.department ?? ""} maxLength={140} aria-invalid={Boolean(errors.department)} placeholder="Operations" />
          <FieldError messages={errors.department} />
        </FieldRow>

        <FieldRow label="Location">
          <Input name="location" defaultValue={job?.location ?? ""} maxLength={180} aria-invalid={Boolean(errors.location)} placeholder="Riyadh / Hybrid" />
          <FieldError messages={errors.location} />
        </FieldRow>

        <FieldRow label="Open (visible on public careers)">
          <span className="mt-1 inline-flex cursor-pointer select-none items-center gap-3">
            <input type="checkbox" name="is_open" defaultChecked={job?.is_open ?? false} className="h-4 w-4 accent-[var(--admin-accent)]" />
            <span className="text-[13.5px] text-[var(--admin-muted)]">Accept applications</span>
          </span>
        </FieldRow>

        <FieldRow label="Application form">
          <Select name="application_form_id" defaultValue={job?.application_form_id ?? ""} aria-invalid={Boolean(errors.application_form_id)}>
            <option value="">Default SADEEM application</option>
            {forms.map((form) => (
              <option key={form.id} value={form.id}>{form.name} {form.is_active ? "" : "(draft)"}</option>
            ))}
          </Select>
          <p className="text-[12.5px] leading-relaxed text-[var(--admin-subtle)]">
            Attach a Form Builder application form to ask role-specific questions.
          </p>
          <FieldError messages={errors.application_form_id} />
        </FieldRow>
      </div>

      <FieldRow label="Role body HTML / plain text">
        <Textarea
          name="body"
          rows={12}
          defaultValue={job?.body ?? ""}
          maxLength={20000}
          spellCheck={false}
          onKeyDown={onCodeEditorKeyDown}
          aria-invalid={Boolean(errors.body)}
          className="min-h-[280px] font-mono text-[13px] leading-relaxed text-[var(--admin-text)] [tab-size:2]"
          placeholder={`<p>Describe the role, mission, and impact.</p>\n<ul><li>What they will own</li><li>How they will work</li></ul>`}
        />
        <FieldError messages={errors.body} />
      </FieldRow>

      <FieldRow label="Requirements HTML / plain text">
        <Textarea
          name="requirements"
          rows={9}
          defaultValue={job?.requirements ?? ""}
          maxLength={12000}
          spellCheck={false}
          onKeyDown={onCodeEditorKeyDown}
          aria-invalid={Boolean(errors.requirements)}
          className="min-h-[220px] font-mono text-[13px] leading-relaxed text-[var(--admin-text)] [tab-size:2]"
          placeholder={`<ul><li>Operator mindset</li><li>Strong writing and analytical judgment</li></ul>`}
        />
        <FieldError messages={errors.requirements} />
      </FieldRow>
    </>
  );
}

// ─── Create (keeps submit button) ────────────────────────────────────────────

function CreateButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Create role"}</Button>;
}

function JobCreateInner({ job, forms }: { job?: JobFormValues; forms?: ApplicationFormOption[] }) {
  const [state, formAction] = useFormState(createJobAction, initial);
  const [slug, setSlug] = useState(job?.slug ?? "");
  const [title, setTitle] = useState(job?.title ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(job?.slug));
  const errors = (state.fieldErrors ?? {}) as Record<string, string[]>;

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(toSlug(value));
  }

  return (
    <form action={formAction} className="flex max-w-[920px] flex-col gap-6 border border-[var(--admin-border)] bg-[var(--admin-panel)] p-6">
      <Fields job={job} forms={forms} errors={errors} onTitleChange={onTitleChange} slug={slug} setSlug={setSlug} setSlugTouched={setSlugTouched} title={title} />

      {state.error ? (
        <div className="border border-red-400/25 bg-red-500/[0.08] px-4 py-3 text-[13px] text-red-200" role="alert">{state.error}</div>
      ) : null}

      <div className="flex items-center gap-4 pt-2">
        <CreateButton />
        <Link href="/admin/jobs" className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[var(--admin-muted)] hover:text-[var(--admin-text)]">Cancel</Link>
      </div>
    </form>
  );
}

// ─── Edit (auto-save) ─────────────────────────────────────────────────────────

function JobEditInner({ job, forms }: { job?: JobFormValues; forms?: ApplicationFormOption[] }) {
  const { formRef, status, errorMsg, onFormChange } = useAutoSave(updateJobAction, initial);
  const [slug, setSlug] = useState(job?.slug ?? "");
  const [title, setTitle] = useState(job?.title ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(job?.slug));

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(toSlug(value));
  }

  return (
    <form
      ref={formRef}
      onChange={onFormChange}
      onSubmit={(e) => e.preventDefault()}
      className="flex max-w-[920px] flex-col gap-6 border border-[var(--admin-border)] bg-[var(--admin-panel)] p-6"
    >
      {job?.id ? <input type="hidden" name="id" value={job.id} /> : null}
      <Fields job={job} forms={forms} onTitleChange={onTitleChange} slug={slug} setSlug={setSlug} setSlugTouched={setSlugTouched} title={title} />

      <div className="flex items-center justify-between gap-4 border-t border-[var(--admin-border-soft)] pt-4">
        <Link href="/admin/jobs" className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[var(--admin-muted)] hover:text-[var(--admin-text)]">← Back to roles</Link>
        <SaveStatus status={status} error={errorMsg} />
      </div>
    </form>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export default function JobForm({
  mode,
  job,
  forms = [],
}: {
  mode: "create" | "edit";
  job?: JobFormValues;
  forms?: ApplicationFormOption[];
}) {
  if (mode === "create") return <JobCreateInner job={job} forms={forms} />;
  return <JobEditInner job={job} forms={forms} />;
}
