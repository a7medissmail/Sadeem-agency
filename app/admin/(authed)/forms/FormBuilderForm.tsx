"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/admin/ui/Button";
import { FieldRow, Input, Select, Textarea } from "@/components/admin/ui/Field";
import {
  formFieldTypes,
  formPurposes,
  optionFieldTypes,
  optionsToText,
  slugifyForm,
} from "@/lib/validation/formBuilder";
import type { Database, FormFieldType, FormPurpose, Json } from "@/types/database";
import {
  addFieldAction,
  createFormAction,
  deleteFieldAction,
  reorderFieldsAction,
  updateFieldAction,
  updateFormAction,
  type FormBuilderState,
  type FormFieldState,
} from "./actions";

type FormRow = Database["public"]["Tables"]["forms"]["Row"];
type FieldRowType = Database["public"]["Tables"]["form_fields"]["Row"];

const initialFormState: FormBuilderState = {};
const initialFieldState: FormFieldState = {};

const fieldTypeLabels: Record<FormFieldType, string> = {
  text: "Text",
  textarea: "Long text",
  email: "Email",
  phone: "Phone",
  url: "URL",
  select: "Select",
  multiselect: "Multi-select",
  checkbox: "Checkbox",
  file: "File",
  date: "Date",
};

const purposeLabels: Record<FormPurpose, string> = {
  lead: "Lead",
  application: "Application",
  consultation: "Consultation",
  proposal: "Proposal / brief",
  generic: "Generic",
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-[12.5px] leading-snug text-red-300">{messages[0]}</p>;
}

function SaveButton({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : children}
    </Button>
  );
}

function FieldPreview({ field }: { field: FieldRowType }) {
  const options = Array.isArray(field.options) ? field.options : [];
  return (
    <div className="border border-[var(--admin-border)] bg-[var(--admin-surface-strong)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-semibold text-[var(--admin-text)]">
            {field.label}
            {field.is_required ? <span className="text-[var(--admin-accent)]"> *</span> : null}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--admin-subtle)]">
            {field.field_key} / {fieldTypeLabels[field.type]}
          </p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-accent)]">
          {String(field.sort_order).padStart(2, "0")}
        </span>
      </div>
      {field.help_text ? <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--admin-muted)]">{field.help_text}</p> : null}
      {options.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {options.map((option: Json, index) => {
            const label = option && typeof option === "object" && !Array.isArray(option) && "label" in option ? String(option.label ?? "") : "";
            return label ? (
              <span key={`${label}-${index}`} className="border border-[var(--admin-border)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
                {label}
              </span>
            ) : null;
          })}
        </div>
      ) : null}
    </div>
  );
}

