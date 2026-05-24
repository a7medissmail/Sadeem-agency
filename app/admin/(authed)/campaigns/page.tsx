import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { FieldRow, Input, Select, Textarea } from "@/components/admin/ui/Field";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { EmptyState, TableShell } from "@/components/admin/ui/Table";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  campaignAudienceLabel,
  campaignLeadSources,
  campaignLeadStatuses,
  type CampaignAudience,
} from "@/lib/validation/campaign";
import type { CampaignStatus, Database } from "@/types/database";
import { createCampaignAction, deleteCampaignAction, sendCampaignAction } from "./actions";

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
      <PageHeader
        eyebrow="P6"
        title="Email Center"
        description="Compose CRM campaigns, send to filtered leads, and track delivery attempts. Transactional automations stay tied to their workflows."
      />

      {error ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200">
          Couldn&apos;t load email center: <code>{error}</code>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="border border-white/10 bg-white/[0.025] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">Eligible leads</p>
          <div className="mt-2 text-3xl font-semibold">{eligibleCount}</div>
        </div>
        <div className="border border-white/10 bg-white/[0.025] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">Opted out</p>
          <div className="mt-2 text-3xl font-semibold">{unsubscribedCount}</div>
        </div>
        <div className="border border-white/10 bg-white/[0.025] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">Campaigns</p>
          <div className="mt-2 text-3xl font-semibold">{campaigns.length}</div>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form action={createCampaignAction} className="border border-white/10 bg-white/[0.025] p-5">
          <div className="mb-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#ff6a00]">Compose</p>
            <h2 className="mt-2 text-xl font-semibold">New campaign</h2>
            <p className="mt-1 text-[13px] text-white/45">
              Body is sent as branded text email. HTML is intentionally not accepted here.
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

        <TableShell>
          <div
            className="grid gap-4 border-b border-white/10 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45"
            style={{ gridTemplateColumns: "1.5fr 0.8fr 0.7fr 0.8fr 1fr" }}
          >
            <div>Campaign</div>
            <div>Audience</div>
            <div>Status</div>
            <div>Sends</div>
            <div></div>
          </div>

          {campaigns.length === 0 ? (
            <EmptyState title="No campaigns yet." hint="Create a draft, review the audience count, then send." />
          ) : (
            campaigns.map((campaign) => {
              const campaignSends = sendsByCampaign.get(campaign.id) ?? [];
              const audience = audienceFromJson(campaign.audience);
              const sent = campaignSends.filter((send) => send.status === "sent").length;
              const failed = campaignSends.filter((send) => send.status === "failed").length;
              const count = audienceCount(leads, audience);
              const canSend = campaign.status === "draft" || campaign.status === "failed";

              return (
                <div
                  key={campaign.id}
                  className="grid items-center gap-4 border-b border-white/5 px-5 py-4 text-[13.5px] last:border-0"
                  style={{ gridTemplateColumns: "1.5fr 0.8fr 0.7fr 0.8fr 1fr" }}
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-white/95">{campaign.subject}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                      {dateFmt.format(new Date(campaign.created_at))}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/75">{count} leads</div>
                    <div className="mt-1 text-[12px] text-white/40">{campaignAudienceLabel(audience)}</div>
                  </div>
                  <Badge tone={statusTones[campaign.status]}>{campaign.status}</Badge>
                  <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">
                    {sent} sent
                    {failed ? <span className="text-red-300"> / {failed} failed</span> : null}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {canSend ? (
                      <form action={sendCampaignAction}>
                        <input type="hidden" name="id" value={campaign.id} />
                        <Button type="submit" size="sm" disabled={count === 0}>
                          Send
                        </Button>
                      </form>
                    ) : null}
                    <form action={deleteCampaignAction}>
                      <input type="hidden" name="id" value={campaign.id} />
                      <Button type="submit" size="sm" variant="danger">
                        Del
                      </Button>
                    </form>
                  </div>
                </div>
              );
            })
          )}
        </TableShell>
      </section>
    </div>
  );
}
