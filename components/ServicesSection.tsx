import { createSupabaseServerClient } from "@/lib/supabase/server";
import RevealSection from "./RevealSection";
import SectionLabel from "./SectionLabel";
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
  const items: { Glyph: IconFn; title: string; body: string; href: string }[] =
    categories.length > 0
      ? categories.map((cat) => ({
          Glyph: iconFor(cat.slug, cat.label),
          title: cat.label,
          body: cat.tagline ?? cat.description ?? "Advisory built for measurable outcomes.",
          href: `/services#${cat.slug}`,
        }))
      : [
          { Glyph: Icon.Strategy, title: "Strategy",           body: "Clarity before action.",      href: "/services#strategy" },
          { Glyph: Icon.Growth,   title: "Enablement",         body: "Capability that compounds.",  href: "/services#enablement" },
          { Glyph: Icon.Ops,      title: "Execution Support",  body: "Discipline that delivers.",   href: "/services#execution" },
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
        <div className="services-grid">
          {items.map((it, i) => (
            <a className="s-card" key={it.href + i} href={it.href}>
              <div className="s-card-index">0{i + 1}</div>
              <div className="s-card-icon">
                <it.Glyph s={26} />
              </div>
              <h3 className="s-card-title">{it.title}</h3>
              <p className="s-card-body">{it.body}</p>
              <div className="s-card-arrow">
                <Icon.Arrow />
              </div>
            </a>
          ))}
        </div>
      </div>
    </RevealSection>
  );
}
