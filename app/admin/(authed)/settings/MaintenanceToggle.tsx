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
        className={`px-5 py-2 sdm-eyebrow transition-colors ${
          isOn
            ? "bg-[var(--sdm-status-success)] text-white hover:bg-[var(--sdm-status-success)]"
            : "bg-[var(--sdm-status-danger)] text-white hover:bg-[var(--sdm-status-danger)]"
        }`}
      >
        {isOn ? "Bring site online" : "Enable maintenance mode"}
      </button>
    </form>
  );
}
