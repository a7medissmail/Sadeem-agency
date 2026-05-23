import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SectionAwareNavbar from "@/components/SectionAwareNavbar";
import Footer from "@/components/Footer";
import SectionLabel from "@/components/SectionLabel";
import RevealSection from "@/components/RevealSection";
import CourseRegistrationForm from "@/components/CourseRegistrationForm";
import CourseBodyParallax from "@/components/CourseBodyParallax";
import { sanitizeCourseHtml } from "@/lib/content/sanitizeCourseHtml";
import type { CourseCurrency } from "@/lib/validation/course";

type Props = { params: { slug: string } };

type CourseDetailRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body: string | null;
  location: string | null;
  starts_at: string | null;
  ends_at: string | null;
  capacity: number | null;
  price: number | null;
  currency: CourseCurrency;
  image_url: string | null;
};

const COURSE_COLUMNS =
  "id, slug, title, summary, body, location, starts_at, ends_at, capacity, price, currency, image_url";

async function loadCourse(slug: string): Promise<CourseDetailRow | null> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("courses")
      .select(COURSE_COLUMNS)
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (!error && data) return data;

    const fallback = await supabase
      .from("courses")
      .select("id, slug, title, summary, body, location, starts_at, ends_at, capacity, price, image_url")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (fallback.error || !fallback.data) return null;
    return { ...fallback.data, currency: "SAR" };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const course = await loadCourse(params.slug);
  if (!course) return { title: "Workshop - SADEEM" };
  return {
    title: `${course.title} - SADEEM Workshops`,
    description: course.summary ?? undefined,
  };
}

function formatDateRange(starts: string | null, ends: string | null) {
  if (!starts) return null;
  const fmt = new Intl.DateTimeFormat("en", { dateStyle: "long" });
  const start = fmt.format(new Date(starts));
  if (!ends) return start;
  const end = fmt.format(new Date(ends));
  return start === end ? start : `${start} - ${end}`;
}

function formatPrice(price: number | null, currency: CourseCurrency) {
  if (price == null) return null;
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
    maximumFractionDigits: Number.isInteger(price) ? 0 : 2,
  }).format(price);
}

export default async function CourseDetail({ params }: Props) {
  const course = await loadCourse(params.slug);
  if (!course) notFound();

  const dateRange = formatDateRange(course.starts_at, course.ends_at);
  const price = formatPrice(course.price, course.currency);
  const bodyHtml = sanitizeCourseHtml(course.body);

  return (
    <>
      <SectionAwareNavbar initialOverDark />
      <main className="page course-page">
        <RevealSection className="course-detail dark" data-section="01">
          <SectionLabel n="01" text="WORKSHOP" onDark />
          <div className="section-inner course-detail-grid">
            <div className="course-detail-copy">
              <Link href="/courses" className="course-detail-back">
                All workshops
              </Link>
              <p className="course-detail-kicker">COHORT DOSSIER</p>
              <h1 className="display course-detail-title">{course.title}</h1>
              {course.summary ? <p className="course-detail-lede">{course.summary}</p> : null}

              <div className="course-detail-actions">
                <a href="#reserve" className="course-detail-primary">
                  Reserve interest
                </a>
                <span>{course.capacity ? `${course.capacity} seats max` : "Small cohort"}</span>
              </div>
            </div>

            <div className="course-detail-visual">
              <div className="course-detail-image">
                {course.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.image_url} alt="" />
                ) : (
                  <div className="course-detail-image-fallback" />
                )}
              </div>
            </div>
          </div>

          <div className="section-inner course-detail-facts" aria-label="Workshop details">
            {dateRange ? (
              <div>
                <span>When</span>
                <strong>{dateRange}</strong>
              </div>
            ) : null}
            {course.location ? (
              <div>
                <span>Where</span>
                <strong>{course.location}</strong>
              </div>
            ) : null}
            {course.capacity != null ? (
              <div>
                <span>Cohort</span>
                <strong>Up to {course.capacity} participants</strong>
              </div>
            ) : null}
            {price ? (
              <div>
                <span>Investment</span>
                <strong>{price}</strong>
              </div>
            ) : null}
          </div>
        </RevealSection>

        <RevealSection className="course-body light" data-section="02">
          <div className="section-inner course-body-grid">
            <div className="course-body-sticky">
              <p className="course-section-kicker">ABOUT THE WORKSHOP</p>
              <h2 className="course-body-title">A working room, not a lecture hall.</h2>
            </div>
            <div className="course-body-text">
              {bodyHtml ? (
                <CourseBodyParallax html={bodyHtml} />
              ) : (
                <p>
                  This workshop is built around practical diagnosis, structured decisions, and focused execution for
                  the cohort in the room.
                </p>
              )}
            </div>
          </div>
        </RevealSection>

        <RevealSection className="course-register dark" data-section="03" id="reserve">
          <SectionLabel n="03" text="SEAT REQUEST" onDark />
          <div className="section-inner course-register-grid">
            <div className="course-register-copy">
              <p className="course-section-kicker">REGISTER INTEREST</p>
              <h2>
                Request a seat in<br />
                <span>this cohort.</span>
              </h2>
              <p>
                Share the business context behind your request. The team will confirm availability, fit, and the next
                step for joining the cohort.
              </p>

              <div className="course-register-pass">
                <div>
                  <span>Workshop</span>
                  <strong>{course.title}</strong>
                </div>
                {dateRange ? (
                  <div>
                    <span>Dates</span>
                    <strong>{dateRange}</strong>
                  </div>
                ) : null}
                {price ? (
                  <div>
                    <span>Investment</span>
                    <strong>{price}</strong>
                  </div>
                ) : null}
              </div>
            </div>

            <CourseRegistrationForm courseTitle={course.title} dateRange={dateRange} />
          </div>
        </RevealSection>
      </main>
      <Footer />
    </>
  );
}
