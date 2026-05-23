import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import TeamForm from "../TeamForm";

export const metadata = { title: "Edit team member - SADEEM Admin" };

export default async function EditTeamMemberPage({ params }: { params: { id: string } }) {
  await requireRole(["admin", "editor"]);

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("team_members")
    .select("id, name, role, bio, photo_url, socials, sort_order, is_active")
    .eq("id", params.id)
    .single();
  if (error || !data) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="PEOPLE" title={data.name} description={`Editing ${data.role || "team profile"}`} />
      <TeamForm mode="edit" member={data} />
    </div>
  );
}
