import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { ClientPartnerRole, Database } from "@/types/database";

export type PublicClientSection = {
  eyebrow: string;
  metaAccent: string;
  metaValue: string;
  foot: string;
  ndaCount: number;
  ndaLabel: string;
};

export type PublicClientPartner = {
  id: string;
  name: string;
  caption: string | null;
  logoUrl: string;
  role: ClientPartnerRole;
};

export const defaultClientSection: PublicClientSection = {
  eyebrow: "TRUSTED BY AMBITIOUS OPERATORS",
  metaAccent: "8 engagements",
  metaValue: "2019 — 2026",
  foot: "Hover any logo for context. Most engagements run 90 days; the longest, six years.",
  ndaCount: 14,
  ndaLabel: "other operators\nunder NDA",
};

type SectionRow = Database["public"]["Tables"]["client_section"]["Row"];
type PartnerRow = Database["public"]["Tables"]["client_partners"]["Row"];

function toPartner(row: PartnerRow): PublicClientPartner {
  return {
    id: row.id,
    name: row.name,
    caption: row.caption,
    logoUrl: row.logo_url,
    role: row.role,
  };
}

export async function getPublicClientSection(): Promise<{
  section: PublicClientSection;
  anchor: PublicClientPartner | null;
  grid: PublicClientPartner[];
}> {
  try {
    const admin = getSupabaseAdmin();
    const [sectionResult, partnersResult] = await Promise.all([
      admin.from("client_section").select("*").eq("id", true).maybeSingle(),
      admin
        .from("client_partners")
        .select("id, name, caption, logo_url, role, sort_order, is_active, created_at, updated_at")
        .eq("is_active", true)
        .order("role", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

    const section: PublicClientSection = sectionResult.data
      ? {
          eyebrow: (sectionResult.data as SectionRow).eyebrow || defaultClientSection.eyebrow,
          metaAccent: (sectionResult.data as SectionRow).meta_accent || defaultClientSection.metaAccent,
          metaValue: (sectionResult.data as SectionRow).meta_value || defaultClientSection.metaValue,
          foot: (sectionResult.data as SectionRow).foot || defaultClientSection.foot,
          ndaCount: (sectionResult.data as SectionRow).nda_count ?? defaultClientSection.ndaCount,
          ndaLabel: (sectionResult.data as SectionRow).nda_label || defaultClientSection.ndaLabel,
        }
      : defaultClientSection;

    const rows = (partnersResult.data ?? []) as PartnerRow[];
    const anchorRow = rows.find((row) => row.role === "anchor") ?? null;
    const gridRows = rows.filter((row) => row.role === "grid");

    return {
      section,
      anchor: anchorRow ? toPartner(anchorRow) : null,
      grid: gridRows.map(toPartner),
    };
  } catch {
    return { section: defaultClientSection, anchor: null, grid: [] };
  }
}
