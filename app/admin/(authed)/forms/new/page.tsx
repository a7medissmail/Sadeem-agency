import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requirePermission } from "@/lib/auth";
import { FormDefinitionForm } from "../FormBuilderForm";

export const metadata = { title: "New Form - SADEEM Admin" };

export default async function NewFormPage() {
  await requirePermission("forms:edit");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="FORM BUILDER"
        title="New form"
        description="Create the form shell first. After saving, add controlled fields and options."
      />
      <FormDefinitionForm mode="create" />
    </div>
  );
}
