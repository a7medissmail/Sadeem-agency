import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import PartnerForm from "../PartnerForm";

export const metadata = { title: "Edit partner - SADEEM Admin" };

export default async function EditPartnerPage({ params }: { params: { id: string } }) {
  await requireRole(["admin", "editor"]);

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("client_partners")
    .select("id, name, caption, logo_url, role, sort_order, is_active")
    .eq("id", params.id)
    .maybeSingle();

  if (error || !data) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="SECTION 08"
        title={data.name}
        description="Update the logo, role, sort order, or visibility for this partner."
      />
      <PartnerForm mode="edit" partner={data} />
    </div>
  );
}
