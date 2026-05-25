import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import StoryForm from "../StoryForm";

export const metadata = { title: "Edit success story - SADEEM Admin" };

export default async function EditSuccessStoryPage({ params }: { params: { id: string } }) {
  await requireRole(["admin", "editor"]);
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("success_stories")
    .select(
      "id, slug, title, client_name, industry, summary, challenge, solution, results, body, image_url, metric_value, metric_label, sort_order, is_published",
    )
    .eq("id", params.id)
    .single();
  if (error || !data) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="PROOF" title={data.title} description={`Editing /${data.slug}`} />
      <StoryForm mode="edit" story={data} />
    </div>
  );
}
