import { z } from "zod";

export const SERVICE_CATEGORIES = ["strategy", "enablement", "execution"] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  strategy:   "Strategy",
  enablement: "Enablement",
  execution:  "Execution Support",
};

export const CATEGORY_TAGLINES: Record<ServiceCategory, string> = {
  strategy:   "Clarity before action",
  enablement: "Capability that compounds",
  execution:  "Discipline that delivers",
};

export const CATEGORY_DESCRIPTIONS: Record<ServiceCategory, string> = {
  strategy:
    "The decisions you make before you act determine everything that follows. We bring clarity to the questions that matter most — which markets to pursue, where you're genuinely differentiated, and what a growth strategy that the whole team can execute actually looks like.",
  enablement:
    "Strategy only works when the people, systems, and tools behind it are ready to execute. We build the internal capability — structure, skills, frameworks, and operating rhythm — that makes your direction stick beyond the planning room.",
  execution:
    "Most growth plans stall not from poor strategy, but from execution that loses focus. We stay close to the work — providing strategic oversight, commercial tools, and the coordination discipline that keeps the plan moving and measurable.",
};

export const serviceSchema = z.object({
  slug:        z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  title:       z.string().min(1).max(120),
  category:    z.enum(SERVICE_CATEGORIES),
  tagline:     z.string().max(160).nullish(),
  intro:       z.string().max(1200).nullish(),
  body:        z.string().max(8000).nullish(),
  deliverables:z.array(z.string().max(200)).max(12).optional(),
  icon_key:    z.string().max(40).nullish(),
  sort_order:  z.number().int().min(0).max(999).optional(),
  is_published:z.boolean().optional(),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
