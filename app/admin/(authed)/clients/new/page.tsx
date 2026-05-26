import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import PartnerForm from "../PartnerForm";

export const metadata = { title: "New partner - SADEEM Admin" };

export default async function NewPartnerPage() {
  await requireRole(["admin", "editor"]);
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="SECTION 08"
        title="New partner"
        description="Add a partner to the clients section. Anchor partners appear on the left at full size; grid partners fill the 4×2."
      />
      <PartnerForm mode="create" />
    </div>
  );
}
