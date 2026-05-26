"use client";

import { useState, type KeyboardEvent } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { createCourseAction, updateCourseAction, type CourseFormState } from "./actions";
import { FieldRow, Input, Select, Textarea } from "@/components/admin/ui/Field";
import { Button } from "@/components/admin/ui/Button";
import { SaveStatus } from "@/components/admin/ui/SaveStatus";
import { useAutoSave } from "@/components/admin/hooks/useAutoSave";
import { courseCurrencies, type CourseCurrency } from "@/lib/validation/course";

const initial: CourseFormState = {};

type CourseFormValues = {
  id?: string;
  title?: string;
  slug?: string;
  summary?: string | null;
  body?: string | null;
  location?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  capacity?: number | null;
  price?: number | null;
  currency?: CourseCurrency;
  image_url?: string | null;
  is_active?: boolean;
};

function toLocalDatetime(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

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
  course,
  errors = {},
  title,
  slug,
  onTitleChange,
  setSlug,
  setSlugTouched,
}: {
  course?: CourseFormValues;
  errors?: Record<string, string[]>;
  title: string;
  slug: string;
  onTitleChange: (v: string) => void;
  setSlug: (v: string) => void;
  setSlugTouched: (v: boolean) => void;
}) {
  return (
    <>
      {course?.image_url ? <input type="hidden" name="image_url" value={course.image_url} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <FieldRow label="Title">
          <Input
            name="title"
            required
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            aria-invalid={Boolean(errors.title)}
            placeholder="Sales Ops Workshop - Riyadh"
          />
          <FieldError messages={errors.title} />
        </FieldRow>

        <FieldRow label="Slug">
          <Input
            name="slug"
            required
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
            onBlur={(e) => setSlug(toSlug(e.target.value) || e.target.value.trim())}
            aria-invalid={Boolean(errors.slug)}
            placeholder="sales-ops-workshop-riyadh"
          />
          <FieldError messages={errors.slug} />
        </FieldRow>
      </div>

      <FieldRow label="Summary (1-2 sentences)">
        <Textarea name="summary" rows={2} defaultValue={course?.summary ?? ""} maxLength={280} aria-invalid={Boolean(errors.summary)} />
        <FieldError messages={errors.summary} />
      </FieldRow>

      <FieldRow label="Body HTML / inline CSS">
        <Textarea
          name="body"
          rows={14}
          defaultValue={course?.body ?? ""}
          maxLength={12000}
          aria-invalid={Boolean(errors.body)}
          spellCheck={false}
          onKeyDown={onCodeEditorKeyDown}
          className="min-h-[320px] font-mono text-[13px] leading-relaxed text-[var(--admin-text)] [tab-size:2]"
          placeholder={`<p>Describe the workshop.</p>`}
        />
        <p className="text-[12px] leading-relaxed text-[var(--admin-subtle)]">
          Public output is sanitized: scripts, event handlers, iframes, and unsafe URLs are removed.
        </p>
        <FieldError messages={errors.body} />
      </FieldRow>

      <div className="grid gap-4 md:grid-cols-2">
        <FieldRow label="Location">
          <Input name="location" defaultValue={course?.location ?? ""} maxLength={180} aria-invalid={Boolean(errors.location)} placeholder="Riyadh, Saudi Arabia" />
          <FieldError messages={errors.location} />
        </FieldRow>

        <FieldRow label="Capacity">
          <Input name="capacity" type="number" min={1} step={1} inputMode="numeric" defaultValue={course?.capacity ?? ""} aria-invalid={Boolean(errors.capacity)} />
          <FieldError messages={errors.capacity} />
        </FieldRow>

        <FieldRow label="Starts">
          <Input name="starts_at" type="datetime-local" defaultValue={toLocalDatetime(course?.starts_at)} aria-invalid={Boolean(errors.starts_at)} />
          <FieldError messages={errors.starts_at} />
        </FieldRow>

        <FieldRow label="Ends">
          <Input name="ends_at" type="datetime-local" defaultValue={toLocalDatetime(course?.ends_at)} aria-invalid={Boolean(errors.ends_at)} />
          <FieldError messages={errors.ends_at} />
        </FieldRow>

        <FieldRow label="Price">
          <Input name="price" type="number" step="0.01" min={0} inputMode="decimal" defaultValue={course?.price ?? ""} aria-invalid={Boolean(errors.price)} />
          <FieldError messages={errors.price} />
        </FieldRow>

        <FieldRow label="Currency">
          <Select name="currency" defaultValue={course?.currency ?? "SAR"} aria-invalid={Boolean(errors.currency)}>
            {courseCurrencies.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <FieldError messages={errors.currency} />
        </FieldRow>

        <FieldRow label="Active (visible on the public site)">
          <span className="inline-flex items-center gap-3 mt-1 cursor-pointer select-none">
            <input type="checkbox" name="is_active" defaultChecked={course?.is_active ?? false} className="h-4 w-4 accent-[var(--admin-accent)]" />
            <span className="text-[13.5px] text-[var(--admin-muted)]">Publish</span>
          </span>
        </FieldRow>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--admin-border-soft)] pt-6">
        <FieldRow label="Cover image (PNG / JPG / WebP, &lt; 5 MB)">
          <Input name="image_file" type="file" accept="image/png,image/jpeg,image/webp" />
        </FieldRow>

        {course?.image_url ? (
          <p className="text-[12.5px] text-[var(--admin-muted)]">
            Currently using{" "}
            <a href={course.image_url} target="_blank" rel="noreferrer" className="underline hover:text-[var(--admin-accent)]">
              {course.image_url.split("/").pop()}
            </a>
            . Upload a new file to replace.
          </p>
        ) : null}
      </div>
    </>
  );
}

