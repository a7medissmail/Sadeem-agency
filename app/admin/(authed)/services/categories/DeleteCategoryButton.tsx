"use client";

import { deleteCategoryAction } from "./actions";

export function DeleteCategoryButton({ id, label }: { id: string; label: string }) {
  return (
    <form
      action={deleteCategoryAction}
      onSubmit={(e) => {
        if (!confirm(`Delete category "${label}"? This will not delete its services.`))
          e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-xs text-[var(--admin-muted)] hover:text-red-400 transition-colors"
      >
        Delete
      </button>
    </form>
  );
}
