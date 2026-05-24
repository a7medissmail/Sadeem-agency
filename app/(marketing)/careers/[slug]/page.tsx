import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Footer from "@/components/Footer";
import JobApplicationForm from "@/components/JobApplicationForm";
import RevealSection from "@/components/RevealSection";
import SectionAwareNavbar from "@/components/SectionAwareNavbar";
import SectionLabel from "@/components/SectionLabel";
import { sanitizeCourseHtml } from "@/lib/content/sanitizeCourseHtml";
import type { JobType } from "@/types/database";

type Props = { params: { slug: string } };

type CareerDetailRow = {
  id: string;
  slug: string;
  title: string;
  type: JobType;
  department: string | null;
  location: string | null;
  body: string | null;
  requirements: string | null;
};

async function loadJob(slug: string): Promise<CareerDetailRow | null> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("jobs")
      .select("id, slug, title, type, department, location, body, requirements")
      .eq("slug", slug)
      .eq("is_open", true)
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const job = await loadJob(params.slug);
  if (!job) return { title: "Careers - SADEEM" };
  return {
    title: `${job.title} - SADEEM Careers`,
    description: job.department ?? "Open role at SADEEM",
  };
}

export default async function CareerDetailPage({ params }: Props) {
  const job = await loadJob(params.slug);
  if (!job) notFound();

  const bodyHtml = sanitizeCourseHtml(job.body);
  const requirementsHtml = sanitizeCourseHtml(job.requirements);

  return (
    <>
      <SectionAwareNavbar initialOverDark />
      <main className="page careers-page">
        <RevealSection className="career-detail dark" data-section="01">
          <SectionLabel n="01" text="ROLE" onDark />
          <div className="section-inner career-detail-grid">
            <div className="career-detail-copy">
              <Link href="/careers" className="course-detail-back">
                All roles
              </Link>
              <p className="course-detail-kicker">{job.type === "internship" ? "INTERNSHIP DOSSIER" : "ROLE DOSSIER"}</p>
              <h1 className="display career-detail-title">{job.title}</h1>
              <p className="career-detail-lede">
                Join the room where strategy, operations, and growth decisions become real work.
              </p>
              <a href="#apply" className="course-detail-primary">
                Apply now
              </a>
            </div>

            <div className="career-detail-panel" aria-label="Role details">
              <div>
                <span>Type</span>
                <strong>{job.type === "internship" ? "Internship" : "Role"}</strong>
              </div>
              {job.department ? (
                <div>
                  <span>Department</span>
                  <strong>{job.department}</strong>
                </div>
              ) : null}
              {job.location ? (
                <div>
                  <span>Location</span>
                  <strong>{job.location}</strong>
                </div>
              ) : null}
              <div>
                <span>Status</span>
                <strong>Accepting applications</strong>
              </div>
            </div>
          </div>
        </RevealSection>

        <RevealSection className="career-body light" data-section="02">
          <div className="section-inner career-body-grid">
            <div className="course-body-sticky">
              <p className="course-section-kicker">ROLE BRIEF</p>
              <h2 className="course-body-title">Work that stays close to the operator.</h2>
            </div>
            <div className="course-body-text">
              {bodyHtml ? (
                <div className="course-rich-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
              ) : (
                <p>
                  This role is built for someone who can move between strategic clarity and practical execution without
                  losing the thread.
                </p>
              )}

              {requirementsHtml ? (
                <>
                  <h3 className="career-requirements-title">What we look for</h3>
                  <div className="course-rich-body" dangerouslySetInnerHTML={{ __html: requirementsHtml }} />
                </>
              ) : null}
            </div>
          </div>
        </RevealSection>

        <RevealSection className="career-apply dark" data-section="03" id="apply">
          <SectionLabel n="03" text="APPLY" onDark />
          <div className="section-inner course-register-grid">
            <div className="course-register-copy">
              <p className="course-section-kicker">APPLICATION</p>
              <h2>
                Show us the work
                <br />
                <span>you can carry.</span>
              </h2>
              <p>
                Send a concise profile, your resume, and the context behind why this role matters to you.
              </p>
              <div className="course-register-pass">
                <div>
                  <span>Role</span>
                  <strong>{job.title}</strong>
                </div>
                {job.location ? (
                  <div>
                    <span>Location</span>
                    <strong>{job.location}</strong>
                  </div>
                ) : null}
              </div>
            </div>

            <JobApplicationForm jobId={job.id} jobTitle={job.title} />
          </div>
        </RevealSection>
      </main>
      <Footer />
    </>
  );
}