function FieldEditor({ field }: { field: FieldRowType }) {
  const [state, formAction] = useFormState(updateFieldAction, initialFieldState);
  const [type, setType] = useState<FormFieldType>(field.type);
  const errors = state.fieldErrors ?? {};

  return (
    <details className="group border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <FieldPreview field={field} />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--admin-subtle)] group-open:text-[var(--admin-accent)]">
          Edit
        </span>
      </summary>

      <div className="mt-5 border-t border-[var(--admin-border-soft)] pt-5">
        <form action={formAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" value={field.id} />
          <input type="hidden" name="form_id" value={field.form_id} />

          <FieldRow label="Label">
            <Input name="label" defaultValue={field.label} aria-invalid={Boolean(errors.label)} required />
            <FieldError messages={errors.label} />
          </FieldRow>

          <FieldRow label="Field key">
            <Input name="field_key" defaultValue={field.field_key} aria-invalid={Boolean(errors.field_key)} required />
            <FieldError messages={errors.field_key} />
          </FieldRow>

          <FieldRow label="Type">
            <Select name="type" value={type} onChange={(event) => setType(event.target.value as FormFieldType)}>
              {formFieldTypes.map((fieldType) => (
                <option key={fieldType} value={fieldType}>
                  {fieldTypeLabels[fieldType]}
                </option>
              ))}
            </Select>
            <FieldError messages={errors.type} />
          </FieldRow>

          <FieldRow label="Placeholder">
            <Input name="placeholder" defaultValue={field.placeholder ?? ""} />
            <FieldError messages={errors.placeholder} />
          </FieldRow>

          <FieldRow label="Help text">
            <Input name="help_text" defaultValue={field.help_text ?? ""} />
            <FieldError messages={errors.help_text} />
          </FieldRow>

          {optionFieldTypes.includes(type) ? (
            <FieldRow label="Options">
              <Textarea name="options_text" defaultValue={optionsToText(field.options)} placeholder={"Option one\nOption two"} />
              <FieldError messages={errors.options_text} />
            </FieldRow>
          ) : (
            <input type="hidden" name="options_text" value="" />
          )}

          <label className="flex items-center gap-3 self-end py-2 text-[13px] text-[var(--admin-muted)]">
            <input name="is_required" type="checkbox" defaultChecked={field.is_required} className="h-4 w-4 accent-[var(--admin-accent)]" />
            Required
          </label>

          {state.error ? <p className="md:col-span-2 text-[12.5px] text-red-300">{state.error}</p> : null}

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <SaveButton>Save field</SaveButton>
          </div>
        </form>
        <form
          action={deleteFieldAction}
          className="mt-3"
          onSubmit={(e) => {
            if (!window.confirm(`Delete field "${field.label}"? This cannot be undone.`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={field.id} />
          <input type="hidden" name="form_id" value={field.form_id} />
          <Button type="submit" variant="danger" size="sm">
            Delete field
          </Button>
        </form>
      </div>
    </details>
  );
}

function SortableFieldEditor({ field }: { field: FieldRowType }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        position: "relative",
        zIndex: isDragging ? 1 : "auto",
      }}
      className="flex items-stretch"
    >
      <button
        type="button"
        className="form-drag-handle"
        title="Drag to reorder"
        aria-label="Drag to reorder field"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <div className="min-w-0 flex-1">
        <FieldEditor field={field} />
      </div>
    </div>
  );
}

function AddFieldForm({ formId, nextSort }: { formId: string; nextSort: number }) {
  const [state, formAction] = useFormState(addFieldAction, initialFieldState);
  const [label, setLabel] = useState("");
  const [fieldKey, setFieldKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);
  const [type, setType] = useState<FormFieldType>("text");
  const errors = state.fieldErrors ?? {};

  function onLabelChange(value: string) {
    setLabel(value);
    if (!keyTouched) setFieldKey(slugifyForm(value).replace(/-/g, "_"));
  }

  return (
    <form action={formAction} className="grid gap-4 border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5 md:grid-cols-2">
      <input type="hidden" name="form_id" value={formId} />
      <FieldRow label="Label">
        <Input name="label" value={label} onChange={(event) => onLabelChange(event.target.value)} aria-invalid={Boolean(errors.label)} required />
        <FieldError messages={errors.label} />
      </FieldRow>

      <FieldRow label="Field key">
        <Input
          name="field_key"
          value={fieldKey}
          onChange={(event) => {
            setKeyTouched(true);
            setFieldKey(event.target.value);
          }}
          aria-invalid={Boolean(errors.field_key)}
          required
        />
        <FieldError messages={errors.field_key} />
      </FieldRow>

      <FieldRow label="Type">
        <Select name="type" value={type} onChange={(event) => setType(event.target.value as FormFieldType)}>
          {formFieldTypes.map((fieldType) => (
            <option key={fieldType} value={fieldType}>
              {fieldTypeLabels[fieldType]}
            </option>
          ))}
        </Select>
        <FieldError messages={errors.type} />
      </FieldRow>

      <FieldRow label="Sort order">
        <Input name="sort_order" type="number" defaultValue={nextSort} />
        <FieldError messages={errors.sort_order} />
      </FieldRow>

      <FieldRow label="Placeholder">
        <Input name="placeholder" />
        <FieldError messages={errors.placeholder} />
      </FieldRow>

      <FieldRow label="Help text">
        <Input name="help_text" />
        <FieldError messages={errors.help_text} />
      </FieldRow>

      {optionFieldTypes.includes(type) ? (
        <FieldRow label="Options">
          <Textarea name="options_text" placeholder={"Option one\nOption two"} />
          <FieldError messages={errors.options_text} />
        </FieldRow>
      ) : (
        <input type="hidden" name="options_text" value="" />
      )}

      <label className="flex items-center gap-3 self-end py-2 text-[13px] text-[var(--admin-muted)]">
        <input name="is_required" type="checkbox" className="h-4 w-4 accent-[var(--admin-accent)]" />
        Required
      </label>

      {state.error ? <p className="md:col-span-2 text-[12.5px] text-red-300">{state.error}</p> : null}

      <div className="md:col-span-2">
        <SaveButton>Add field</SaveButton>
      </div>
    </form>
  );
}

export function FormDefinitionForm({ mode, form }: { mode: "create" | "edit"; form?: FormRow }) {
  const action = mode === "create" ? createFormAction : updateFormAction;
  const [state, formAction] = useFormState(action, initialFormState);
  const [name, setName] = useState(form?.name ?? "");
  const [slug, setSlug] = useState(form?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(form?.slug));
  const errors = state.fieldErrors ?? {};

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugifyForm(value));
  }

  return (
    <form action={formAction} className="grid gap-4 border border-[var(--admin-border)] bg-[var(--admin-panel)] p-6 md:grid-cols-2">
      {form?.id ? <input type="hidden" name="id" value={form.id} /> : null}

      <FieldRow label="Name">
        <Input name="name" value={name} onChange={(event) => onNameChange(event.target.value)} aria-invalid={Boolean(errors.name)} required />
        <FieldError messages={errors.name} />
      </FieldRow>

      <FieldRow label="Slug">
        <Input
          name="slug"
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(slugifyForm(event.target.value));
          }}
          aria-invalid={Boolean(errors.slug)}
          required
        />
        <FieldError messages={errors.slug} />
      </FieldRow>

      <FieldRow label="Purpose">
        <Select name="purpose" defaultValue={form?.purpose ?? "generic"} aria-invalid={Boolean(errors.purpose)}>
          {formPurposes.map((purpose) => (
            <option key={purpose} value={purpose}>
              {purposeLabels[purpose]}
            </option>
          ))}
        </Select>
        <FieldError messages={errors.purpose} />
      </FieldRow>

      <FieldRow label="Submit label">
        <Input name="submit_label" defaultValue={form?.submit_label ?? "Submit"} aria-invalid={Boolean(errors.submit_label)} required />
        <FieldError messages={errors.submit_label} />
      </FieldRow>

      <FieldRow label="Description">
        <Textarea name="description" defaultValue={form?.description ?? ""} aria-invalid={Boolean(errors.description)} />
        <FieldError messages={errors.description} />
      </FieldRow>

      <FieldRow label="Success message">
        <Textarea name="success_message" defaultValue={form?.success_message ?? ""} aria-invalid={Boolean(errors.success_message)} />
        <FieldError messages={errors.success_message} />
      </FieldRow>

      <label className="flex items-center gap-3 py-2 text-[13px] text-[var(--admin-muted)]">
        <input name="is_active" type="checkbox" defaultChecked={form?.is_active ?? false} className="h-4 w-4 accent-[var(--admin-accent)]" />
        Active and available to public renderers
      </label>

      {state.error ? <p className="md:col-span-2 text-[12.5px] text-red-300">{state.error}</p> : null}

      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <SaveButton>{mode === "create" ? "Create form" : "Save form"}</SaveButton>
        {form?.id ? (
          <Link href={`/admin/forms/${form.id}/preview`} className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-accent)] hover:text-[var(--admin-text)]">
            Preview
          </Link>
        ) : null}
        {form?.is_active ? (
          <Link href={`/forms/${form.slug}`} target="_blank" className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-accent)] hover:text-[var(--admin-text)]">
            Open live
          </Link>
        ) : null}
        <Link href="/admin/forms" className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-muted)] hover:text-[var(--admin-text)]">
          Back to forms
        </Link>
      </div>
    </form>
  );
}

