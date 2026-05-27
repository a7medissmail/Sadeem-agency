import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import ServiceForm from "../ServiceForm";

export const metadata = { title: "New service - SADEEM Admin" };

export default async function NewServicePage() {
  await requireRole(["admin", "editor"]);
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="SERVICES"
        title="New service"
        description="Add a service page to the public website."
      />
      <ServiceForm mode="create" />
    </div>
  );
}
