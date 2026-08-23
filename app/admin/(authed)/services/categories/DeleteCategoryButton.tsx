"use client";

import { DeleteConfirmButton } from "@/components/admin/ui/DeleteConfirmButton";
import { deleteCategoryAction } from "./actions";

export function DeleteCategoryButton({ id, label }: { id: string; label: string }) {
  return (
    <DeleteConfirmButton
      action={deleteCategoryAction}
      id={id}
      objectName={label}
      blastRadius="Services in this category are kept, but they lose their grouping on /services until you reassign them."
    />
  );
}
