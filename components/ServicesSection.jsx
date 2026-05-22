"use client";

import RevealSection from "./RevealSection";
import SectionLabel from "./SectionLabel";
import { Icon } from "./Icons";

const items = [
  { Glyph: Icon.Strategy, title: "Strategy", body: "Winning positions, defined." },
  { Glyph: Icon.Growth, title: "Growth & Marketing", body: "Demand, engineered." },
  { Glyph: Icon.Ops, title: "Operations", body: "Scale without friction." },
  { Glyph: Icon.Transform, title: "Transformation", body: "Built to outlast change." },
  { Glyph: Icon.Merge, title: "M&A Advisory", body: "Value unlocked through deals." },
];

export default function ServicesSection() {
  return (
    <RevealSection className="services dark" data-section="05" id="services">
      <SectionLabel n="05" text="OUR SERVICES" onDark />
      <div className="dark-texture" aria-hidden="true" />
      <div className="section-inner">
        <div className="services-head">
          <div>
            <div className="section-eyebrow on-dark">OUR SERVICES</div>
            <h2 className="h2 on-dark">
              End-to-end advisory<br />
              for <span className="accent">lasting impact.</span>
            </h2>
          </div>
          <a className="cta-link on-dark" href="#">
            <span>VIEW ALL SERVICES</span>
            <Icon.Arrow />
          </a>
        </div>
        <div className="services-grid">
          {items.map((it, i) => (
            <div className="s-card" key={i}>
              <div className="s-card-index">0{i + 1}</div>
              <div className="s-card-icon">
                <it.Glyph s={26} />
              </div>
              <h3 className="s-card-title">{it.title}</h3>
              <p className="s-card-body">{it.body}</p>
              <div className="s-card-arrow">
                <Icon.Arrow />
              </div>
            </div>
          ))}
        </div>
      </div>
    </RevealSection>
  );
}
