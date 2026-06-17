export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import SectionAwareNavbar from "@/components/SectionAwareNavbar";
import SectionLabel from "@/components/SectionLabel";
import RevealSection from "@/components/RevealSection";
import { Icon } from "@/components/Icons";
import { getSupabasePublic } from "@/lib/supabase/public";

export const metadata = {
  title: "Success Stories - SADEEM",
  description: "Measured operating stories from SADEEM engagements.",
};

type Story = {
  id: string;
  slug: string;
  title: string;
  industry: string | null;
  summary: string | null;
  image_url: string | null;
  metric_value: string | null;
  metric_label: string | null;
};

async function loadStories(): Promise<Story[]> {
  try {
    const supabase = getSupabasePublic();
    const { data, error } = await supabase
      .from("success_stories")
      .select("id, slug, title, industry, summary, image_url, metric_value, metric_label")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function SuccessStoriesPage() {
  const stories = await loadStories();

  return (
    <>
      <SectionAwareNavbar initialOverDark />
      <main className="page stories-page">
        <section className="stories-hero dark" data-section="01">
          <SectionLabel n="01" text="SUCCESS STORIES" onDark />
          <div className="stories-hero-bg" aria-hidden="true" />
          <div className="section-inner stories-hero-inner">
            <div>
              <p className="team-brief-kicker">PROOF OF WORK</p>
              <h1 className="display stories-hero-title">
                Operating shifts.
                <br />
                <span>Measured outcomes.</span>
              </h1>
              <p>
                A growing library of the moments where strategy moved into operating rhythm, execution, and measurable
                commercial progress.
              </p>
            </div>
          </div>
        </section>

        <RevealSection className="stories-list light" data-section="02">
          <div className="section-inner">
            {stories.length === 0 ? (
              <div className="stories-empty">
                <p className="team-brief-kicker">COMING SOON</p>
                <h2>Stories are being prepared.</h2>
                <p>Until then, start a conversation and we can walk you through relevant operating examples.</p>
                <Link href="/#contact" className="cta-link dark">
                  <span>START A CONVERSATION</span>
                  <Icon.Arrow />
                </Link>
              </div>
            ) : (
              <div className="stories-grid">
                {stories.map((story, index) => (
                  <Link href={`/success-stories/${story.slug}`} className="story-card" key={story.id}>
                    <div className="story-card-image">
                      {story.image_url ? (
                        <Image src={story.image_url} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" />
                      ) : (
                        <div className="story-card-fallback" />
                      )}
                      <span>{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <div className="story-card-copy">
                      <p>{story.industry || "Success story"}</p>
                      <h2>{story.title}</h2>
                      <span>{story.summary || "A measured operating shift across strategy, execution, and growth."}</span>
                      {story.metric_value ? (
                        <strong>
                          {story.metric_value}
                          {story.metric_label ? <small>{story.metric_label}</small> : null}
                        </strong>
                      ) : null}
                    </div>
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
