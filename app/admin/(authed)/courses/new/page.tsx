import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import CourseForm from "../CourseForm";

export const metadata = { title: "New course — SADEEM Admin" };

export default async function NewCoursePage() {
  await requireRole(["admin", "editor"]);
  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="WORKSHOPS" title="New course" description="Create a workshop announcement. Save as a draft (off) or publish straight away." />
      <CourseForm mode="create" />
    </div>
  );
}
