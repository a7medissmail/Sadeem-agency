export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import SectionAwareNavbar from "@/components/SectionAwareNavbar";
import SectionLabel from "@/components/SectionLabel";
import RevealSection from "@/components/RevealSection";
import { Icon } from "@/components/Icons";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizeCourseHtml } from "@/lib/content/sanitizeCourseHtml";

type Story = {
  id: string;
  slug: string;
  title: string;
  client_name: string | null;
  industry: string | null;
  summary: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  body: string | null;
  image_url: string | null;
  metric_value: string | null;
  metric_label: string | null;
};

async function loadStory(slug: string): Promise<Story | null> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("success_stories")
      .select("id, slug, title, client_name, industry, summary, challenge, solution, results, body, image_url, metric_value, metric_label")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const story = await loadStory(params.slug);
  if (!story) return { title: "Success Story - SADEEM" };
  return {
    title: `${story.title} - SADEEM Success Stories`,
    description: story.summary ?? "A measured operating story from SADEEM.",
  };
}

export default async function SuccessStoryDetailPage({ params }: { params: { slug: string } }) {
  const story = await loadStory(params.slug);
  if (!story) notFound();

  const bodyHtml = story.body ? sanitizeCourseHtml(story.body) : null;
  const panels = [
    ["Challenge", story.challenge],
    ["Solution", story.solution],
    ["Results", story.results],
  ].filter(([, value]) => value);

  return (
    <>
      <SectionAwareNavbar initialOverDark />
      <main className="page story-detail-page">
        <section className="story-detail-hero dark" data-section="01">
          <SectionLabel n="01" text="STORY" onDark />
          <div className="story-detail-bg" aria-hidden="true">
            {story.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={story.image_url} alt="" />
            ) : null}
          </div>
          <div className="section-inner story-detail-hero-inner">
            <div>
              <Link href="/success-stories" className="course-detail-back">
                <span aria-hidden>&lt;-</span> All stories
              </Link>
              <p className="team-brief-kicker">{story.industry || "SUCCESS STORY"}</p>
              <h1 className="display story-detail-title">{story.title}</h1>
              <p>{story.summary || "A measured operating shift across strategy, execution, and growth."}</p>
            </div>
            <div className="story-detail-metric">
              {story.metric_value ? <strong>{story.metric_value}</strong> : <strong>01</strong>}
              <span>{story.metric_label || story.client_name || "operating story"}</span>
            </div>
          </div>
        </section>

        <RevealSection className="story-detail-body light" data-section="02">
          <div className="section-inner story-detail-grid">
            <aside className="story-detail-aside">
              <p className="team-brief-kicker">OPERATING READ</p>
              <h2>
                From signal
                <br />
                to system.
              </h2>
              {story.client_name ? <p>{story.client_name}</p> : null}
            </aside>

            <div className="story-detail-content">
              {panels.length ? (
                <div className="story-detail-panels">
                  {panels.map(([title, value], index) => (
                    <article key={title}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <h3>{title}</h3>
                      <p>{value}</p>
                    </article>
                  ))}
                </div>
              ) : null}

              {bodyHtml ? (
                <div className="course-rich-body story-rich-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
              ) : null}

              <Link href="/#contact" className="team-light-cta">
                <span>BUILD YOUR STORY</span>
                <Icon.Arrow />
              </Link>
            </div>
          </div>
        </RevealSection>
      </main>
      <Footer />
    </>
  );
}
