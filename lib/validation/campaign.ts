import { z } from "zod";
import type { LeadSource, LeadStatus } from "@/types/database";

export const campaignLeadStatuses = ["new", "contacted", "qualified", "won", "lost"] as const satisfies readonly LeadStatus[];
export const campaignLeadSources = ["homepage", "course", "consultation", "other"] as const satisfies readonly LeadSource[];

const asString = (value: unknown) => (value == null ? "" : value);

const optionalStatus = z
  .preprocess(asString, z.string())
  .transform((value) => value.trim())
  .refine((value) => value === "" || campaignLeadStatuses.includes(value as LeadStatus), "Invalid lead status")
  .transform((value) => (value ? (value as LeadStatus) : null));

const optionalSource = z
  .preprocess(asString, z.string())
  .transform((value) => value.trim())
  .refine((value) => value === "" || campaignLeadSources.includes(value as LeadSource), "Invalid lead source")
  .transform((value) => (value ? (value as LeadSource) : null));

export const campaignSchema = z.object({
  subject: z
    .preprocess(asString, z.string())
    .transform((value) => value.trim())
    .pipe(z.string().min(4, "Subject is required").max(140, "Subject must be 140 characters or fewer")),
  body: z
    .preprocess(asString, z.string())
    .transform((value) => value.trim())
    .pipe(z.string().min(20, "Body must be at least 20 characters").max(8000, "Body is too long")),
  status: optionalStatus,
  source: optionalSource,
});

export type CampaignInput = z.infer<typeof campaignSchema>;

export type CampaignAudience = {
  status?: LeadStatus | null;
  source?: LeadSource | null;
};

export function campaignAudienceLabel(audience: CampaignAudience | null | undefined) {
  const parts = [
    audience?.status ? `status: ${audience.status}` : null,
    audience?.source ? `source: ${audience.source}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" / ") : "all eligible leads";
}
