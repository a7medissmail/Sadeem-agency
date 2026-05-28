import Link from "next/link";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { FieldRow, Input, Select, Textarea } from "@/components/admin/ui/Field";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  campaignAudienceLabel,
  campaignLeadSources,
  campaignLeadStatuses,
  type CampaignAudience,
} from "@/lib/validation/campaign";
import type { CampaignStatus, Database } from "@/types/database";
import { createCampaignAction } from "./actions";
import { DeleteCampaignButton } from "./DeleteCampaignButton";
import { SendCampaignButton } from "./SendCampaignButton";

export const metadata = { title: "Email Center - SADEEM Admin" };

type Campaign = Database["public"]["Tables"]["email_campaigns"]["Row"];
type Send = Database["public"]["Tables"]["email_sends"]["Row"];
type Lead = Pick<
  Database["public"]["Tables"]["leads"]["Row"],
  "id" | "email" | "status" | "source" | "marketing_unsubscribed_at"
>;

const statusTones: Record<CampaignStatus, "neutral" | "blue" | "green" | "red" | "amber"> = {
  draft: "neutral",
  sending: "blue",
  sent: "green",
  failed: "red",
};

function MetricCard({ label, value, hint }: { label: string; value: number | string; hint: string }) {
  return (
    <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">{label}</p>
      <div className="mt-3 text-[30px] font-semibold leading-none text-[var(--admin-text)]">{value}</div>
      <p className="mt-3 text-[12.5px] text-[var(--admin-muted)]">{hint}</p>
    </div>
  );
}

function audienceFromJson(value: unknown): CampaignAudience {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  return {
    status: typeof raw.status === "string" ? (raw.status as CampaignAudience["status"]) : null,
    source: typeof raw.source === "string" ? (raw.source as CampaignAudience["source"]) : null,
  };
}

function audienceCount(leads: Lead[], audience: CampaignAudience) {
  const dedupe = new Set<string>();
  for (const lead of leads) {
    if (lead.marketing_unsubscribed_at) continue;
    if (audience.status && lead.status !== audience.status) continue;
    if (audience.source && lead.source !== audience.source) continue;
    dedupe.add(lead.email.toLowerCase().trim());
  }
  return dedupe.size;
}

