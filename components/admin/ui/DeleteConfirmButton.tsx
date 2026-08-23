"use client";

import { useRef, useState } from "react";
import { Button } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";

/**
 * Guards a server-action delete behind a real confirmation.
 *
 * The form still posts without JS, so the progressive-enhancement behaviour is
 * unchanged; what changed is what JS users see. window.confirm could not name
 * the object in its own voice, could not state the blast radius, could not
 * label its button with the verb, and always focused OK — so Enter destroyed
 * the record. All four are audit findings, and all four are why deleting a
 * client was a two-pixel miss away.
 */
export function DeleteConfirmButton({
  action,
  id,
  label = "Delete",
  /** The record's own name. Used in the title, so it reads "Delete Acme Corp?". */
  objectName,
  /** What else goes with it, in plain numbers. Skip only when nothing else does. */
  blastRadius,
  /** Legacy single-line message, used when objectName is not supplied. */
  message,
  /** Require the name to be typed. Reserve it for deletes that touch other records. */
  typeToConfirm = false,
  size = "sm",
  className,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label?: string;
  objectName?: string;
  blastRadius?: string;
  message?: string;
  typeToConfirm?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const title = objectName ? `Delete ${objectName}?` : "Delete this record?";
  const body =
    blastRadius ??
    message ??
    "This record will be permanently removed. This cannot be undone.";

  return (
    <>
      <form ref={formRef} action={action}>
        <input type="hidden" name="id" value={id} />
        <Button
          type="submit"
          variant="danger"
          size={size}
          className={className}
          onClick={(e) => {
            // Without JS this never runs and the form submits as before.
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
        confirmLabel={objectName ? `Delete ${objectName}` : label}
        cancelLabel={objectName ? `Keep ${objectName}` : "Cancel"}
        confirmText={typeToConfirm ? objectName : undefined}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          formRef.current?.requestSubmit();
        }}
      />
    </>
  );
}
