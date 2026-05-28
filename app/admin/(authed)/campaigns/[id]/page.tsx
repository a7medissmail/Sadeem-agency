import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/admin/ui/Button";
import { FieldRow, Input, Select, Textarea } from "@/components/admin/ui/Field";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { campaignLeadSources, campaignLeadStatuses } from "@/lib/validation/campaign";
import type { Database } from "@/types/database";
import { updateCampaignAction } from "../actions";

export const metadata = { title: "Edit Campaign - SADEEM Admin" };

type Campaign = Database["public"]["Tables"]["email_campaigns"]["Row"];

async function loadCampaign(id: string): Promise<{ campaign: Campaign | null; error: string | null }> {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("email_campaigns")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return { campaign: data as Campaign | null, error: null };
  } catch (err) {
    return { campaign: null, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

function parseAudienceField(value: unknown, key: "status" | "source"): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const raw = value as Record<string, unknown>;
  return typeof raw[key] === "string" ? (raw[key] as string) : "";
}

export default async function EditCampaignPage({ params }: { params: { id: string } }) {
  await requireRole(["admin", "editor"]);
  const { id } = params;
  const { campaign, error } = await loadCampaign(id);

  if (!campaign && !error) notFound();
  if (campaign && campaign.status !== "draft") redirect("/admin/campaigns");

  const audienceStatus = parseAudienceField(campaign?.audience, "status");
  const audienceSource = parseAudienceField(campaign?.audience, "source");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="EMAIL STUDIO"
        title="Edit draft"
        description="Update the subject, body, or audience filter before sending."
        actions={
          <Link href="/admin/campaigns">
            <Button variant="ghost" size="sm">← Back</Button>
          </Link>
        }
      />

      {error ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200">
          Couldn&apos;t load campaign: <code>{error}</code>
        </div>
      ) : null}

      {campaign ? (
        <form action={updateCampaignAction} className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5 max-w-2xl">
          <input type="hidden" name="id" value={campaign.id} />
          <div className="mb-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--admin-accent)]">Draft</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--admin-text)]">Update campaign</h2>
            <p className="mt-1 text-[13px] text-[var(--admin-muted)]">
              Changes are saved as a draft. Review the audience count on the main page before sending.
            </p>
          </div>

          <div className="grid gap-4">
            <FieldRow label="Subject">
              <Input name="subject" required defaultValue={campaign.subject} placeholder="Workshop seats are open" />
            </FieldRow>

            <div className="grid gap-4 md:grid-cols-2">
              <FieldRow label="Lead status">
                <Select name="status" defaultValue={audienceStatus}>
                  <option value="">All statuses</option>
                  {campaignLeadStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </Select>
              </FieldRow>
              <FieldRow label="Lead source">
                <Select name="source" defaultValue={audienceSource}>
                  <option value="">All sources</option>
                  {campaignLeadSources.map((source) => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </Select>
              </FieldRow>
            </div>

            <FieldRow label="Body">
              <Textarea
                name="body"
                required
                rows={12}
                defaultValue={campaign.body}
                placeholder={"Write the update in plain text.\n\nUse blank lines for paragraphs."}
              />
            </FieldRow>

            <div className="flex items-center gap-3">
              <Button type="submit">Save draft</Button>
              <Link href="/admin/campaigns">
                <Button variant="ghost" size="sm">Cancel</Button>
              </Link>
            </div>
          </div>
        </form>
      ) : null}
    </div>
  );
}
