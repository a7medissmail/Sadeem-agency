import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/admin/ui/Button";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import DynamicFormRenderer from "@/components/DynamicFormRenderer";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export const metadata = { title: "Preview Form - SADEEM Admin" };

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
    return { form: null, fields: [] as FieldRow[], error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export default async function FormPreviewPage({ params }: { params: { id: string } }) {
  await requireRole(["admin", "editor", "viewer"]);
  const { form, fields, error } = await loadForm(params.id);
  if (!form && !error) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="PREVIEW"
        title={form?.name ?? "Form preview"}
        description="This is a visual preview. Public live forms are available only when the form is active."
        actions={
          form ? (
            <>
              <Link href={`/admin/forms/${form.id}`}>
                <Button variant="ghost">Edit</Button>
              </Link>
              {form.is_active ? (
                <Link href={`/forms/${form.slug}`} target="_blank">
                  <Button variant="outline">Open live</Button>
                </Link>
              ) : null}
            </>
          ) : null
        }
      />

      {error ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200">
          Couldn&apos;t load preview: <code>{error}</code>
        </div>
      ) : null}

      {form ? (
        <section className="admin-form-preview-wrap">
          <div className="admin-form-preview-toolbar">
            <span>{form.is_active ? "Active public route" : "Draft preview"}</span>
            <code>{form.is_active ? `/forms/${form.slug}` : "Make active to publish temporarily"}</code>
          </div>
          <DynamicFormRenderer form={form} fields={fields} preview />
        </section>
      ) : null}
    </div>
  );
}
