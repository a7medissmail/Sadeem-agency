import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * The homepage is assembled from this registry rather than a hardcoded JSX list,
 * so sections can be switched off or reordered from the admin without the
 * editorial numbering (01, 02, 03 …) drifting — the number is derived from the
 * position among *enabled* sections, never stored.
 *
 * The registry is the source of truth for which keys exist. The DB only stores
 * `enabled` and `sort_order`, so adding a section here ships it enabled by
 * default and removing one here makes any stale DB row inert.
 */
export type HomeSectionKey =
  | "hero"
  | "about"
  | "problem"
  | "approach"
  | "services"
  | "why"
  | "fit"
  | "faq"
  | "cases"
  | "clients"
  | "final-cta"
  | "contact";

export type HomeSectionMeta = {
  key: HomeSectionKey;
  /** Shown in the admin list. */
  label: string;
  /** Background treatment — the page reads as an alternating light/dark rhythm. */
  tone: "light" | "dark";
  /** Anchor id, when the section is linkable from the navbar. */
  anchor?: string;
  /** Cannot be switched off — the page needs a hero. */
  locked?: boolean;
  /** One-line note in the admin so the choice is obvious. */
  hint: string;
};

export const HOME_SECTION_REGISTRY: HomeSectionMeta[] = [
  { key: "hero", label: "Hero", tone: "dark", locked: true, hint: "Rotating headline slider" },
  { key: "about", label: "About SADEEM", tone: "light", anchor: "about", hint: "Who we are + stats" },
  { key: "problem", label: "The Problem", tone: "dark", anchor: "problem", hint: "The pain we name" },
  { key: "approach", label: "Our Approach", tone: "light", anchor: "approach", hint: "The operating framework" },
  { key: "services", label: "Our Services", tone: "dark", anchor: "services", hint: "Service pillars" },
  { key: "why", label: "Why SADEEM", tone: "light", hint: "Four operating principles" },
  { key: "fit", label: "Who It's For", tone: "dark", anchor: "fit", hint: "Qualifies the visitor" },
  { key: "faq", label: "FAQ", tone: "light", anchor: "faq", hint: "Objection handling" },
  { key: "cases", label: "Success Stories", tone: "dark", anchor: "cases", hint: "Case study cards" },
  { key: "clients", label: "Clients", tone: "light", hint: "Partner logo wall" },
  { key: "final-cta", label: "Final CTA", tone: "dark", hint: "Closing call to action" },
  { key: "contact", label: "Get In Touch", tone: "light", anchor: "contact", hint: "Lead form" },
];

export type ResolvedHomeSection = HomeSectionMeta & {
  enabled: boolean;
  sortOrder: number;
  /** "01", "02" … assigned across enabled sections only. Null when disabled. */
  number: string | null;
};

type HomeSectionRow = { key: string; enabled: boolean; sort_order: number };

/**
 * Merges the stored layout onto the registry. Unknown keys in the DB are
 * ignored; registry entries with no row fall back to enabled, in registry order.
 */
export function resolveHomeSections(rows: HomeSectionRow[]): ResolvedHomeSection[] {
  const stored = new Map(rows.map((row) => [row.key, row]));

  const merged = HOME_SECTION_REGISTRY.map((meta, index) => {
    const row = stored.get(meta.key);
    return {
      ...meta,
      enabled: meta.locked ? true : row?.enabled ?? true,
      sortOrder: row?.sort_order ?? (index + 1) * 10,
    };
  }).sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));

  let visible = 0;
  return merged.map((section) => ({
    ...section,
    number: section.enabled ? String((visible += 1)).padStart(2, "0") : null,
  }));
}

export async function getHomeSectionLayout(): Promise<ResolvedHomeSection[]> {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("home_sections")
      .select("key, enabled, sort_order")
      .order("sort_order", { ascending: true });

    if (error || !data) return resolveHomeSections([]);
    return resolveHomeSections(data);
  } catch {
    // Table missing (migration not pushed) — ship the full default homepage.
    return resolveHomeSections([]);
  }
}
