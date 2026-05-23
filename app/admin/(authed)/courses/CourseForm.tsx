"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { createCourseAction, updateCourseAction, type CourseFormState } from "./actions";
import { FieldRow, Input, Select, Textarea } from "@/components/admin/ui/Field";
import { Button } from "@/components/admin/ui/Button";
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

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function toSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-[12.5px] leading-snug text-red-300">{messages[0]}</p>;
}

function SaveButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : mode === "create" ? "Create course" : "Save changes"}
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
  const [slugTouched, setSlugTouched] = useState(Boolean(course?.slug));
  const errors = state.fieldErrors ?? {};

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(toSlug(value));
  }

  return (
    <form action={formAction} encType="multipart/form-data" className="flex max-w-[760px] flex-col gap-6">
      {course?.id ? <input type="hidden" name="id" value={course.id} /> : null}
      {course?.image_url ? <input type="hidden" name="image_url" value={course.image_url} /> : null}

      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="Title">
          <Input
            name="title"
            required
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
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
            onChange={(event) => {
              setSlug(event.target.value);
              setSlugTouched(true);
            }}
            onBlur={(event) => setSlug(toSlug(event.target.value) || event.target.value.trim())}
            aria-invalid={Boolean(errors.slug)}
            placeholder="sales-ops-workshop-riyadh"
          />
          <FieldError messages={errors.slug} />
        </FieldRow>
      </div>

      <FieldRow label="Summary (1-2 sentences)">
        <Textarea
          name="summary"
          rows={2}
          defaultValue={course?.summary ?? ""}
          maxLength={280}
          aria-invalid={Boolean(errors.summary)}
        />
        <FieldError messages={errors.summary} />
      </FieldRow>

      <FieldRow label="Body (full description)">
        <Textarea
          name="body"
          rows={8}
          defaultValue={course?.body ?? ""}
          maxLength={12000}
          aria-invalid={Boolean(errors.body)}
        />
        <FieldError messages={errors.body} />
      </FieldRow>

      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="Location">
          <Input
            name="location"
            defaultValue={course?.location ?? ""}
            maxLength={180}
            aria-invalid={Boolean(errors.location)}
            placeholder="Riyadh, Saudi Arabia"
          />
          <FieldError messages={errors.location} />
        </FieldRow>

        <FieldRow label="Capacity">
          <Input
            name="capacity"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            defaultValue={course?.capacity ?? ""}
            aria-invalid={Boolean(errors.capacity)}
          />
          <FieldError messages={errors.capacity} />
        </FieldRow>

        <FieldRow label="Starts">
          <Input
            name="starts_at"
            type="datetime-local"
            defaultValue={toLocalDatetime(course?.starts_at)}
            aria-invalid={Boolean(errors.starts_at)}
          />
          <FieldError messages={errors.starts_at} />
        </FieldRow>

        <FieldRow label="Ends">
          <Input
            name="ends_at"
            type="datetime-local"
            defaultValue={toLocalDatetime(course?.ends_at)}
            aria-invalid={Boolean(errors.ends_at)}
          />
          <FieldError messages={errors.ends_at} />
        </FieldRow>

        <FieldRow label="Price">
          <Input
            name="price"
            type="number"
            step="0.01"
            min={0}
            inputMode="decimal"
            defaultValue={course?.price ?? ""}
            aria-invalid={Boolean(errors.price)}
          />
          <FieldError messages={errors.price} />
        </FieldRow>

        <FieldRow label="Currency">
          <Select
            name="currency"
            defaultValue={course?.currency ?? "SAR"}
            aria-invalid={Boolean(errors.currency)}
          >
            {courseCurrencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </Select>
          <FieldError messages={errors.currency} />
        </FieldRow>

        <FieldRow label="Active (visible on the public site)">
          <span className="inline-flex items-center gap-3 mt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={course?.is_active ?? false}
              className="h-4 w-4 accent-[#ff6a00]"
            />
            <span className="text-[13.5px] text-white/80">Publish</span>
          </span>
        </FieldRow>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-6">
        <FieldRow label="Cover image (PNG / JPG / WebP, < 5 MB)">
          <Input name="image_file" type="file" accept="image/png,image/jpeg,image/webp" />
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
        <div className="border border-red-400/25 bg-red-500/[0.08] px-4 py-3 text-[13px] text-red-200" role="alert">
          {state.error}
        </div>
      ) : null}

      <div className="flex items-center gap-4 pt-2">
        <SaveButton mode={mode} />
        <Link
          href="/admin/courses"
          className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-white/55 hover:text-white"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
