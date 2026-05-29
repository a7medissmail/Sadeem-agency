"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import type { Json } from "@/types/database";
import { Button } from "@/components/admin/ui/Button";
import { SaveStatus } from "@/components/admin/ui/SaveStatus";
import { useAutoSave } from "@/components/admin/hooks/useAutoSave";
import { FieldRow, Input, Select, Textarea } from "@/components/admin/ui/Field";
import { createTeamMemberAction, updateTeamMemberAction, type TeamFormState } from "./actions";

const initial: TeamFormState = {};

type TeamMemberValues = {
  id?: string;
  name?: string;
  role?: string | null;
  credential?: string | null;
  category?: string | null;
  bio?: string | null;
  photo_url?: string | null;
  socials?: Json | null;
  sort_order?: number;
  is_active?: boolean;
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-[12.5px] leading-snug text-red-300">{messages[0]}</p>;
}

function socialValue(socials: Json | null | undefined, key: "website" | "linkedin" | "x" | "instagram") {
  if (!socials || typeof socials !== "object" || Array.isArray(socials)) return "";
  const value = (socials as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

function Fields({ member, errors = {} }: { member?: TeamMemberValues; errors?: Record<string, string[]> }) {
  return (
    <>
      {member?.photo_url ? <input type="hidden" name="photo_url" value={member.photo_url} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <FieldRow label="Name">
          <Input name="name" required defaultValue={member?.name ?? ""} maxLength={140} aria-invalid={Boolean(errors.name)} placeholder="Noura Alhazmi" />
          <FieldError messages={errors.name} />
        </FieldRow>

        <FieldRow label="Role">
          <Input name="role" defaultValue={member?.role ?? ""} maxLength={140} aria-invalid={Boolean(errors.role)} placeholder="Strategy lead" />
          <FieldError messages={errors.role} />
        </FieldRow>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FieldRow label="Section">
          <Select name="category" defaultValue={member?.category ?? "founder"} aria-invalid={Boolean(errors.category)}>
            <option value="founder">Founders</option>
            <option value="team">The wider team</option>
            <option value="advisor">Advisory Network</option>
          </Select>
          <FieldError messages={errors.category} />
        </FieldRow>

        <FieldRow label="Credential (optional)">
          <Input name="credential" defaultValue={member?.credential ?? ""} maxLength={200} aria-invalid={Boolean(errors.credential)} placeholder="Former CMO, Acme" />
          <FieldError messages={errors.credential} />
        </FieldRow>
      </div>

      <FieldRow label="Bio">
        <Textarea name="bio" rows={5} defaultValue={member?.bio ?? ""} maxLength={1400} aria-invalid={Boolean(errors.bio)} placeholder="Short public bio. Keep it concrete and human." />
        <FieldError messages={errors.bio} />
      </FieldRow>

      <div className="grid gap-4 md:grid-cols-2">
        <FieldRow label="Sort order">
          <Input name="sort_order" type="number" step={1} inputMode="numeric" defaultValue={member?.sort_order ?? 0} aria-invalid={Boolean(errors.sort_order)} />
          <FieldError messages={errors.sort_order} />
        </FieldRow>

        <FieldRow label="Active (visible on public site)">
          <span className="mt-1 inline-flex cursor-pointer select-none items-center gap-3">
            <input type="checkbox" name="is_active" defaultChecked={member?.is_active ?? true} className="h-4 w-4 accent-[var(--admin-accent)]" />
            <span className="text-[13.5px] text-[var(--admin-muted)]">Publish</span>
          </span>
        </FieldRow>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FieldRow label="Website">
          <Input name="website" type="url" defaultValue={socialValue(member?.socials, "website")} placeholder="https://example.com" />
          <FieldError messages={errors.website} />
        </FieldRow>
        <FieldRow label="LinkedIn">
          <Input name="linkedin" type="url" defaultValue={socialValue(member?.socials, "linkedin")} placeholder="https://linkedin.com/in/name" />
          <FieldError messages={errors.linkedin} />
        </FieldRow>
        <FieldRow label="X / Twitter">
          <Input name="x" type="url" defaultValue={socialValue(member?.socials, "x")} placeholder="https://x.com/name" />
          <FieldError messages={errors.x} />
        </FieldRow>
        <FieldRow label="Instagram">
          <Input name="instagram" type="url" defaultValue={socialValue(member?.socials, "instagram")} placeholder="https://instagram.com/name" />
          <FieldError messages={errors.instagram} />
        </FieldRow>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--admin-border-soft)] pt-6">
        <FieldRow label="Photo (PNG / JPG / WebP, &lt; 5 MB)">
          <Input name="photo_file" type="file" accept="image/png,image/jpeg,image/webp" />
        </FieldRow>

        {member?.photo_url ? (
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={member.photo_url} alt="" className="h-16 w-16 border border-[var(--admin-border)] object-cover" />
            <p className="text-[12.5px] text-[var(--admin-muted)]">
              Currently using{" "}
              <a href={member.photo_url} target="_blank" rel="noreferrer" className="underline hover:text-[var(--admin-accent)]">
                {member.photo_url.split("/").pop()}
              </a>
              . Upload a new file to replace.
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}

// ─── Create (keeps submit button) ────────────────────────────────────────────

function CreateButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Create member"}</Button>;
}

function TeamCreateInner({ member }: { member?: TeamMemberValues }) {
  const [state, formAction] = useFormState(createTeamMemberAction, initial);
  const errors = (state.fieldErrors ?? {}) as Record<string, string[]>;

  return (
    <form action={formAction} encType="multipart/form-data" className="flex max-w-[900px] flex-col gap-6 border border-[var(--admin-border)] bg-[var(--admin-panel)] p-6">
      <Fields member={member} errors={errors} />

      {state.error ? (
        <div className="border border-red-400/25 bg-red-500/[0.08] px-4 py-3 text-[13px] text-red-200" role="alert">{state.error}</div>
      ) : null}

      <div className="flex items-center gap-4 pt-2">
        <CreateButton />
        <Link href="/admin/team" className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[var(--admin-muted)] hover:text-[var(--admin-text)]">Cancel</Link>
      </div>
    </form>
  );
}

// ─── Edit (auto-save) ─────────────────────────────────────────────────────────

function TeamEditInner({ member }: { member?: TeamMemberValues }) {
  const { formRef, status, errorMsg, onFormChange } = useAutoSave(updateTeamMemberAction, initial);

  return (
    <form
      ref={formRef}
      onChange={onFormChange}
      onSubmit={(e) => e.preventDefault()}
      encType="multipart/form-data"
      className="flex max-w-[900px] flex-col gap-6 border border-[var(--admin-border)] bg-[var(--admin-panel)] p-6"
    >
      {member?.id ? <input type="hidden" name="id" value={member.id} /> : null}
      <Fields member={member} />

      <div className="flex items-center justify-between gap-4 border-t border-[var(--admin-border-soft)] pt-4">
        <Link href="/admin/team" className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[var(--admin-muted)] hover:text-[var(--admin-text)]">← Back to team</Link>
        <SaveStatus status={status} error={errorMsg} />
      </div>
    </form>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export default function TeamForm({ mode, member }: { mode: "create" | "edit"; member?: TeamMemberValues }) {
  if (mode === "create") return <TeamCreateInner member={member} />;
  return <TeamEditInner member={member} />;
}
