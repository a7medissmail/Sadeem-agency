import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import MainNavbar from "@/components/MainNavbar";
import Footer from "@/components/Footer";
import SectionLabel from "@/components/SectionLabel";
import RevealSection from "@/components/RevealSection";

export const metadata = {
  title: "Workshops — SADEEM",
  description: "Strategic growth workshops by SADEEM — Riyadh and beyond.",
};

async function loadCourses() {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("courses")
      .select("id, slug, title, summary, location, starts_at, ends_at, capacity, price, image_url")
      .eq("is_active", true)
      .order("starts_at", { ascending: true, nullsFirst: false });
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

function formatDateRange(starts: string | null, ends: string | null) {
  if (!starts) return null;
  const fmt = new Intl.DateTimeFormat("en", { dateStyle: "medium" });
  const s = fmt.format(new Date(starts));
  if (!ends) return s;
  const e = fmt.format(new Date(ends));
  return s === e ? s : `${s} → ${e}`;
}

export default async function CoursesIndex() {
  const courses = await loadCourses();

  return (
    <>
      <MainNavbar overDark={false} />
      <main className="page">
        <RevealSection className="courses-hero light" data-section="01">
          <SectionLabel n="01" text="WORKSHOPS" />
          <div className="section-inner courses-hero-inner">
            <div className="section-eyebrow">COURSES &amp; WORKSHOPS</div>
            <h1 className="display courses-hero-title">
              Sharpen the<br />
              <span className="accent">operating system.</span>
            </h1>
            <p className="body courses-hero-body">
              In-person workshops for founders and operators. Small cohorts. Pragmatic frameworks.
              Designed to compound in your own business — not slide deck theatre.
            </p>
          </div>
        </RevealSection>

        <RevealSection className="courses-list light" data-section="02">
          <div className="section-inner">
            {courses.length === 0 ? (
              <div className="courses-empty">
                <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-black/40">
                  NO UPCOMING WORKSHOPS
                </p>
                <h2 className="h2" style={{ marginTop: 16 }}>New cohort opening soon.</h2>
                <p className="body" style={{ marginTop: 12 }}>
                  Drop a note and we&apos;ll let you know the moment dates are announced.
                </p>
                <Link className="cta-link dark" href="/#contact" style={{ marginTop: 24, display: "inline-flex" }}>
                  <span>GET ON THE LIST</span>
                  <span aria-hidden>→</span>
                </Link>
              </div>
            ) : (
              <div className="courses-grid">
                {courses.map((c) => {
                  const dateRange = formatDateRange(c.starts_at, c.ends_at);
                  return (
                    <Link key={c.id} href={`/courses/${c.slug}`} className="course-card">
                      <div className="course-card-image">
                        {c.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.image_url} alt="" loading="lazy" />
                        ) : (
                          <div className="course-card-fallback" />
                        )}
                      </div>
                      <div className="course-card-body">
                        <div className="course-card-meta">
                          {c.location ? <span>{c.location}</span> : null}
                          {dateRange ? <span>{dateRange}</span> : null}
                        </div>
                        <h3 className="course-card-title">{c.title}</h3>
                        {c.summary ? <p className="course-card-summary">{c.summary}</p> : null}
                        <span className="course-card-link">
                          VIEW DETAILS <span aria-hidden>→</span>
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </RevealSection>
      </main>
      <Footer />
    </>
  );
}
