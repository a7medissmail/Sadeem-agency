"use client";

import { useState, useCallback } from "react";
import { useFormState } from "react-dom";
import { createServiceAction, updateServiceAction, type ServiceFormState } from "./actions";
import { Button } from "@/components/admin/ui/Button";
import { FieldRow, Input, Textarea, Select } from "@/components/admin/ui/Field";
import { SERVICE_CATEGORIES, CATEGORY_LABELS } from "@/lib/validation/service";

const ICON_OPTIONS = [
  "Strategy", "Growth", "Ops", "Transform", "Merge",
  "Target", "Chart", "Team", "Trend", "Scale",
  "Globe", "Users", "Trophy",
];

const initial: ServiceFormState = {};

type ServiceValues = {
  id?: string;
  slug?: string;
  title?: string;
  category?: string;
  tagline?: string | null;
  intro?: string | null;
  body?: string | null;
  deliverables?: string[];
  icon_key?: string | null;
  sort_order?: number;
  is_published?: boolean;
};

function toSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-[12.5px] leading-snug text-red-300 mt-1">{messages[0]}</p>;
}

function FieldHint({ text }: { text: string }) {
  return <p className="text-[11px] text-[var(--admin-muted)] mt-0.5">{text}</p>;
}

export default function ServiceForm({
  mode,
  service,
}: {
  mode: "create" | "edit";
  service?: ServiceValues;
}) {
  const [title, setTitle] = useState(service?.title ?? "");
  const [slug, setSlug] = useState(service?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [deliverables, setDeliverables] = useState<string[]>(service?.deliverables ?? [""]);

  const action =
    mode === "edit" && service?.id
      ? updateServiceAction.bind(null, service.id)
      : createServiceAction;

  const [state, formAction] = useFormState(action, initial);

  const handleTitleChange = useCallback(
    (v: string) => {
      setTitle(v);
      if (!slugTouched) setSlug(toSlug(v));
    },
    [slugTouched],
  );

  const addDeliverable = () => setDeliverables((d) => [...d, ""]);
  const removeDeliverable = (i: number) =>
    setDeliverables((d) => d.filter((_, idx) => idx !== i));
  const updateDeliverable = (i: number, v: string) =>
    setDeliverables((d) => d.map((item, idx) => (idx === i ? v : item)));

  return (
    <form action={formAction} className="admin-form">
      {state.message && (
        <p className="admin-form-error">{state.message}</p>
      )}

      {/* Title */}
      <FieldRow label="Title">
        <Input
          name="title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g. Market & Competitive Analysis"
          required
        />
        <FieldError messages={state.errors?.title} />
      </FieldRow>

      {/* Slug */}
      <FieldRow label="Slug">
        <Input
          name="slug"
          value={slug}
          onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
          placeholder="market-competitive-analysis"
          required
        />
        <FieldHint text="URL-safe identifier — auto-generated from title" />
        <FieldError messages={state.errors?.slug} />
      </FieldRow>

      {/* Category */}
      <FieldRow label="Category">
        <Select
          name="category"
          defaultValue={service?.category ?? ""}
          required
        >
          <option value="" disabled>Select category…</option>
          {SERVICE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </Select>
        <FieldError messages={state.errors?.category} />
      </FieldRow>

      {/* Tagline */}
      <FieldRow label="Tagline">
        <Input
          name="tagline"
          defaultValue={service?.tagline ?? ""}
          placeholder="e.g. See clearly before you move."
        />
        <FieldHint text="Short one-liner shown on cards and hero" />
      </FieldRow>

      {/* Icon */}
      <FieldRow label="Icon">
        <Select
          name="icon_key"
          defaultValue={service?.icon_key ?? ""}
        >
          <option value="">No icon</option>
          {ICON_OPTIONS.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </Select>
        <FieldHint text="Maps to existing Icon components" />
      </FieldRow>

      {/* Intro */}
      <FieldRow label="Intro">
        <Textarea
          name="intro"
          defaultValue={service?.intro ?? ""}
          rows={4}
          placeholder="What this service does and who it's for…"
        />
        <FieldHint text="1–2 paragraphs shown at the top of the service page" />
      </FieldRow>

      {/* Body */}
      <FieldRow label="Body">
        <Textarea
          name="body"
          defaultValue={service?.body ?? ""}
          rows={8}
          placeholder="Detailed description, context, how we work…"
        />
        <FieldHint text="Extended description (HTML supported)" />
      </FieldRow>

      {/* Deliverables */}
      <FieldRow label="Deliverables">
        <div className="flex flex-col gap-2">
          {deliverables.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                type="text"
                name="deliverables[]"
                value={item}
                onChange={(e) => updateDeliverable(i, e.target.value)}
                placeholder={`Deliverable ${i + 1}`}
                className="flex-1"
              />
              {deliverables.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDeliverable(i)}
                  className="text-[var(--admin-muted)] hover:text-red-400 text-lg leading-none px-1"
                  aria-label="Remove"
                >×</button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addDeliverable}
            className="self-start text-[12px] font-mono tracking-[0.15em] uppercase text-[var(--admin-accent)] hover:opacity-70 transition-opacity"
          >
            + Add deliverable
          </button>
        </div>
        <FieldHint text="Bullet points shown on the service page" />
      </FieldRow>

      {/* Sort order */}
      <FieldRow label="Sort order">
        <Input
          name="sort_order"
          type="number"
          min={0}
          max={999}
          defaultValue={service?.sort_order ?? 0}
        />
      </FieldRow>

      {/* Published */}
      <FieldRow label="Published">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="hidden"
            name="is_published"
            value="false"
          />
          <input
            type="checkbox"
            name="is_published"
            value="true"
            defaultChecked={service?.is_published ?? false}
            className="admin-checkbox"
            onChange={(e) => {
              const hidden = e.currentTarget.form?.querySelector<HTMLInputElement>(
                'input[name="is_published"][type="hidden"]'
              );
              if (hidden) hidden.disabled = e.currentTarget.checked;
            }}
          />
          <span className="text-sm text-[var(--admin-text)]">Visible on the public site</span>
        </label>
      </FieldRow>

      <div className="admin-form-actions">
        <Button type="submit" variant="primary">
          {mode === "create" ? "Create service" : "Save changes"}
        </Button>
        <a href="/admin/services" className="admin-form-cancel">Cancel</a>
      </div>
    </form>
  );
}
