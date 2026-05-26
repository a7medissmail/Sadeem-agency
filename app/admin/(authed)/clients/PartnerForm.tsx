"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/admin/ui/Button";
import { FieldRow, Input, Select, Textarea } from "@/components/admin/ui/Field";
import {
  createClientPartnerAction,
  updateClientPartnerAction,
  type ClientPartnerFormState,
} from "@/lib/actions/clients";
import type { ClientPartnerRole } from "@/types/database";

const initial: ClientPartnerFormState = {};

type PartnerValues = {
  id?: string;
  name?: string;
  caption?: string | null;
  logo_url?: string;
  role?: ClientPartnerRole;
  sort_order?: number;
  is_active?: boolean;
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-[12.5px] leading-snug text-red-300">{messages[0]}</p>;
}

function SaveButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : mode === "create" ? "Create partner" : "Save changes"}
    </Button>
  );
}

export default function PartnerForm({
  mode,
  partner,
}: {
  mode: "create" | "edit";
  partner?: PartnerValues;
}) {
  const action = mode === "create" ? createClientPartnerAction : updateClientPartnerAction;
  const [state, formAction] = useFormState(action, initial);
  const errors = state.fieldErrors ?? {};

  const role: ClientPartnerRole = partner?.role ?? "grid";
  const isActive = partner?.is_active ?? true;
  const sortOrder = partner?.sort_order ?? 0;

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="flex max-w-[900px] flex-col gap-6 border border-[var(--admin-border)] bg-[var(--admin-panel)] p-6"
    >
      {partner?.id ? <input type="hidden" name="id" value={partner.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <FieldRow label="Name">
          <Input
            name="name"
            required
            defaultValue={partner?.name ?? ""}
            maxLength={140}
            aria-invalid={Boolean(errors.name)}
            placeholder="Vodafone"
          />
          <FieldError messages={errors.name} />
        </FieldRow>

        <FieldRow label="Role">
          <Select name="role" defaultValue={role}>
            <option value="grid">Grid (one of the 4×2)</option>
            <option value="anchor">Anchor (left-side hero)</option>
          </Select>
          <FieldError messages={errors.role} />
          <p className="mt-1 text-[12px] text-[var(--admin-muted)]">
            Marking active + anchor demotes the existing anchor automatically.
          </p>
        </FieldRow>
      </div>

      <FieldRow label="Caption (anchor only — shows under the name)">
        <Textarea
          name="caption"
          rows={2}
          defaultValue={partner?.caption ?? ""}
          maxLength={280}
          aria-invalid={Boolean(errors.caption)}
          placeholder="Telecom · enterprise growth · multi-year retainer"
        />
        <FieldError messages={errors.caption} />
      </FieldRow>

      <div className="grid gap-4 md:grid-cols-2">
        <FieldRow label="Upload logo">
          <Input
            name="logo_file"
            type="file"
            accept="image/svg+xml,image/png,image/jpeg,image/webp"
          />
          <p className="mt-1 text-[12px] text-[var(--admin-muted)]">
            Transparent PNG preferred. Under 2 MB. Overrides the URL field.
          </p>
        </FieldRow>

        <FieldRow label="Logo URL (if not uploading)">
          <Input
            name="logo_url"
            type="url"
            defaultValue={partner?.logo_url ?? ""}
            placeholder="/partners/vodafone.png or https://..."
            aria-invalid={Boolean(errors.logo_url)}
          />
          <FieldError messages={errors.logo_url} />
          <p className="mt-1 text-[12px] text-[var(--admin-muted)]">
            Leave blank when uploading a file above.
          </p>
        </FieldRow>
      </div>

      {partner?.logo_url ? (
        <div className="flex items-center gap-4 border border-[var(--admin-border-soft)] bg-[var(--admin-surface-strong)] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">Current</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={partner.logo_url}
            alt={partner.name ?? "Partner"}
            className="h-12 w-auto max-w-[160px] object-contain"
          />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <FieldRow label="Sort order">
          <Input
            name="sort_order"
            type="number"
            defaultValue={sortOrder}
            aria-invalid={Boolean(errors.sort_order)}
            placeholder="0"
          />
          <FieldError messages={errors.sort_order} />
        </FieldRow>

        <FieldRow label="Visibility">
          <label className="flex items-center gap-2 text-[14px]">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={isActive}
              className="h-4 w-4 accent-[var(--admin-accent)]"
            />
            <span>Show on the public site</span>
          </label>
          <FieldError messages={errors.is_active} />
        </FieldRow>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--admin-border-soft)] pt-4">
        {state.error ? (
          <div className="flex-1 border border-red-400/25 bg-red-500/[0.08] px-3 py-2 text-[13px] text-red-200">
            {state.error}
          </div>
        ) : (
          <Link href="/admin/clients" className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--admin-muted)] hover:text-[var(--admin-accent)]">
            ← Back to clients
          </Link>
        )}
        <SaveButton mode={mode} />
      </div>
    </form>
  );
}
