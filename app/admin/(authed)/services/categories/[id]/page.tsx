export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import CategoryForm from "../CategoryForm";

export const metadata = { title: "Edit category - SADEEM Admin" };

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
  await requireRole(["admin", "editor"]);

  const admin = getSupabaseAdmin();
  const { data: category } = await admin
    .from("service_categories")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!category) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="SERVICES"
        title={category.label}
        description={`Editing category — slug: ${category.slug}`}
      />
      <CategoryForm
        mode="edit"
        category={{
          id:          category.id,
          slug:        category.slug,
          label:       category.label,
          tagline:     category.tagline ?? undefined,
          description: category.description ?? undefined,
          sort_order:  category.sort_order,
        }}
      />
    </div>
  );
}
