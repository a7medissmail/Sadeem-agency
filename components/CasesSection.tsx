"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import RevealSection from "./RevealSection";
import SectionLabel from "./SectionLabel";
import CaseSvg from "./scenes/CaseSvg";
import { Icon } from "./Icons";

type HomeStory = {
  id: string;
  slug: string;
  title: string;
  industry: string | null;
  summary: string | null;
  image_url: string | null;
  metric_value: string | null;
  metric_label: string | null;
};

const fallbackStories: HomeStory[] = [
  {
    id: "fallback-beauty",
    slug: "scattered-demand-to-predictable-growth",
    title: "From scattered demand to predictable growth",
    industry: "Beauty & personal care",
    summary: "Rebuilt a D2C brand's growth engine around margin — and made it predictable week by week.",
    image_url: null,
    metric_value: "+34%",
    metric_label: "contribution margin",
  },
  {
    id: "fallback-retail",
    slug: "brand-and-demand-engine-together",
    title: "Building the brand and the demand engine together",
    industry: "Consumer retail",
    summary: "Ran brand and performance as one flywheel across Egypt and the Gulf.",
    image_url: null,
    metric_value: "+47%",
    metric_label: "revenue in 12 months",
  },
  {
    id: "fallback-health",
    slug: "strategy-deck-into-growth-motion",
    title: "Turning a strategy deck into a growth motion",
    industry: "Healthtech",
    summary: "Turned a slide strategy into a measurable GTM motion with a weekly rhythm.",
    image_url: null,
    metric_value: "-41%",
    metric_label: "CAC in two quarters",
  },
];

function storyKind(industry: string | null, index: number) {
  const value = (industry ?? "").toLowerCase();
  if (value.includes("tech")) return "tech";
  if (value.includes("retail") || value.includes("commerce")) return "retail";
  if (value.includes("manufact") || value.includes("industrial")) return "industrial";
  return ["industrial", "tech", "retail"][index % 3];
}

function CaseTile({ story, kind, n }: { story: HomeStory; kind: string; n: string }) {
  return (
    <article className="case">
      <div className={`case-image case-${kind}`}>
        {story.image_url ? (
          <Image src={story.image_url} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" />
        ) : (
          <CaseSvg kind={kind} />
        )}
        <div className="case-tag">{story.industry || "SUCCESS STORY"}</div>
        <div className="case-num">/ {n}</div>
      </div>
      <div className="case-copy">
        {story.metric_value ? (
          <p className="case-metric">
            {story.metric_value}
            {story.metric_label ? <span>{story.metric_label}</span> : null}
          </p>
        ) : null}
        <h3 className="case-title">{story.title}</h3>
        <p className="case-body">{story.summary || "A measured operating shift across strategy, execution, and growth."}</p>
        {!story.id.startsWith("fallback-") && (
          <a className="cta-link on-dark sm" href={`/success-stories/${story.slug}`}>
            <span>READ STORY</span>
            <Icon.Arrow />
          </a>
        )}
      </div>
    </article>
  );
}

export default function CasesSection() {
  const [stories, setStories] = useState<HomeStory[]>(fallbackStories);

  useEffect(() => {
    let cancelled = false;
    async function loadStories() {
      try {
        const response = await fetch("/api/success-stories?limit=3", { cache: "no-store" });
        const data = (await response.json()) as { stories?: HomeStory[] };
        if (!cancelled && data.stories?.length) setStories(data.stories);
      } catch {
        // Keep the curated fallback cards when the stories table is not available yet.
      }
    }

    loadStories();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <RevealSection className="cases dark" data-section="07" id="cases">
      <SectionLabel n="07" text="SUCCESS STORIES" onDark />
      <div className="section-inner">
        <div className="cases-head">
          <div>
            <div className="section-eyebrow on-dark">SUCCESS STORIES</div>
            <h2 className="h2 on-dark">
              Real <span className="accent">impact.</span>
              <br />
              Measurable results.
            </h2>
          </div>
          <a className="cta-link on-dark" href="/success-stories">
            <span>VIEW STORIES</span>
            <Icon.Arrow />
          </a>
        </div>
        <div className="cases-grid">
          {stories.map((story, i) => (
            <CaseTile key={story.id} story={story} kind={storyKind(story.industry, i)} n={String(i + 1).padStart(2, "0")} />
          ))}
        </div>
      </div>
    </RevealSection>
  );
}
