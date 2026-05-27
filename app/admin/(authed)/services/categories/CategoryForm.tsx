"use client";

import { useState, useCallback } from "react";
import { useFormState } from "react-dom";
import { createCategoryAction, updateCategoryAction, type CategoryFormState } from "./actions";
import { Button } from "@/components/admin/ui/Button";
import { FieldRow, Input, Textarea } from "@/components/admin/ui/Field";

const initial: CategoryFormState = {};

type CategoryValues = {
  id?: string;
  slug?: string;
  label?: string;
  tagline?: string | null;
  description?: string | null;
  sort_order?: number;
};

function toSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-[12.5px] leading-snug text-red-300 mt-1">{messages[0]}</p>;
}

function FieldHint({ text }: { text: string }) {
  return <p className="text-[11px] text-[var(--admin-muted)] mt-0.5">{text}</p>;
}

export default function CategoryForm({
  mode,
  category,
}: {
  mode: "create" | "edit";
  category?: CategoryValues;
}) {
  const [label, setLabel] = useState(category?.label ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  const action =
    mode === "edit" && category?.id
      ? updateCategoryAction.bind(null, category.id)
      : createCategoryAction;

  const [state, formAction] = useFormState(action, initial);

  const handleLabelChange = useCallback(
    (v: string) => {
      setLabel(v);
      if (!slugTouched) setSlug(toSlug(v));
    },
    [slugTouched],
  );

  return (
    <form action={formAction} className="admin-form">
      {state.message && (
        <p className="admin-form-error">{state.message}</p>
      )}

      {/* Label */}
      <FieldRow label="Label">
        <Input
          name="label"
          value={label}
          onChange={(e) => handleLabelChange(e.target.value)}
          placeholder="e.g. Strategy"
          required
        />
        <FieldHint text="Display name shown on the website and in admin" />
        <FieldError messages={state.errors?.label} />
      </FieldRow>

      {/* Slug */}
      <FieldRow label="Slug">
        <Input
          name="slug"
          value={slug}
          onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
          placeholder="strategy"
          required
        />
        <FieldHint text="URL-safe identifier — auto-generated from label. Must match the category value on services." />
        <FieldError messages={state.errors?.slug} />
      </FieldRow>

      {/* Tagline */}
      <FieldRow label="Tagline">
        <Input
          name="tagline"
          defaultValue={category?.tagline ?? ""}
          placeholder="e.g. Clarity before action"
        />
        <FieldHint text="Short one-liner shown as the category subtitle" />
      </FieldRow>

      {/* Description */}
      <FieldRow label="Description">
        <Textarea
          name="description"
          defaultValue={category?.description ?? ""}
          rows={5}
          placeholder="What this category of services covers and who it&apos;s for…"
        />
        <FieldHint text="Shown on the public services page under the category heading" />
      </FieldRow>

      {/* Sort order */}
      <FieldRow label="Sort order">
        <Input
          name="sort_order"
          type="number"
          min={0}
          max={999}
          defaultValue={category?.sort_order ?? 0}
        />
        <FieldHint text="Categories are displayed in ascending order (0 first)" />
      </FieldRow>

      <div className="admin-form-actions">
        <Button type="submit" variant="primary">
          {mode === "create" ? "Create category" : "Save changes"}
        </Button>
        <a href="/admin/services/categories" className="admin-form-cancel">Cancel</a>
      </div>
    </form>
  );
}
