"use client";

import { deleteCampaignAction } from "./actions";
import { Button } from "@/components/admin/ui/Button";

export function DeleteCampaignButton({ campaignId }: { campaignId: string }) {
  return (
    <form
      action={deleteCampaignAction}
      onSubmit={(e) => {
        if (!window.confirm("Delete this campaign? This cannot be undone.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={campaignId} />
      <Button type="submit" size="sm" variant="danger">
        Del
      </Button>
    </form>
  );
}
