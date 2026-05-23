import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import MainNavbar from "@/components/MainNavbar";
import Footer from "@/components/Footer";
import SectionLabel from "@/components/SectionLabel";
import RevealSection from "@/components/RevealSection";
import LeadForm from "@/components/LeadForm";

type Props = { params: { slug: string } };

async function loadCourse(slug: string) {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("courses")
      .select("id, slug, title, summary, body, location, starts_at, ends_at, capacity, price, image_url")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const course = await loadCourse(params.slug);
  if (!course) return { title: "Workshop — SADEEM" };
  return {
    title: `${course.title} — SADEEM Workshops`,
    description: course.summary ?? undefined,
  };
}

function formatDateRange(starts: string | null, ends: string | null) {
  if (!starts) return null;
  const fmt = new Intl.DateTimeFormat("en", { dateStyle: "long" });
  const s = fmt.format(new Date(starts));
  if (!ends) return s;
  const e = fmt.format(new Date(ends));
  return s === e ? s : `${s} – ${e}`;
}

export default async function CourseDetail({ params }: Props) {
  const course = await loadCourse(params.slug);
  if (!course) notFound();

  const dateRange = formatDateRange(course.starts_at, course.ends_at);

  return (
    <>
      <MainNavbar overDark={false} />
      <main className="page">
        <RevealSection className="course-detail light" data-section="01">
          <SectionLabel n="01" text="WORKSHOP" />
          <div className="section-inner course-detail-grid">
            <div className="course-detail-copy">
              <Link href="/courses" className="course-detail-back">
                ← All workshops
              </Link>
              <div className="section-eyebrow" style={{ marginTop: 12 }}>WORKSHOP</div>
              <h1 className="display course-detail-title">{course.title}</h1>
              {course.summary ? <p className="lede course-detail-lede">{course.summary}</p> : null}

              <ul className="course-detail-meta">
                {dateRange ? (
                  <li>
                    <span>When</span>
                    <span>{dateRange}</span>
                  </li>
                ) : null}
                {course.location ? (
                  <li>
                    <span>Where</span>
                    <span>{course.location}</span>
                  </li>
                ) : null}
                {course.capacity != null ? (
                  <li>
                    <span>Cohort</span>
                    <span>Up to {course.capacity} participants</span>
                  </li>
                ) : null}
                {course.price != null ? (
                  <li>
                    <span>Investment</span>
                    <span>SAR {course.price.toLocaleString()}</span>
                  </li>
                ) : null}
              </ul>
            </div>

            <div className="course-detail-image">
              {course.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={course.image_url} alt="" />
              ) : (
                <div className="course-detail-image-fallback" />
              )}
            </div>
          </div>
        </RevealSection>

        {course.body ? (
          <RevealSection className="course-body light" data-section="02">
            <div className="section-inner course-body-inner">
              <div className="section-eyebrow">ABOUT THE WORKSHOP</div>
              <div className="course-body-text">
                {course.body.split(/\n\n+/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          </RevealSection>
        ) : null}

        <RevealSection className="contact light" data-section="03" id="register">
          <SectionLabel n="03" text="REGISTER INTEREST" />
          <div className="section-inner contact-grid">
            <div className="contact-copy">
              <div className="section-eyebrow">REGISTER INTEREST</div>
              <h2 className="h2">
                Reserve your seat<br />
                in <span className="accent">this cohort.</span>
              </h2>
              <p className="body">
                Cohorts are small and fill quickly. Share a few details and we&apos;ll confirm your spot —
                or add you to the waitlist for the next one.
              </p>
              <ul className="contact-meta">
                {dateRange ? (
                  <li><span>When</span><span>{dateRange}</span></li>
                ) : null}
                {course.location ? (
                  <li><span>Where</span><span>{course.location}</span></li>
                ) : null}
                <li><span>Reach</span><a href="mailto:hello@sadeem.co">hello@sadeem.co</a></li>
              </ul>
            </div>
            <div className="contact-form">
              <LeadForm source="course" />
            </div>
          </div>
        </RevealSection>
      </main>
      <Footer />
    </>
  );
}
