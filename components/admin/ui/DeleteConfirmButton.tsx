"use client";

import { Button } from "./Button";

/**
 * A client-side wrapper that guards a server-action delete form with a
 * window.confirm dialog.  Pass the server action as `action` so the form
 * still works without JS (progressive enhancement), but JS users get the
 * confirmation before the irreversible request fires.
 */
export function DeleteConfirmButton({
  action,
  id,
  label = "Delete",
  message = "Delete this item? This cannot be undone.",
  size = "sm",
  className,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label?: string;
  message?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="danger" size={size} className={className}>
        {label}
      </Button>
    </form>
  );
}
