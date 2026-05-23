"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import type { Json } from "@/types/database";
import { Button } from "@/components/admin/ui/Button";
import { FieldRow, Input, Textarea } from "@/components/admin/ui/Field";
import { createTeamMemberAction, updateTeamMemberAction, type TeamFormState } from "./actions";

const initial: TeamFormState = {};

type TeamMemberValues = {
  id?: string;
  name?: string;
  role?: string | null;
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

function SaveButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : mode === "create" ? "Create member" : "Save changes"}
    </Button>
  );
}

function socialValue(socials: Json | null | undefined, key: "website" | "linkedin" | "x" | "instagram") {
  if (!socials || typeof socials !== "object" || Array.isArray(socials)) return "";
  const value = socials[key];
  return typeof value === "string" ? value : "";
}

export default function TeamForm({
  mode,
  member,
}: {
  mode: "create" | "edit";
  member?: TeamMemberValues;
}) {
  const action = mode === "create" ? createTeamMemberAction : updateTeamMemberAction;
  const [state, formAction] = useFormState(action, initial);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} encType="multipart/form-data" className="flex max-w-[760px] flex-col gap-6">
      {member?.id ? <input type="hidden" name="id" value={member.id} /> : null}
      {member?.photo_url ? <input type="hidden" name="photo_url" value={member.photo_url} /> : null}

      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="Name">
          <Input
            name="name"
            required
            defaultValue={member?.name ?? ""}
            maxLength={140}
            aria-invalid={Boolean(errors.name)}
            placeholder="Noura Alhazmi"
          />
          <FieldError messages={errors.name} />
        </FieldRow>

        <FieldRow label="Role">
          <Input
            name="role"
            defaultValue={member?.role ?? ""}
            maxLength={140}
            aria-invalid={Boolean(errors.role)}
            placeholder="Strategy lead"
          />
          <FieldError messages={errors.role} />
        </FieldRow>
      </div>

      <FieldRow label="Bio">
        <Textarea
          name="bio"
          rows={5}
          defaultValue={member?.bio ?? ""}
          maxLength={1400}
          aria-invalid={Boolean(errors.bio)}
          placeholder="Short public bio. Keep it concrete and human."
        />
        <FieldError messages={errors.bio} />
      </FieldRow>

      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="Sort order">
          <Input
            name="sort_order"
            type="number"
            step={1}
            inputMode="numeric"
            defaultValue={member?.sort_order ?? 0}
            aria-invalid={Boolean(errors.sort_order)}
          />
          <FieldError messages={errors.sort_order} />
        </FieldRow>

        <FieldRow label="Active (visible on public site)">
          <span className="mt-1 inline-flex cursor-pointer select-none items-center gap-3">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={member?.is_active ?? true}
              className="h-4 w-4 accent-[#ff6a00]"
            />
            <span className="text-[13.5px] text-white/80">Publish</span>
          </span>
        </FieldRow>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="Website">
          <Input
            name="website"
            type="url"
            defaultValue={socialValue(member?.socials, "website")}
            aria-invalid={Boolean(errors.website)}
            placeholder="https://example.com"
          />
          <FieldError messages={errors.website} />
        </FieldRow>
        <FieldRow label="LinkedIn">
          <Input
            name="linkedin"
            type="url"
            defaultValue={socialValue(member?.socials, "linkedin")}
            aria-invalid={Boolean(errors.linkedin)}
            placeholder="https://linkedin.com/in/name"
          />
          <FieldError messages={errors.linkedin} />
        </FieldRow>
        <FieldRow label="X / Twitter">
          <Input
            name="x"
            type="url"
            defaultValue={socialValue(member?.socials, "x")}
            aria-invalid={Boolean(errors.x)}
            placeholder="https://x.com/name"
          />
          <FieldError messages={errors.x} />
        </FieldRow>
        <FieldRow label="Instagram">
          <Input
            name="instagram"
            type="url"
            defaultValue={socialValue(member?.socials, "instagram")}
            aria-invalid={Boolean(errors.instagram)}
            placeholder="https://instagram.com/name"
          />
          <FieldError messages={errors.instagram} />
        </FieldRow>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-6">
        <FieldRow label="Photo (PNG / JPG / WebP, < 5 MB)">
          <Input name="photo_file" type="file" accept="image/png,image/jpeg,image/webp" />
        </FieldRow>

        {member?.photo_url ? (
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={member.photo_url} alt="" className="h-16 w-16 border border-white/10 object-cover" />
            <p className="text-[12.5px] text-white/50">
              Currently using{" "}
              <a href={member.photo_url} target="_blank" rel="noreferrer" className="underline hover:text-[#ff6a00]">
                {member.photo_url.split("/").pop()}
              </a>
              . Upload a new file to replace.
            </p>
          </div>
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
          href="/admin/team"
          className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-white/55 hover:text-white"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
