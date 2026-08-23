"use client";

import { DeleteConfirmButton } from "@/components/admin/ui/DeleteConfirmButton";
import { deleteServiceAction } from "./actions";

/**
 * Was a bare `confirm("Delete ...?")` behind a text link styled quieter than
 * every other control on the card — the exact shape audit finding A03 is about.
 */
export function DeleteServiceButton({ id, title }: { id: string; title: string }) {
  return (
    <DeleteConfirmButton
      action={deleteServiceAction}
      id={id}
      objectName={title}
      blastRadius="The service page is removed from the public site, and any proposal that references it loses the link. This cannot be undone."
      typeToConfirm
    />
  );
}
