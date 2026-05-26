export const dynamic = "force-dynamic";

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Footer from "@/components/Footer";
import RevealSection from "@/components/RevealSection";
import SectionAwareNavbar from "@/components/SectionAwareNavbar";
import SectionLabel from "@/components/SectionLabel";
import type { JobType } from "@/types/database";

type CareerRow = {
  id: string;
  slug: string;
  title: string;
  type: JobType;
  department: string | null;
  location: string | null;
  body: string | null;
  requirements: string | null;
  created_at: string;
};

export const metadata = {
  title: "Careers - SADEEM",
  description: "Open roles and internships at SADEEM.",
};

async function loadJobs(): Promise<CareerRow[]> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("jobs")
      .select("id, slug, title, type, department, location, body, requirements, created_at")
      .eq("is_open", true)
      .order("created_at", { ascending: false });

    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

function preview(value: string | null) {
  if (!value) return "A role for operators who want to work close to real decisions and measurable outcomes.";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 170);
}

export default async function CareersPage() {
  const jobs = await loadJobs();

  return (
    <>
      <SectionAwareNavbar initialOverDark />
      <main className="page careers-page">
        <section className="careers-hero dark" data-section="01">
          <SectionLabel n="01" text="CAREERS" onDark />
          <div className="careers-hero-bg" aria-hidden="true" />
          <div className="section-inner careers-hero-inner">
            <div className="careers-hero-copy">
              <p className="team-brief-kicker">WORK WITH US</p>
              <h1 className="display careers-hero-title">
                Build beside
                <br />
                <span>operators.</span>
              </h1>
              <p>
                SADEEM is assembling a small, senior team around strategy, operations, and growth work that moves from
                diagnosis into execution.
              </p>
              <a href="#open-roles" className="team-line-cta">
                <span>OPEN ROLES</span>
                <span aria-hidden>-&gt;</span>
              </a>
            </div>
          </div>
        </section>

        <RevealSection className="careers-list light" data-section="02" id="open-roles">
          <div className="section-inner">
            <div className="careers-list-head">
              <p className="team-brief-kicker">OPENINGS</p>
              <h2>
                Roles for people who
                <br />
                <span>carry the work.</span>
              </h2>
            </div>

            {jobs.length === 0 ? (
              <div className="careers-empty">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-black/40">NO OPEN ROLES</p>
                <h3>We are not hiring publicly right now.</h3>
                <p>Reach out if you believe your work belongs in the SADEEM operating room.</p>
                <Link className="cta-link dark" href="/#contact">
                  <span>START A CONVERSATION</span>
                  <span aria-hidden>-&gt;</span>
                </Link>
              </div>
            ) : (
              <div className="career-role-list">
                {jobs.map((job, index) => (
                  <Link key={job.id} href={`/careers/${job.slug}`} className="career-role-row">
                    <span className="career-role-index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="career-role-main">
                      <span className="career-role-meta">
                        {job.type === "internship" ? "Internship" : "Role"}
                        {job.department ? ` / ${job.department}` : ""}
                        {job.location ? ` / ${job.location}` : ""}
                      </span>
                      <strong>{job.title}</strong>
                      <span>{preview(job.body)}</span>
                    </span>
                    <span className="career-role-arrow">+</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </RevealSection>
      </main>
      <Footer />
    </>
  );
}
