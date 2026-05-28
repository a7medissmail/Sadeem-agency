"use client";

import { sendCampaignAction } from "./actions";
import { Button } from "@/components/admin/ui/Button";

/**
 * Wraps the "Send campaign" server action behind a window.confirm guard so
 * an accidental tap can't fire an irreversible mass email to the whole list.
 */
export function SendCampaignButton({
  campaignId,
  recipientCount,
}: {
  campaignId: string;
  recipientCount: number;
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const noun = recipientCount === 1 ? "lead" : "leads";
    const ok = window.confirm(
      `Send this campaign to ${recipientCount} ${noun}?\n\nThis action cannot be undone.`,
    );
    if (!ok) e.preventDefault();
  }

  return (
    <form action={sendCampaignAction} onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={campaignId} />
      <Button type="submit" size="sm" disabled={recipientCount === 0}>
        Send
      </Button>
    </form>
  );
}
