"use client";

import { useRef, useState, type ReactNode } from "react";
import { Button } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";

/**
 * A server-action form whose submit is guarded by a real confirmation.
 *
 * This is the shape that was hand-written eleven times across the boards, each
 * time as `<form onSubmit={e => { if (!window.confirm(...)) e.preventDefault() }}>`.
 * window.confirm cannot name the object in its own voice, cannot lay out a
 * blast radius, cannot label its button with the verb, and always focuses OK —
 * so Enter fires the irreversible action.
 *
 * Not only for deletes. Sending a campaign to the whole list and regenerating a
 * client's portal token are both irreversible and outward-facing, and neither
 * is destructive in the "danger" sense — they get the same dialog with a
 * primary confirm instead of a red one.
 *
 * The form still posts without JS: the guard lives on the button's click, so
 * with scripting off the submit goes straight through exactly as before.
 */
export function ConfirmSubmitButton({
  action,
  hidden,
  label,
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmText,
  variant = "danger",
  size = "sm",
  className,
  formClassName,
}: {
  // Server actions return a promise; useFormState dispatchers return void.
  action: (formData: FormData) => void | Promise<void>;
  /** Hidden fields the action needs, e.g. { id, form_id }. */
  hidden: Record<string, string>;
  label: ReactNode;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Require this exact string to be typed. Reserve it for actions that touch other records. */
  confirmText?: string;
  variant?: "danger" | "primary";
  size?: "sm" | "md" | "lg";
  className?: string;
  formClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <form ref={formRef} action={action} className={formClassName}>
        {Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <Button
          type="submit"
          variant={variant}
          size={size}
          className={className}
          onClick={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
        >
          {label}
        </Button>
      </form>

      <ConfirmDialog
        open={open}
        title={title}
        body={body}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        confirmText={confirmText}
        confirmVariant={variant}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          formRef.current?.requestSubmit();
        }}
      />
    </>
  );
}
