export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SectionAwareNavbar from "@/components/SectionAwareNavbar";
import Footer from "@/components/Footer";
import RevealSection from "@/components/RevealSection";
import SectionLabel from "@/components/SectionLabel";
import { Icon } from "@/components/Icons";

type ServiceDetail = {
  id: string;
  slug: string;
  title: string;
  category: string;
  tagline: string | null;
  intro: string | null;
  body: string | null;
  deliverables: string[];
  icon_key: string | null;
  sort_order: number;
};

type RelatedService = {
  slug: string;
  title: string;
  tagline: string | null;
};

type CategoryInfo = {
  label: string;
  tagline: string | null;
  description: string | null;
};

async function loadService(slug: string): Promise<ServiceDetail | null> {
  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("services")
      .select("id, slug, title, category, tagline, intro, body, deliverables, icon_key, sort_order")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();
    if (!data) return null;
    return { ...data, deliverables: (data.deliverables as string[]) ?? [] };
  } catch {
    return null;
  }
}

async function loadRelated(service: ServiceDetail): Promise<RelatedService[]> {
  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("services")
      .select("slug, title, tagline")
      .eq("is_published", true)
      .eq("category", service.category)
      .neq("slug", service.slug)
      .order("sort_order", { ascending: true })
      .limit(4);
    return (data ?? []) as RelatedService[];
  } catch {
    return [];
  }
}

async function loadCategoryInfo(slug: string): Promise<CategoryInfo | null> {
  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("service_categories")
      .select("label, tagline, description")
      .eq("slug", slug)
      .single();
    return data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const service = await loadService(params.slug);
  if (!service) return {};
  return {
    title: `${service.title} — SADEEM`,
    description: service.tagline ?? service.intro ?? undefined,
  };
}

export default async function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const service = await loadService(params.slug);
  if (!service) notFound();

  const [related, catInfo] = await Promise.all([
    loadRelated(service),
    loadCategoryInfo(service.category),
  ]);

  const categoryLabel   = catInfo?.label   ?? service.category;
  const categoryTagline = catInfo?.tagline  ?? "";
  const categoryDesc    = catInfo?.description ?? "";

  return (
    <>
      <SectionAwareNavbar initialOverDark />
      <main className="page service-detail-page">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="service-hero dark" data-section="01">
          <SectionLabel n="01" text="SERVICE" onDark />
          <div className="service-hero-bg" aria-hidden="true" />
          <div className="section-inner service-hero-inner">
            <div className="service-hero-copy">
              <nav className="service-breadcrumb" aria-label="Breadcrumb">
                <Link href="/services">All services</Link>
                <span aria-hidden>·</span>
                <span>{categoryLabel}</span>
              </nav>
              {categoryTagline && (
                <p className="team-brief-kicker on-dark">{categoryTagline.toUpperCase()}</p>
              )}
              <h1 className="display service-hero-title">{service.title}</h1>
              {service.tagline && (
                <p className="service-hero-tagline">{service.tagline}</p>
              )}
              <a href="#service-body" className="team-line-cta">
                <span>READ MORE</span>
              </a>
            </div>
          </div>
        </section>

        {/* ── Body ─────────────────────────────────────────────── */}
        <RevealSection
          className="service-body light"
          data-section="02"
          id="service-body"
        >
          <div className="section-inner service-body-grid">

            {/* Main content */}
            <div className="service-body-main">

              {service.intro ? (
                <div className="service-intro">
                  {service.intro.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              ) : categoryDesc ? (
                /* Fallback intro from category description */
                <div className="service-intro">
                  <p>{categoryDesc}</p>
                </div>
              ) : null}

              {service.body && (
                <div
                  className="service-body-rich"
                  dangerouslySetInnerHTML={{ __html: service.body }}
                />
              )}

              {service.deliverables.length > 0 && (
                <div className="service-deliverables">
                  <p className="team-brief-kicker">WHAT THIS COVERS</p>
                  <ul>
                    {service.deliverables.map((item, i) => (
                      <li key={i}>
                        <span aria-hidden>—</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="service-body-cta-row">
                <Link href="/consultation" className="cta-link dark">
                  <span>BOOK A CONSULTATION</span>
                  <Icon.Arrow />
                </Link>
                <Link href="/services" className="service-back-link">
                  ← All services
                </Link>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="service-sidebar">
              <div className="service-sidebar-card">
                <p className="team-brief-kicker">CATEGORY</p>
                <strong>{categoryLabel}</strong>
                {categoryTagline && <p>{categoryTagline}</p>}
              </div>

              {related.length > 0 && (
                <div className="service-sidebar-related">
                  <p className="team-brief-kicker">MORE IN {categoryLabel.toUpperCase()}</p>
                  <ul>
                    {related.slice(0, 3).map((r) => (
                      <li key={r.slug}>
                        <Link href={`/services/${r.slug}`}>
                          <span>{r.title}</span>
                          {r.tagline && <em>{r.tagline}</em>}
                          <Icon.Arrow />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="service-sidebar-cta">
                <p>
                  Ready to explore this service with us?
                </p>
                <Link href="/consultation" className="cta-link on-dark">
                  <span>START A CONVERSATION</span>
                  <Icon.Arrow />
                </Link>
              </div>
            </aside>

          </div>
        </RevealSection>

        {/* ── Related (full-width dark) ─────────────────────────── */}
        {related.length > 0 && (
          <RevealSection className="service-related dark" data-section="03">
            <SectionLabel n="03" text="MORE SERVICES" onDark />
            <div className="section-inner">
              <div className="service-related-head">
                <p className="team-brief-kicker on-dark">
                  MORE IN {categoryLabel.toUpperCase()}
                </p>
                <Link href="/services" className="cta-link on-dark sm">
                  <span>ALL SERVICES</span>
                  <Icon.Arrow />
                </Link>
              </div>
              <div className="service-related-list">
                {related.map((r) => (
                  <Link key={r.slug} href={`/services/${r.slug}`} className="service-related-row">
                    <span className="service-related-main">
                      <span className="service-related-title">{r.title}</span>
                      {r.tagline && (
                        <span className="service-related-tagline">{r.tagline}</span>
                      )}
                    </span>
                    <span className="service-related-arrow" aria-hidden>
                      <Icon.Arrow />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </RevealSection>
        )}

      </main>
      <Footer />
    </>
  );
}
