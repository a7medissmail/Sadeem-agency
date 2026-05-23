"use client";

import RevealSection from "./RevealSection";
import SectionLabel from "./SectionLabel";
import CaseSvg from "./scenes/CaseSvg";
import { Icon } from "./Icons";

const cases = [
  { tag: "MANUFACTURING", body: "Scaled operations and increased EBITDA by 35% in 18 months.", kind: "industrial", n: "01" },
  { tag: "TECHNOLOGY", body: "Accelerated growth and expanded to 3 new markets in 12 months.", kind: "tech", n: "02" },
  { tag: "RETAIL", body: "Improved efficiency and boosted profitability by 28%.", kind: "retail", n: "03" },
];

function CaseTile({ tag, body, kind, n }: { tag: string; body: string; kind: string; n: string }) {
  return (
    <article className="case">
      <div className={`case-image case-${kind}`}>
        <CaseSvg kind={kind} />
        <div className="case-tag">{tag}</div>
        <div className="case-num">/ {n}</div>
      </div>
      <div className="case-copy">
        <p className="case-body">{body}</p>
        <a className="cta-link on-dark sm" href="#">
          <span>READ CASE STUDY</span>
          <Icon.Arrow />
        </a>
      </div>
    </article>
  );
}

export default function CasesSection() {
  return (
    <RevealSection className="cases dark" data-section="07">
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
          <a className="cta-link on-dark" href="#">
            <span>VIEW ALL STORIES</span>
            <Icon.Arrow />
          </a>
        </div>
        <div className="cases-grid">
          {cases.map((c, i) => (
            <CaseTile key={i} {...c} />
          ))}
        </div>
      </div>
    </RevealSection>
  );
}
