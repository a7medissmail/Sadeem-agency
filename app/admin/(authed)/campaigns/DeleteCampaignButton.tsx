"use client";

import { DeleteConfirmButton } from "@/components/admin/ui/DeleteConfirmButton";
import { deleteCampaignAction } from "./actions";

export function DeleteCampaignButton({
  campaignId,
  campaignName,
}: {
  campaignId: string;
  campaignName?: string;
}) {
  return (
    <DeleteConfirmButton
      action={deleteCampaignAction}
      id={campaignId}
      // "Del" was the label. The confirm button carries the verb now.
      label="Delete"
      objectName={campaignName}
      blastRadius="The campaign and its draft content go away. Emails already sent are not recalled. This cannot be undone."
    />
  );
}
