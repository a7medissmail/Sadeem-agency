"use client";

import { useState, type KeyboardEvent } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import {
  createSuccessStoryAction,
  updateSuccessStoryAction,
  type SuccessStoryFormState,
} from "./actions";
import { Button } from "@/components/admin/ui/Button";
import { FieldRow, Input, Textarea } from "@/components/admin/ui/Field";

const initial: SuccessStoryFormState = {};

type StoryValues = {
  id?: string;
  title?: string;
  slug?: string;
  client_name?: string | null;
  industry?: string | null;
  summary?: string | null;
  challenge?: string | null;
  solution?: string | null;
  results?: string | null;
  body?: string | null;
  image_url?: string | null;
  metric_value?: string | null;
  metric_label?: string | null;
  sort_order?: number;
  is_published?: boolean;
};

function toSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-[12.5px] leading-snug text-red-300">{messages[0]}</p>;
}

function SaveButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : mode === "create" ? "Create story" : "Save changes"}
    </Button>
  );
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

export default function StoryForm({ mode, story }: { mode: "create" | "edit"; story?: StoryValues }) {
  const action = mode === "create" ? createSuccessStoryAction : updateSuccessStoryAction;
  const [state, formAction] = useFormState(action, initial);
  const [title, setTitle] = useState(story?.title ?? "");
  const [slug, setSlug] = useState(story?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(story?.slug));
  const errors = state.fieldErrors ?? {};

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(toSlug(value));
  }

  return (
    <form action={formAction} encType="multipart/form-data" className="flex max-w-[980px] flex-col gap-6 border border-[var(--admin-border)] bg-[var(--admin-panel)] p-6">
      {story?.id ? <input type="hidden" name="id" value={story.id} /> : null}
      {story?.image_url ? <input type="hidden" name="image_url" value={story.image_url} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <FieldRow label="Title">
          <Input
            name="title"
            required
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            aria-invalid={Boolean(errors.title)}
            placeholder="From scattered demand to predictable growth"
          />
          <FieldError messages={errors.title} />
        </FieldRow>

        <FieldRow label="Slug">
          <Input
            name="slug"
            required
            value={slug}
            onChange={(event) => {
              setSlug(event.target.value);
              setSlugTouched(true);
            }}
            onBlur={(event) => setSlug(toSlug(event.target.value) || event.target.value.trim())}
            aria-invalid={Boolean(errors.slug)}
            placeholder="predictable-growth-system"
          />
          <FieldError messages={errors.slug} />
        </FieldRow>

        <FieldRow label="Client name">
          <Input
            name="client_name"
            defaultValue={story?.client_name ?? ""}
            maxLength={140}
            aria-invalid={Boolean(errors.client_name)}
            placeholder="Confidential operator"
          />
          <FieldError messages={errors.client_name} />
        </FieldRow>

        <FieldRow label="Industry">
          <Input
            name="industry"
            defaultValue={story?.industry ?? ""}
            maxLength={100}
            aria-invalid={Boolean(errors.industry)}
            placeholder="Retail / Technology / Manufacturing"
          />
          <FieldError messages={errors.industry} />
        </FieldRow>

        <FieldRow label="Metric value">
          <Input
            name="metric_value"
            defaultValue={story?.metric_value ?? ""}
            maxLength={40}
            aria-invalid={Boolean(errors.metric_value)}
            placeholder="+28%"
          />
          <FieldError messages={errors.metric_value} />
        </FieldRow>

        <FieldRow label="Metric label">
          <Input
            name="metric_label"
            defaultValue={story?.metric_label ?? ""}
            maxLength={100}
            aria-invalid={Boolean(errors.metric_label)}
            placeholder="profitability lift"
          />
          <FieldError messages={errors.metric_label} />
        </FieldRow>
      </div>

      <FieldRow label="Summary">
        <Textarea
          name="summary"
          rows={3}
          defaultValue={story?.summary ?? ""}
          maxLength={320}
          aria-invalid={Boolean(errors.summary)}
          placeholder="Short homepage/card summary. Keep it measurable and concrete."
        />
        <FieldError messages={errors.summary} />
      </FieldRow>

      <div className="grid gap-4 lg:grid-cols-3">
        <FieldRow label="Challenge">
          <Textarea name="challenge" rows={7} defaultValue={story?.challenge ?? ""} maxLength={900} />
          <FieldError messages={errors.challenge} />
        </FieldRow>
        <FieldRow label="Solution">
          <Textarea name="solution" rows={7} defaultValue={story?.solution ?? ""} maxLength={900} />
          <FieldError messages={errors.solution} />
        </FieldRow>
        <FieldRow label="Results">
          <Textarea name="results" rows={7} defaultValue={story?.results ?? ""} maxLength={900} />
          <FieldError messages={errors.results} />
        </FieldRow>
      </div>

      <FieldRow label="Body HTML / inline CSS">
        <Textarea
          name="body"
          rows={14}
          defaultValue={story?.body ?? ""}
          maxLength={14000}
          aria-invalid={Boolean(errors.body)}
          spellCheck={false}
          onKeyDown={onCodeEditorKeyDown}
          className="min-h-[320px] font-mono text-[13px] leading-relaxed text-[var(--admin-text)] [tab-size:2]"
          placeholder={`<p>Write the full case narrative.</p>\n<h3>Operating moves</h3>\n<ul><li>What changed</li><li>What became measurable</li></ul>`}
        />
        <p className="text-[12px] leading-relaxed text-[var(--admin-subtle)]">
          Public output is sanitized. Use safe HTML and small inline style attributes only.
        </p>
        <FieldError messages={errors.body} />
      </FieldRow>

      <div className="grid gap-4 border-t border-[var(--admin-border-soft)] pt-6 md:grid-cols-2">
        <FieldRow label="Sort order">
          <Input
            name="sort_order"
            type="number"
            step={1}
            defaultValue={story?.sort_order ?? 0}
            aria-invalid={Boolean(errors.sort_order)}
          />
          <FieldError messages={errors.sort_order} />
        </FieldRow>

        <FieldRow label="Published">
          <span className="mt-1 inline-flex cursor-pointer select-none items-center gap-3">
            <input
              type="checkbox"
              name="is_published"
              defaultChecked={story?.is_published ?? false}
              className="h-4 w-4 accent-[var(--admin-accent)]"
            />
            <span className="text-[13.5px] text-[var(--admin-muted)]">Show on public site</span>
          </span>
        </FieldRow>

        <FieldRow label="Cover image (PNG / JPG / WebP, < 5 MB)">
          <Input name="image_file" type="file" accept="image/png,image/jpeg,image/webp" />
        </FieldRow>

        {story?.image_url ? (
          <p className="self-end text-[12.5px] text-[var(--admin-muted)]">
            Currently using{" "}
            <a href={story.image_url} target="_blank" rel="noreferrer" className="underline hover:text-[var(--admin-accent)]">
              {story.image_url.split("/").pop()}
            </a>
            . Upload a new file to replace.
          </p>
        ) : null}
      </div>

      {state.error ? (
        <div className="border border-red-400/25 bg-red-500/[0.08] px-4 py-3 text-[13px] text-red-200" role="alert">
          {state.error}
        </div>
      ) : null}

      <div className="flex items-center gap-4 pt-2">
        <SaveButton mode={mode} />
        <Link
          href="/admin/success-stories"
          className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
