import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import CourseForm from "../CourseForm";

export const metadata = { title: "Edit course — SADEEM Admin" };

export default async function EditCoursePage({ params }: { params: { id: string } }) {
  await requireRole(["admin", "editor"]);
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("courses")
    .select("id, slug, title, summary, body, location, starts_at, ends_at, capacity, price, image_url, is_active")
    .eq("id", params.id)
    .single();
  if (error || !data) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="WORKSHOPS" title={data.title} description={`Editing /${data.slug}`} />
      <CourseForm mode="edit" course={data} />
    </div>
  );
}
