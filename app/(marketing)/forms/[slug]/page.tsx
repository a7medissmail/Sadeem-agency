import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import DynamicFormRenderer from "@/components/DynamicFormRenderer";
import SectionAwareNavbar from "@/components/SectionAwareNavbar";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type FormRow = Database["public"]["Tables"]["forms"]["Row"];
type FieldRow = Database["public"]["Tables"]["form_fields"]["Row"];

async function loadPublicForm(slug: string) {
  try {
    const admin = getSupabaseAdmin();
    const { data: form, error } = await admin
      .from("forms")
      .select("id, slug, name, purpose, description, submit_label, success_message, is_active, created_by, created_at, updated_at")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw error;
    if (!form) return { form: null, fields: [] as FieldRow[] };

    const { data: fields, error: fieldsError } = await admin
      .from("form_fields")
      .select("id, form_id, label, field_key, type, placeholder, help_text, options, is_required, sort_order, config, created_at")
      .eq("form_id", form.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (fieldsError) throw fieldsError;

    return { form: form as FormRow, fields: (fields ?? []) as FieldRow[] };
  } catch {
    return { form: null, fields: [] as FieldRow[] };
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { form } = await loadPublicForm(params.slug);
  return {
    title: form ? `${form.name} - SADEEM` : "Form - SADEEM",
    description: form?.description ?? "SADEEM intake form.",
  };
}

export default async function PublicDynamicFormPage({ params }: { params: { slug: string } }) {
  const { form, fields } = await loadPublicForm(params.slug);
  if (!form) notFound();

  return (
    <>
      <SectionAwareNavbar initialOverDark />
      <main className="page dynamic-form-page">
        <section className="dynamic-form-hero dark" data-section="01">
          <div className="dynamic-form-hero-bg" aria-hidden="true" />
          <div className="section-inner dynamic-form-hero-inner">
            <div>
              <p className="team-brief-kicker">SADEEM FORM</p>
              <h1 className="display dynamic-form-hero-title">
                {form.name}.
              </h1>
              {form.description ? <p>{form.description}</p> : null}
            </div>
          </div>
        </section>

        <section className="dynamic-form-live light" data-section="02">
          <div className="section-inner dynamic-form-live-grid">
            <aside>
              <p className="team-brief-kicker">SADEEM INTAKE</p>
              <h2>
                Share what
                <br />
                <span>matters most.</span>
              </h2>
              <p>
                Every field is read by a real person on the SADEEM team. Clear, honest answers help us respond
                faster and with more precision.
              </p>
            </aside>
            <DynamicFormRenderer form={form} fields={fields} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
