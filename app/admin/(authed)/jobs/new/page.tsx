import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireRole } from "@/lib/auth";
import JobForm from "../JobForm";

export const metadata = { title: "New role - SADEEM Admin" };

export default async function NewJobPage() {
  await requireRole(["admin", "editor"]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="CAREERS"
        title="New role"
        description="Create a public job or internship opening."
      />
      <JobForm mode="create" />
    </div>
  );
}
