import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import CategoryForm from "../CategoryForm";

export const metadata = { title: "New category - SADEEM Admin" };

export default async function NewCategoryPage() {
  await requireRole(["admin", "editor"]);
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="SERVICES"
        title="New category"
        description="Add a service category to organise services on the public website."
      />
      <CategoryForm mode="create" />
    </div>
  );
}
