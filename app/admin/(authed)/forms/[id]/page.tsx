import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import { FormBuilderEditor } from "../FormBuilderForm";

export const metadata = { title: "Edit Form - SADEEM Admin" };

type FormRow = Database["public"]["Tables"]["forms"]["Row"];
type FieldRow = Database["public"]["Tables"]["form_fields"]["Row"];

async function loadForm(id: string) {
  try {
    const admin = getSupabaseAdmin();
    const [formResult, fieldResult] = await Promise.all([
      admin
        .from("forms")
        .select("id, slug, name, purpose, description, submit_label, success_message, is_active, created_by, created_at, updated_at")
        .eq("id", id)
        .maybeSingle(),
      admin
        .from("form_fields")
        .select("id, form_id, label, field_key, type, placeholder, help_text, options, is_required, sort_order, config, created_at")
        .eq("form_id", id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

    if (formResult.error) throw formResult.error;
    if (fieldResult.error) throw fieldResult.error;
    return {
      form: formResult.data as FormRow | null,
      fields: (fieldResult.data ?? []) as FieldRow[],
      error: null as string | null,
    };
  } catch (err) {
    return {
      form: null,
      fields: [] as FieldRow[],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export default async function EditFormPage({ params }: { params: { id: string } }) {
  await requireRole(["admin", "editor"]);
  const { form, fields, error } = await loadForm(params.id);
  if (!form && !error) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="FORM BUILDER"
        title={form?.name ?? "Form unavailable"}
        description="Define the shell, then compose safe field blocks for the workflow."
      />

      {error ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200">
          Couldn&apos;t load form: <code>{error}</code>
        </div>
      ) : null}

      {form ? <FormBuilderEditor form={form} fields={fields} /> : null}
    </div>
  );
}
