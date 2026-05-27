export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import ServiceForm from "../ServiceForm";

export const metadata = { title: "Edit service - SADEEM Admin" };

export default async function EditServicePage({ params }: { params: { id: string } }) {
  await requireRole(["admin", "editor"]);

  const admin = getSupabaseAdmin();
  const { data: service } = await admin
    .from("services")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!service) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="SERVICES"
        title={service.title}
        description={`Editing — /services/${service.slug}`}
      />
      <ServiceForm
        mode="edit"
        service={{
          id:           service.id,
          slug:         service.slug,
          title:        service.title,
          category:     service.category,
          tagline:      service.tagline ?? undefined,
          intro:        service.intro ?? undefined,
          body:         service.body ?? undefined,
          deliverables: (service.deliverables as string[]) ?? [],
          icon_key:     service.icon_key ?? undefined,
          sort_order:   service.sort_order,
          is_published: service.is_published,
        }}
      />
    </div>
  );
}
