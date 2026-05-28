"use client";

import { toggleMaintenanceModeAction } from "./actions";

export function MaintenanceToggle({ isOn }: { isOn: boolean }) {
  return (
    <form
      action={toggleMaintenanceModeAction}
      onSubmit={(e) => {
        const msg = isOn
          ? "Bring the site back online?"
          : "Enable maintenance mode?\n\nAll public pages will immediately redirect to the maintenance page until you disable it.";
        if (!window.confirm(msg)) e.preventDefault();
      }}
    >
      <input type="hidden" name="enable" value={isOn ? "false" : "true"} />
      <button
        type="submit"
        className={`px-5 py-2 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${
          isOn
            ? "bg-emerald-600 text-white hover:bg-emerald-500"
            : "bg-red-600 text-white hover:bg-red-500"
        }`}
      >
        {isOn ? "Bring site online" : "Enable maintenance mode"}
      </button>
    </form>
  );
}
