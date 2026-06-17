import type { ReactNode } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import RevealSection from "./RevealSection";
import SectionLabel from "./SectionLabel";
import ServicesGrid from "./ServicesGrid";
import { Icon } from "./Icons";

type CategoryRow = {
  id: string;
  slug: string;
  label: string;
  tagline: string | null;
  description: string | null;
};

// Map category slugs (or slug fragments) to service icons.
// Falls back to Icon.Chart for any slug that doesn't match.
type IconFn = (props: { s?: number }) => React.ReactElement;

const ICON_MAP: { test: RegExp; icon: IconFn }[] = [
  { test: /strategy/i,   icon: Icon.Strategy   },
  { test: /growth|market|demand|sales/i, icon: Icon.Growth },
  { test: /ops|operat|execut|system/i,  icon: Icon.Ops    },
  { test: /transform|change|innovat/i,  icon: Icon.Transform },
  { test: /m.?a|merger|acqui/i,         icon: Icon.Merge  },
  { test: /enable|learn|train/i,        icon: Icon.Growth },
];

function iconFor(slug: string, label: string): IconFn {
  const haystack = `${slug} ${label}`;
  for (const { test, icon } of ICON_MAP) {
    if (test.test(haystack)) return icon;
  }
  return Icon.Chart;
}

// First sentence of a category description, used as the homepage card blurb.
function firstSentence(text: string | null | undefined): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^[\s\S]*?[.!?](?=\s|$)/);
  return (match ? match[0] : trimmed).trim();
}

async function loadCategories(): Promise<CategoryRow[]> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("service_categories")
      .select("id, slug, label, tagline, description")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function ServicesSection() {
  const categories = await loadCategories();

  // Fallback to the original static list if DB is empty (no migration run yet)
  const items: { icon: ReactNode; title: string; tagline: string; body: string; href: string }[] =
    categories.length > 0
      ? categories.map((cat) => {
          const Glyph = iconFor(cat.slug, cat.label);
          return {
            icon: <Glyph s={26} />,
            title: cat.label,
            tagline: cat.tagline ?? "",
            body:
              firstSentence(cat.description) ??
              cat.tagline ??
              "Advisory built for measurable outcomes.",
            href: `/services#${cat.slug}`,
          };
        })
      : [
          {
            icon: <Icon.Strategy s={26} />,
            title: "Strategy",
            tagline: "Clarity before action",
            body: "Find where growth is actually leaking, and the few moves that matter most.",
            href: "/services#strategy",
          },
          {
            icon: <Icon.Growth s={26} />,
            title: "Enablement",
            tagline: "Capability that compounds",
            body: "Build the team, systems, and operating rhythm that make the plan executable.",
            href: "/services#enablement",
          },
          {
            icon: <Icon.Ops s={26} />,
            title: "Execution Support",
            tagline: "Discipline that delivers",
            body: "Install the discipline that turns plans into shipped, measurable results.",
            href: "/services#execution",
          },
        ];

  return (
    <RevealSection className="services dark" data-section="05" id="services">
      <SectionLabel n="05" text="OUR SERVICES" onDark />
      <div className="dark-texture" aria-hidden="true" />
      <div className="section-inner">
        <div className="services-head">
          <div>
            <div className="section-eyebrow on-dark">OUR SERVICES</div>
            <h2 className="h2 on-dark">
              End-to-end advisory<br />
              for <span className="accent">lasting impact.</span>
            </h2>
          </div>
          <a className="cta-link on-dark" href="/services">
            <span>ALL SERVICES</span>
            <Icon.Arrow />
          </a>
        </div>
        <ServicesGrid items={items} />
      </div>
    </RevealSection>
  );
}
