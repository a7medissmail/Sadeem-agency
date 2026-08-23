"use client";

import { ConfirmSubmitButton } from "@/components/admin/ui/ConfirmSubmitButton";
import { sendCampaignAction } from "./actions";

/**
 * Sending is irreversible and outward-facing, but it is not destructive — so it
 * gets the confirmation dialog with a primary confirm rather than a red one.
 *
 * The recipient count belongs in the dialog body rather than the button label:
 * the number is the thing worth reading twice, and window.confirm rendered it
 * in the browser's own chrome where it read as boilerplate.
 */
export function SendCampaignButton({
  campaignId,
  recipientCount,
}: {
  campaignId: string;
  recipientCount: number;
}) {
  const noun = recipientCount === 1 ? "lead" : "leads";

  return (
    <ConfirmSubmitButton
      action={sendCampaignAction}
      hidden={{ id: campaignId }}
      label="Send campaign"
      variant="primary"
      size="md"
      title={`Send this campaign to ${recipientCount} ${noun}?`}
      body="Mail goes out immediately and cannot be recalled. Unsubscribed leads are excluded automatically."
      confirmLabel={`Send to ${recipientCount} ${noun}`}
      cancelLabel="Not yet"
    />
  );
}
