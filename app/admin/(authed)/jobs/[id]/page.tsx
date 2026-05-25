import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import JobForm from "../JobForm";

export const metadata = { title: "Edit role - SADEEM Admin" };

async function loadJob(id: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("jobs")
    .select("id, slug, title, type, department, location, body, requirements, application_form_id, is_open")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data;
}

async function loadApplicationForms() {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("forms")
    .select("id, name, purpose, is_active")
    .in("purpose", ["application", "generic"])
    .order("name", { ascending: true });
  return data ?? [];
}

export default async function EditJobPage({ params }: { params: { id: string } }) {
  await requireRole(["admin", "editor"]);
  const [job, forms] = await Promise.all([loadJob(params.id), loadApplicationForms()]);
  if (!job) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="CAREERS" title="Edit role" description="Update the public role and application status." />
      <JobForm mode="edit" job={job} forms={forms} />
    </div>
  );
}