async function loadData() {
  try {
    const admin = getSupabaseAdmin();
    const [campaigns, sends, leads] = await Promise.all([
      admin.from("email_campaigns").select("*").order("created_at", { ascending: false }).limit(80),
      admin.from("email_sends").select("*").order("created_at", { ascending: false }).limit(1000),
      admin.from("leads").select("id, email, status, source, marketing_unsubscribed_at").limit(1000),
    ]);

    if (campaigns.error) throw campaigns.error;
    if (sends.error) throw sends.error;
    if (leads.error) throw leads.error;

    return {
      campaigns: (campaigns.data ?? []) as Campaign[],
      sends: (sends.data ?? []) as Send[],
      leads: (leads.data ?? []) as Lead[],
      error: null as string | null,
    };
  } catch (err) {
    return {
      campaigns: [] as Campaign[],
      sends: [] as Send[],
      leads: [] as Lead[],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export default async function CampaignsAdminPage() {
  await requireRole(["admin", "editor", "viewer"]);
  const { campaigns, sends, leads, error } = await loadData();
  const dateFmt = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });
  const sendsByCampaign = new Map<string, Send[]>();
  for (const send of sends) sendsByCampaign.set(send.campaign_id, [...(sendsByCampaign.get(send.campaign_id) ?? []), send]);
  const eligibleCount = audienceCount(leads, {});
  const unsubscribedCount = leads.filter((lead) => lead.marketing_unsubscribed_at).length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="P6" title="Email Studio" description="Compose, target, and dispatch CRM updates from the same operating surface." />

      {error ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200">
          Couldn&apos;t load email center: <code>{error}</code>
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--admin-accent)]">Mailing OS</p>
          <h2 className="mt-2 max-w-[13ch] text-[34px] font-semibold leading-[1.02] tracking-tight text-[var(--admin-text)]">
            One studio for careful dispatch.
          </h2>
          <p className="mt-4 max-w-[68ch] text-[14.5px] leading-relaxed text-[var(--admin-muted)]">
            Campaigns use the shared SADEEM email shell, audience filters, unsubscribe suppression, and delivery tracking.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Eligible" value={eligibleCount} hint="Can receive mail" />
          <MetricCard label="Opted out" value={unsubscribedCount} hint="Suppressed leads" />
          <MetricCard label="Drafts" value={campaigns.filter((campaign) => campaign.status === "draft").length} hint="Not sent yet" />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form action={createCampaignAction} className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
          <div className="mb-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--admin-accent)]">Compose</p>
            <h2 className="mt-2 text-xl font-semibold">New campaign</h2>
            <p className="mt-1 text-[13px] text-[var(--admin-muted)]">
              Body is sent in the SADEEM email system. Plain text is safest; basic pasted HTML is cleaned before sending.
            </p>
          </div>

          <div className="grid gap-4">
            <FieldRow label="Subject">
              <Input name="subject" required placeholder="Workshop seats are open" />
            </FieldRow>

            <div className="grid gap-4 md:grid-cols-2">
              <FieldRow label="Lead status">
                <Select name="status" defaultValue="">
                  <option value="">All statuses</option>
                  {campaignLeadStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </FieldRow>
              <FieldRow label="Lead source">
                <Select name="source" defaultValue="">
                  <option value="">All sources</option>
                  {campaignLeadSources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </Select>
              </FieldRow>
            </div>

            <FieldRow label="Body">
              <Textarea
                name="body"
                required
                rows={10}
                placeholder={"Write the update in plain text.\n\nUse blank lines for paragraphs."}
              />
            </FieldRow>

            <Button type="submit">Save draft</Button>
          </div>
        </form>

        <div className="flex flex-col gap-3">
          {campaigns.length === 0 ? (
            <div className="border border-dashed border-[var(--admin-border)] bg-[var(--admin-panel)] px-5 py-12 text-center text-[13px] text-[var(--admin-subtle)]">
              No campaigns yet. Create a draft, review the audience count, then send.
            </div>
          ) : (
            campaigns.map((campaign) => {
              const campaignSends = sendsByCampaign.get(campaign.id) ?? [];
              const audience = audienceFromJson(campaign.audience);
              const sent = campaignSends.filter((send) => send.status === "sent").length;
              const failed = campaignSends.filter((send) => send.status === "failed").length;
              const count = audienceCount(leads, audience);
              const canSend = campaign.status === "draft" || campaign.status === "failed";

              return (
                <article key={campaign.id} className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5 transition-colors hover:border-[var(--admin-accent)]">
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-[20px] font-semibold leading-tight text-[var(--admin-text)]">{campaign.subject}</h3>
                        <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--admin-subtle)]">
                      {dateFmt.format(new Date(campaign.created_at))}
                        </div>
                      </div>
                      <Badge tone={statusTones[campaign.status]}>{campaign.status}</Badge>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3 border-y border-[var(--admin-border-soft)] py-4">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">Audience</p>
                      <p className="mt-1 text-[13px] text-[var(--admin-muted)]">{count} leads</p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">Filter</p>
                      <p className="mt-1 text-[13px] text-[var(--admin-muted)]">{campaignAudienceLabel(audience)}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">Delivery</p>
                      <p className="mt-1 text-[13px] text-[var(--admin-muted)]">
                        {sent} sent{failed ? <span className="text-red-300"> / {failed} failed</span> : null}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-2">
                    {campaign.status === "draft" ? (
                      <Link href={`/admin/campaigns/${campaign.id}`}>
                        <Button size="sm" variant="outline">Edit</Button>
                      </Link>
                    ) : null}
                    {canSend ? (
                      <SendCampaignButton campaignId={campaign.id} recipientCount={count} />
                    ) : null}
                    <DeleteCampaignButton campaignId={campaign.id} />
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
