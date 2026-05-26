"use client";

import { FieldRow, Input, Textarea } from "@/components/admin/ui/Field";
import { SaveStatus } from "@/components/admin/ui/SaveStatus";
import { useAutoSave } from "@/components/admin/hooks/useAutoSave";
import type { Database } from "@/types/database";
import { updateClientSectionAction, type ClientSectionFormState } from "@/lib/actions/clients";

type SectionRow = Database["public"]["Tables"]["client_section"]["Row"];

const initial: ClientSectionFormState = {};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-[12.5px] leading-snug text-red-300">{messages[0]}</p>;
}

export default function ClientSectionForm({ section }: { section: SectionRow }) {
  const { formRef, status, errorMsg, onFormChange } = useAutoSave(
    updateClientSectionAction,
    initial,
  );

  return (
    <form
      ref={formRef}
      onChange={onFormChange}
      onSubmit={(e) => e.preventDefault()}
      className="grid gap-6 border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5 xl:grid-cols-2"
    >
      <FieldRow label="Eyebrow (top-left mono label)">
        <Input name="eyebrow" defaultValue={section.eyebrow} />
      </FieldRow>

      <FieldRow label="Foot caption (below the grid)">
        <Textarea name="foot" rows={2} defaultValue={section.foot} />
      </FieldRow>

      <FieldRow label="Meta — accent (orange, left)">
        <Input name="meta_accent" defaultValue={section.meta_accent} />
      </FieldRow>

      <FieldRow label="Meta — value (date range)">
        <Input name="meta_value" defaultValue={section.meta_value} />
      </FieldRow>

      <FieldRow label="NDA tile — count (number, no plus sign)">
        <Input name="nda_count" type="number" min={0} max={9999} defaultValue={section.nda_count} />
      </FieldRow>

      <FieldRow label="NDA tile — label (line break = new line)">
        <Textarea name="nda_label" rows={2} defaultValue={section.nda_label} />
      </FieldRow>

      <div className="xl:col-span-2 flex items-center justify-between gap-3 border-t border-[var(--admin-border-soft)] pt-4">
        {status === "error" ? (
          <div className="flex-1 border border-red-400/25 bg-red-500/[0.08] px-3 py-2 text-[13px] text-red-200">
            {errorMsg}
          </div>
        ) : (
          <p className="text-[12.5px] text-[var(--admin-muted)]">
            Changes save automatically as you type.
          </p>
        )}
        <SaveStatus status={status} error={errorMsg} />
      </div>
    </form>
  );
}
