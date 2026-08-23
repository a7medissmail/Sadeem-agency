"use client";

import { ConfirmSubmitButton } from "./ConfirmSubmitButton";

/**
 * The delete preset over ConfirmSubmitButton.
 *
 * Names the object in the title, states the blast radius in the body, labels
 * the confirm with the verb, and leaves Cancel holding focus — all four of
 * which window.confirm could not do, which is why deleting a client record was
 * a two-pixel miss away (audit finding A03).
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
  /** Extra fields the action needs beyond the id. */
  hidden,
  size = "sm",
  className,
  formClassName,
}: {
  // Server actions return a promise; useFormState dispatchers return void.
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  label?: string;
  objectName?: string;
  blastRadius?: string;
  message?: string;
  typeToConfirm?: boolean;
  hidden?: Record<string, string>;
  size?: "sm" | "md" | "lg";
  className?: string;
  formClassName?: string;
}) {
  return (
    <ConfirmSubmitButton
      action={action}
      hidden={{ id, ...hidden }}
      label={label}
      title={objectName ? `Delete ${objectName}?` : "Delete this record?"}
      body={
        blastRadius ?? message ?? "This record will be permanently removed. This cannot be undone."
      }
      confirmLabel={objectName ? `Delete ${objectName}` : label}
      cancelLabel={objectName ? `Keep ${objectName}` : "Cancel"}
      confirmText={typeToConfirm ? objectName : undefined}
      variant="danger"
      size={size}
      className={className}
      formClassName={formClassName}
    />
  );
}
