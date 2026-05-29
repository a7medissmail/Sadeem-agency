export const revalidate = 300;

import Link from "next/link";
import Image from "next/image";
import { getSupabasePublic } from "@/lib/supabase/public";
import SectionAwareNavbar from "@/components/SectionAwareNavbar";
import Footer from "@/components/Footer";
import SectionLabel from "@/components/SectionLabel";
import RevealSection from "@/components/RevealSection";
import type { CourseCurrency } from "@/lib/validation/course";

type CourseIndexRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  location: string | null;
  starts_at: string | null;
  ends_at: string | null;
  capacity: number | null;
  price: number | null;
  currency: CourseCurrency | null;
  image_url: string | null;
};

export const metadata = {
  title: "Workshops - SADEEM",
  description: "Strategic growth workshops by SADEEM - Riyadh and beyond.",
};

async function loadCourses(): Promise<CourseIndexRow[]> {
  try {
    const supabase = getSupabasePublic();
    const { data, error } = await supabase
      .from("courses")
      .select("id, slug, title, summary, location, starts_at, ends_at, capacity, price, currency, image_url")
      .eq("is_active", true)
      .order("starts_at", { ascending: true, nullsFirst: false });
    if (!error) return data ?? [];

    const fallback = await supabase
      .from("courses")
      .select("id, slug, title, summary, location, starts_at, ends_at, capacity, price, image_url")
      .eq("is_active", true)
      .order("starts_at", { ascending: true, nullsFirst: false });

    if (fallback.error) return [];
    return (fallback.data ?? []).map((course) => ({ ...course, currency: "SAR" as CourseCurrency }));
  } catch {
    return [];
  }
}

function formatDateRange(starts: string | null, ends: string | null) {
  if (!starts) return null;
  const fmt = new Intl.DateTimeFormat("en", { dateStyle: "medium" });
  const start = fmt.format(new Date(starts));
  if (!ends) return start;
  const end = fmt.format(new Date(ends));
  return start === end ? start : `${start} -> ${end}`;
}

function formatPrice(price: number | null, currency: CourseCurrency | null) {
  if (price == null) return null;
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency ?? "SAR",
    currencyDisplay: "code",
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
    maximumFractionDigits: Number.isInteger(price) ? 0 : 2,
  }).format(price);
}

export default async function CoursesIndex() {
  const courses = await loadCourses();

  return (
    <>
      <SectionAwareNavbar initialOverDark={false} />
      <main className="page">
        <section className="courses-hero light" data-section="01">
          <SectionLabel n="01" text="WORKSHOPS" />
          <div className="section-inner courses-hero-inner">
            <div className="section-eyebrow">COURSES &amp; WORKSHOPS</div>
            <h1 className="display courses-hero-title">
              Sharpen the<br />
              <span className="accent">operating system.</span>
            </h1>
            <p className="body courses-hero-body">
              In-person workshops for founders and operators. Small cohorts. Pragmatic frameworks. Designed to
              compound in your own business - not slide deck theatre.
            </p>
          </div>
        </section>

        <RevealSection className="courses-list light" data-section="02">
          <div className="section-inner">
            {courses.length === 0 ? (
              <div className="courses-empty">
                <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-black/40">
                  NO UPCOMING WORKSHOPS
                </p>
                <h2 className="h2" style={{ marginTop: 16 }}>
                  New cohort opening soon.
                </h2>
                <p className="body" style={{ marginTop: 12 }}>
                  Drop a note and we&apos;ll let you know the moment dates are announced.
                </p>
                <Link className="cta-link dark" href="/#contact" style={{ marginTop: 24, display: "inline-flex" }}>
                  <span>GET ON THE LIST</span>
                </Link>
              </div>
            ) : (
              <div className="courses-grid">
                {courses.map((course) => {
                  const dateRange = formatDateRange(course.starts_at, course.ends_at);
                  const price = formatPrice(course.price, course.currency);

                  return (
                    <Link key={course.id} href={`/courses/${course.slug}`} className="course-card">
                      <div className="course-card-image">
                        {course.image_url ? (
                          <Image src={course.image_url} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" />
                        ) : (
                          <div className="course-card-fallback" />
                        )}
                      </div>
                      <div className="course-card-body">
                        <div className="course-card-meta">
                          {course.location ? <span>{course.location}</span> : null}
                          {dateRange ? <span>{dateRange}</span> : null}
                          {price ? <span>{price}</span> : null}
                        </div>
                        <h3 className="course-card-title">{course.title}</h3>
                        {course.summary ? <p className="course-card-summary">{course.summary}</p> : null}
                        <span className="course-card-link">
                          VIEW DETAILS →
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
