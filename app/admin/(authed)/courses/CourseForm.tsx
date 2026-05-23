"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { createCourseAction, updateCourseAction, type CourseFormState } from "./actions";
import { FieldRow, Input, Textarea } from "@/components/admin/ui/Field";
import { Button } from "@/components/admin/ui/Button";

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
  image_url?: string | null;
  is_active?: boolean;
};

// Convert an ISO timestamp to the value <input type="datetime-local"> expects.
function toLocalDatetime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

function SaveButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : mode === "create" ? "Create course" : "Save changes"}
    </Button>
  );
}

export default function CourseForm({
  mode,
  course,
}: {
  mode: "create" | "edit";
  course?: CourseFormValues;
}) {
  const action = mode === "create" ? createCourseAction : updateCourseAction;
  const [state, formAction] = useFormState(action, initial);
  const [slug, setSlug] = useState(course?.slug ?? "");
  const [title, setTitle] = useState(course?.title ?? "");

  // Auto-derive slug from title until the user edits the slug manually.
  const [slugTouched, setSlugTouched] = useState(Boolean(course?.slug));
  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) {
      const auto = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
      setSlug(auto);
    }
  }

  return (
    <form action={formAction} encType="multipart/form-data" className="flex flex-col gap-6 max-w-[760px]">
      {course?.id ? <input type="hidden" name="id" value={course.id} /> : null}
      {course?.image_url ? <input type="hidden" name="image_url" value={course.image_url} /> : null}

      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="Title">
          <Input
            name="title"
            required
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Sales Ops Workshop — Riyadh"
          />
        </FieldRow>
        <FieldRow label="Slug">
          <Input
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            placeholder="sales-ops-workshop-riyadh"
          />
        </FieldRow>
      </div>

      <FieldRow label="Summary (1–2 sentences)">
        <Textarea name="summary" rows={2} defaultValue={course?.summary ?? ""} maxLength={280} />
      </FieldRow>

      <FieldRow label="Body (full description)">
        <Textarea name="body" rows={8} defaultValue={course?.body ?? ""} />
      </FieldRow>

      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="Location">
          <Input name="location" defaultValue={course?.location ?? ""} placeholder="Riyadh, Saudi Arabia" />
        </FieldRow>
        <FieldRow label="Capacity">
          <Input name="capacity" type="number" min={1} defaultValue={course?.capacity ?? ""} />
        </FieldRow>
        <FieldRow label="Starts">
          <Input name="starts_at" type="datetime-local" defaultValue={toLocalDatetime(course?.starts_at)} />
        </FieldRow>
        <FieldRow label="Ends">
          <Input name="ends_at" type="datetime-local" defaultValue={toLocalDatetime(course?.ends_at)} />
        </FieldRow>
        <FieldRow label="Price (SAR)">
          <Input name="price" type="number" step="0.01" min={0} defaultValue={course?.price ?? ""} />
        </FieldRow>
        <FieldRow label="Active (visible on the public site)">
          <label className="inline-flex items-center gap-3 mt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={course?.is_active ?? false}
              className="accent-[#ff6a00] w-4 h-4"
            />
            <span className="text-white/80 text-[13.5px]">Publish</span>
          </label>
        </FieldRow>
      </div>

      <div className="border-t border-white/10 pt-6 flex flex-col gap-3">
        <FieldRow label="Cover image (PNG / JPG / WebP, < 5 MB)">
          <Input name="image_file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
        </FieldRow>
        {course?.image_url ? (
          <p className="text-[12.5px] text-white/50">
            Currently using{" "}
            <a href={course.image_url} target="_blank" rel="noreferrer" className="underline hover:text-[#ff6a00]">
              {course.image_url.split("/").pop()}
            </a>
            . Upload a new file to replace.
          </p>
        ) : null}
      </div>

      {state.error ? (
        <p className="text-[13px] text-red-400" role="alert">{state.error}</p>
      ) : null}

      <div className="flex items-center gap-4 pt-2">
        <SaveButton mode={mode} />
        <Link href="/admin/courses" className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-white/55 hover:text-white">
          Cancel
        </Link>
      </div>
    </form>
  );
}
