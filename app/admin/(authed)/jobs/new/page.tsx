import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import JobForm from "../JobForm";

export const metadata = { title: "New role - SADEEM Admin" };

async function loadApplicationForms() {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("forms")
    .select("id, name, purpose, is_active")
    .in("purpose", ["application", "generic"])
    .order("name", { ascending: true });
  return data ?? [];
}

export default async function NewJobPage() {
  await requireRole(["admin", "editor"]);
  const forms = await loadApplicationForms();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="CAREERS"
        title="New role"
        description="Create a public job or internship opening."
      />
      <JobForm mode="create" forms={forms} />
    </div>
  );
}