export function FormBuilderEditor({ form, fields: initialFields }: { form: FormRow; fields: FieldRowType[] }) {
  const [fields, setFields] = useState(initialFields);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.id === String(active.id));
    const newIndex = fields.findIndex((f) => f.id === String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const newFields = arrayMove(fields, oldIndex, newIndex);
    setFields(newFields); // optimistic

    const updates = newFields.map((f, i) => ({ id: f.id, sort_order: i * 10 }));
    startTransition(async () => {
      try {
        await reorderFieldsAction(form.id, updates);
      } catch {
        setFields(fields); // revert on error
      }
    });
  }

  const nextSort = fields.length ? Math.max(...fields.map((f) => f.sort_order)) + 10 : 10;

  return (
    <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="space-y-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--admin-accent)]">Definition</p>
          <h2 className="mt-2 text-[28px] font-semibold tracking-tight text-[var(--admin-text)]">Form shell</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/admin/forms/${form.id}/preview`} className="border border-[var(--admin-border)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-muted)] hover:border-[var(--admin-accent)] hover:text-[var(--admin-text)]">
              Preview
            </Link>
            {form.is_active ? (
              <Link href={`/forms/${form.slug}`} target="_blank" className="border border-[var(--admin-accent)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-accent)] hover:bg-[var(--admin-accent-soft)]">
                Open live
              </Link>
            ) : null}
          </div>
        </div>
        <FormDefinitionForm mode="edit" form={form} />
      </section>

      <section className="space-y-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--admin-accent)]">Fields</p>
          <h2 className="mt-2 text-[28px] font-semibold tracking-tight text-[var(--admin-text)]">Builder</h2>
          <p className="mt-2 max-w-[60ch] text-[13px] leading-relaxed text-[var(--admin-muted)]">
            Use controlled field types only. This keeps client-facing forms safe and lets us map answers into hiring, CRM, and proposal workflows later.
          </p>
        </div>
        <AddFieldForm formId={form.id} nextSort={nextSort} />
        <div className="space-y-3">
          {fields.length === 0 ? (
            <div className="border border-dashed border-[var(--admin-border)] bg-[var(--admin-panel)] px-5 py-10 text-center text-[13px] text-[var(--admin-subtle)]">
              No fields yet. Add the first controlled input.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {fields.map((field) => (
                  <SortableFieldEditor key={field.id} field={field} />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </section>
    </div>
  );
}
