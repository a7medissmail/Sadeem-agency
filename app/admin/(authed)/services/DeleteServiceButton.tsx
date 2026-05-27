"use client";

import { deleteServiceAction } from "./actions";

export function DeleteServiceButton({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={deleteServiceAction}
      onSubmit={(e) => {
        if (!confirm(`Delete "${title}"?`)) e.preventDefault();
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
