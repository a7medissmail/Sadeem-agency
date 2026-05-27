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
  CATEGORY_DESCRIPTIONS,
  type ServiceCategory,
} from "@/lib/validation/service";

export const metadata = {
  title: "Services - SADEEM",
  description:
    "End-to-end strategic advisory across Strategy, Enablement, and Execution Support.",
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

const CATEGORY_ORDER: ServiceCategory[] = ["strategy", "enablement", "execution"];

export default async function ServicesPage() {
  const services = await loadServices();

  const byCategory = CATEGORY_ORDER.reduce(
    (acc, cat) => {
      acc[cat] = services.filter((s) => s.category === cat);
      return acc;
    },
    {} as Record<ServiceCategory, ServiceRow[]>,
  );

  const totalCount = services.length;

  return (
    <>
      <SectionAwareNavbar initialOverDark />
      <main className="page services-page">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="services-hero dark" data-section="01">
          <SectionLabel n="01" text="SERVICES" onDark />
          <div className="services-hero-bg" aria-hidden="true" />
          <div className="section-inner services-hero-inner">
            <div className="services-hero-copy">
              <p className="team-brief-kicker">WHAT WE DO</p>
              <h1 className="display services-hero-title">
                End-to-end advisory
                <br />
                <span className="accent">for lasting impact.</span>
              </h1>
              <p>
                We work across three connected disciplines — Strategy, Enablement, and
                Execution Support — to solve growth problems with clarity, structure,
                and discipline.{totalCount > 0 ? ` ${totalCount} services across the full growth lifecycle.` : ""}
              </p>
              <a href="#services-list" className="team-line-cta">
                <span>EXPLORE SERVICES</span>
              </a>
            </div>
          </div>
        </section>

        {/* ── Services by category ──────────────────────────────── */}
        <RevealSection
          className="services-list-page light"
          data-section="02"
          id="services-list"
        >
          <div className="section-inner">
            {CATEGORY_ORDER.map((cat, ci) => {
              const items = byCategory[cat];
              return (
                <div key={cat} className="services-category-block">
                  {/* Category header */}
                  <div className="services-category-header">
                    <div className="services-category-label-col">
                      <span className="services-category-letter">
                        {String.fromCharCode(65 + ci)}
                      </span>
                    </div>
                    <div className="services-category-header-body">
                      <p className="team-brief-kicker">
                        {CATEGORY_LABELS[cat].toUpperCase()}
                      </p>
                      <h2 className="services-category-title">
                        {CATEGORY_TAGLINES[cat]}
                      </h2>
                      <p className="services-category-desc">
                        {CATEGORY_DESCRIPTIONS[cat]}
                      </p>
                    </div>
                  </div>

                  {/* Service rows */}
                  {items.length > 0 ? (
                    <div className="services-row-list">
                      {items.map((service, i) => (
                        <Link
                          key={service.id}
                          href={`/services/${service.slug}`}
                          className="service-row"
                        >
                          <span className="service-row-index">
                            {String(ci * 6 + i + 1).padStart(2, "0")}
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
                  ) : (
                    <p className="services-category-empty">
                      Services coming soon.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </RevealSection>

        {/* ── Engagement models ────────────────────────────────── */}
        <RevealSection className="engagement-models dark" data-section="03">
          <SectionLabel n="03" text="HOW WE WORK" onDark />
          <div className="section-inner">
            <div className="engagement-head">
              <p className="team-brief-kicker on-dark">ENGAGEMENT MODELS</p>
              <h2>
                The right shape
                <br />
                <span className="accent">for every challenge.</span>
              </h2>
              <p className="engagement-head-sub">
                We don't offer a single engagement model. The right structure
                depends on what you're solving — and how quickly you need to move.
              </p>
            </div>
            <div className="engagement-grid">
              {[
                {
                  code: "01",
                  title: "Strategic Project",
                  meta: "One-off · Defined scope",
                  body: "A focused engagement with a defined deliverable and timeline. Ideal for specific growth challenges, market entries, launches, or restructuring work where you need expert input to move forward.",
                },
                {
                  code: "02",
                  title: "Diagnostic Engagement",
                  meta: "Assessment-first",
                  body: "A structured diagnostic that maps the real problem, surfaces root causes, and produces a prioritised roadmap. Designed for teams who need clarity before committing to a direction.",
                },
                {
                  code: "03",
                  title: "Workshop Sprint",
                  meta: "Session-based",
                  body: "One or more facilitated working sessions designed to align your team, resolve a strategic question, or produce a clear decision. High impact, low drag on operations.",
                },
                {
                  code: "04",
                  title: "Monthly Retainer",
                  meta: "Ongoing · 3–6 months",
                  body: "Continuous strategic partnership for businesses that are scaling, restructuring, or navigating sustained commercial complexity. We become part of the operating team.",
                },
              ].map((model) => (
                <div key={model.code} className="engagement-card">
                  <span className="engagement-card-code">{model.code}</span>
                  <h3>{model.title}</h3>
                  <span className="engagement-card-meta">{model.meta}</span>
                  <p>{model.body}</p>
                </div>
              ))}
            </div>
          </div>
        </RevealSection>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <RevealSection className="services-cta light" data-section="04">
          <div className="section-inner services-cta-inner">
            <div>
              <p className="team-brief-kicker">START A CONVERSATION</p>
              <h2>
                Tell us where
                <br />
                <span className="accent">you&apos;re heading.</span>
              </h2>
              <p>
                We work with a small number of clients at a time. Share a few
                details and the right person will reach out within 48 hours.
              </p>
            </div>
            <Link href="/consultation" className="cta-link dark">
              <span>BOOK A CONSULTATION</span>
              <Icon.Arrow />
            </Link>
          </div>
        </RevealSection>

      </main>
      <Footer />
    </>
  );
}