// ─── Create (keeps submit button) ────────────────────────────────────────────

function CreateButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Create course"}</Button>;
}

function CourseCreateInner({ course }: { course?: CourseFormValues }) {
  const [state, formAction] = useFormState(createCourseAction, initial);
  const [slug, setSlug] = useState(course?.slug ?? "");
  const [title, setTitle] = useState(course?.title ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(course?.slug));
  const errors = (state.fieldErrors ?? {}) as Record<string, string[]>;

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(toSlug(value));
  }

  return (
    <form action={formAction} encType="multipart/form-data" className="flex max-w-[900px] flex-col gap-6 border border-[var(--admin-border)] bg-[var(--admin-panel)] p-6">
      <Fields course={course} errors={errors} title={title} slug={slug} onTitleChange={onTitleChange} setSlug={setSlug} setSlugTouched={setSlugTouched} />

      {state.error ? (
        <div className="border border-red-400/25 bg-red-500/[0.08] px-4 py-3 text-[13px] text-red-200" role="alert">{state.error}</div>
      ) : null}

      <div className="flex items-center gap-4 pt-2">
        <CreateButton />
        <Link href="/admin/courses" className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[var(--admin-muted)] hover:text-[var(--admin-text)]">Cancel</Link>
      </div>
    </form>
  );
}

// ─── Edit (auto-save) ─────────────────────────────────────────────────────────

function CourseEditInner({ course }: { course?: CourseFormValues }) {
  const { formRef, status, errorMsg, onFormChange } = useAutoSave(updateCourseAction, initial);
  const [slug, setSlug] = useState(course?.slug ?? "");
  const [title, setTitle] = useState(course?.title ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(course?.slug));

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(toSlug(value));
  }

  return (
    <form
      ref={formRef}
      onChange={onFormChange}
      onSubmit={(e) => e.preventDefault()}
      encType="multipart/form-data"
      className="flex max-w-[900px] flex-col gap-6 border border-[var(--admin-border)] bg-[var(--admin-panel)] p-6"
    >
      {course?.id ? <input type="hidden" name="id" value={course.id} /> : null}
      <Fields course={course} title={title} slug={slug} onTitleChange={onTitleChange} setSlug={setSlug} setSlugTouched={setSlugTouched} />

      <div className="flex items-center justify-between gap-4 border-t border-[var(--admin-border-soft)] pt-4">
        <Link href="/admin/courses" className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[var(--admin-muted)] hover:text-[var(--admin-text)]">← Back to courses</Link>
        <SaveStatus status={status} error={errorMsg} />
      </div>
    </form>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export default function CourseForm({ mode, course }: { mode: "create" | "edit"; course?: CourseFormValues }) {
  if (mode === "create") return <CourseCreateInner course={course} />;
  return <CourseEditInner course={course} />;
}
