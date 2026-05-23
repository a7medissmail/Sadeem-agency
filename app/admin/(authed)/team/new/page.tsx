import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import TeamForm from "../TeamForm";

export const metadata = { title: "New team member - SADEEM Admin" };

export default async function NewTeamMemberPage() {
  await requireRole(["admin", "editor"]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="PEOPLE"
        title="New team member"
        description="Add a public profile, optional social links, and a portrait for the team page."
      />
      <TeamForm mode="create" />
    </div>
  );
}
