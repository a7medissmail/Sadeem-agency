import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import StoryForm from "../StoryForm";

export const metadata = { title: "New success story - SADEEM Admin" };

export default async function NewSuccessStoryPage() {
  await requireRole(["admin", "editor"]);
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="PROOF"
        title="New success story"
        description="Create a public case narrative. Keep metrics defensible and the client name optional."
      />
      <StoryForm mode="create" />
    </div>
  );
}
