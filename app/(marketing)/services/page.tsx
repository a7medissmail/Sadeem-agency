export const dynamic = "force-dynamic";

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SectionAwareNavbar from "@/components/SectionAwareNavbar";
import Footer from "@/components/Footer";
import RevealSection from "@/components/RevealSection";
import SectionLabel from "@/components/SectionLabel";
import { Icon } from "@/components/Icons";
import {
  CATEGORY_LABELS,
  CATEGORY_TAGLINES,
  type ServiceCategory,
} from "@/lib/validation/service";

export const metadata = {
  title: "Services - SADEEM",
  description: "End-to-end strategic advisory across Strategy, Enablement, and Execution Support.",
};

type ServiceRow = {
  id: string;
  slug: string;
  title: string;
  category: ServiceCategory;
  tagline: string | null;
};

async function loadServices(): Promise<ServiceRow[]> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("services")
      .select("id, slug, title, category, tagline")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as ServiceRow[];
  } catch {
    return [];
  }
}

const CATEGORY_INDEX: Record<ServiceCategory, string> = {
  strategy:   "A",
  enablement: "B",
  execution:  "C",
};

export default async function ServicesPage() {
  const services = await loadServices();

  const categories: ServiceCategory[] = ["strategy", "enablement", "execution"];
  const byCategory = categories.reduce(
    (acc, cat) => {
      acc[cat] = services.filter((s) => s.category === cat);
      return acc;
    },
    {} as Record<ServiceCategory, ServiceRow[]>,
  );

  return (
    <>
      <SectionAwareNavbar initialOverDark />
      <main className="page services-page">

        {/* Hero */}
        <section className="services-hero dark" data-section="01">
          <SectionLabel n="01" text="SERVICES" onDark />
          <div className="services-hero-bg" aria-hidden="true" />
          <div className="section-inner services-hero-inner">
            <div>
              <p className="team-brief-kicker">WHAT WE DO</p>
              <h1 className="display services-hero-title">
                End-to-end advisory
                <br />
                <span className="accent">for lasting impact.</span>
              </h1>
              <p>
                We work across three connected disciplines — Strategy, Enablement, and Execution
                Support — to solve growth problems with clarity, structure, and discipline.
              </p>
              <a href="#services-list" className="team-line-cta">
                <span>EXPLORE SERVICES</span>
              </a>
            </div>
          </div>
        </section>

        {/* Services by category */}
        <RevealSection className="services-list-page light" data-section="02" id="services-list">
          <div className="section-inner">
            {categories.map((cat, ci) => {
              const items = byCategory[cat];
              if (!items.length) return null;
              return (
                <div key={cat} className="services-category-block">
                  <div className="services-category-header">
                    <span className="services-category-index">{CATEGORY_INDEX[cat]}</span>
                    <div>
                      <p className="team-brief-kicker">{CATEGORY_LABELS[cat].toUpperCase()}</p>
                      <h2>{CATEGORY_TAGLINES[cat]}</h2>
                    </div>
                  </div>

                  <div className="services-row-list">
                    {items.map((service, i) => (
                      <Link
                        key={service.id}
                        href={`/services/${service.slug}`}
                        className="service-row"
                      >
                        <span className="service-row-index">
                          {String(ci * 5 + i + 1).padStart(2, "0")}
                        </span>
                        <span className="service-row-main">
                          <strong>{service.title}</strong>
                          {service.tagline && <span>{service.tagline}</span>}
                        </span>
                        <span className="service-row-arrow" aria-hidden>
                          <Icon.Arrow />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </RevealSection>

        {/* Engagement models */}
        <RevealSection className="engagement-models dark" data-section="03">
          <SectionLabel n="03" text="HOW WE WORK" onDark />
          <div className="section-inner">
            <div className="engagement-head">
              <p className="team-brief-kicker">ENGAGEMENT MODELS</p>
              <h2>
                The right shape
                <br />
                <span className="accent">for every challenge.</span>
              </h2>
            </div>
            <div className="engagement-grid">
              {[
                {
                  code: "01",
                  title: "Strategic Project",
                  meta: "One-off / defined scope",
                  body: "A defined deliverable with a fixed timeline. Ideal for specific growth challenges, launches, or restructuring work.",
                },
                {
                  code: "02",
                  title: "Diagnostic Engagement",
                  meta: "Assessment-first",
                  body: "A structured review that maps problems, surfaces root causes, and produces a clear roadmap and recommendations.",
                },
                {
                  code: "03",
                  title: "Workshop Sprint",
                  meta: "Session-based",
                  body: "One or more focused working sessions to align teams, clarify strategy, or resolve a specific decision.",
                },
                {
                  code: "04",
                  title: "Monthly Retainer",
                  meta: "Ongoing · 3–6 months",
                  body: "Continuous strategic support for businesses that are scaling, restructuring, or navigating commercial complexity.",
                },
              ].map((model) => (
                <div key={model.code} className="engagement-card">
                  <div className="engagement-card-code">{model.code}</div>
                  <h3>{model.title}</h3>
                  <p className="engagement-card-meta">{model.meta}</p>
                  <p>{model.body}</p>
                </div>
              ))}
            </div>
          </div>
        </RevealSection>

        {/* CTA */}
        <RevealSection className="services-cta light" data-section="04">
          <div className="section-inner services-cta-inner">
            <div>
              <p className="team-brief-kicker">START A CONVERSATION</p>
              <h2>
                Tell us where
                <br />
                <span>you&apos;re heading.</span>
              </h2>
              <p>We work with a small number of teams at a time. Share a few details and the right person will reach out.</p>
            </div>
            <Link href="/#contact" className="cta-link dark">
              <span>GET IN TOUCH</span>
              <Icon.Arrow />
            </Link>
          </div>
        </RevealSection>

      </main>
      <Footer />
    </>
  );
}
