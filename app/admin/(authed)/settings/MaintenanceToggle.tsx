"use client";

import { ConfirmSubmitButton } from "@/components/admin/ui/ConfirmSubmitButton";
import { toggleMaintenanceModeAction } from "./actions";

/**
 * The one control in the tool that changes what every visitor sees. Turning it
 * on is destructive to the public site's availability, so it confirms in red;
 * turning it back off is a recovery and confirms in primary.
 */
export function MaintenanceToggle({ isOn }: { isOn: boolean }) {
  return isOn ? (
    <ConfirmSubmitButton
      action={toggleMaintenanceModeAction}
      hidden={{ enable: "false" }}
      label="Bring site online"
      variant="primary"
      size="md"
      title="Bring the site back online?"
      body="Public pages start serving again immediately."
      confirmLabel="Bring online"
    />
  ) : (
    <ConfirmSubmitButton
      action={toggleMaintenanceModeAction}
      hidden={{ enable: "true" }}
      label="Enable maintenance mode"
      variant="danger"
      size="md"
      title="Put the whole public site into maintenance?"
      body="Every public page starts redirecting to the maintenance page immediately — the homepage, every service, every course, and the booking form. The admin stays reachable."
      confirmLabel="Enable maintenance"
      cancelLabel="Leave site up"
    />
  );
}
