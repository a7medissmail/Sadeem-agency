"use client";

import RevealSection from "./RevealSection";
import SectionLabel from "./SectionLabel";
import { Icon } from "./Icons";

const items = [
  { Glyph: Icon.Strategy, title: "Strategy",           body: "Winning positions, defined.",          href: "/services/business-growth-strategy" },
  { Glyph: Icon.Growth,   title: "Growth & Marketing", body: "Demand, engineered.",                  href: "/services/go-to-market-planning" },
  { Glyph: Icon.Ops,      title: "Operations",         body: "Scale without friction.",              href: "/services/operating-systems-frameworks" },
  { Glyph: Icon.Transform,title: "Transformation",     body: "Built to outlast change.",             href: "/services/growth-execution-advisory" },
  { Glyph: Icon.Merge,    title: "M&A Advisory",       body: "Value unlocked through deals.",        href: "/services/commercial-strategy" },
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
          <a className="cta-link on-dark" href="/services">
            <span>ALL SERVICES</span>
            <Icon.Arrow />
          </a>
        </div>
        <div className="services-grid">
          {items.map((it, i) => (
            <a className="s-card" key={i} href={it.href}>
              <div className="s-card-index">0{i + 1}</div>
              <div className="s-card-icon">
                <it.Glyph s={26} />
              </div>
              <h3 className="s-card-title">{it.title}</h3>
              <p className="s-card-body">{it.body}</p>
              <div className="s-card-arrow">
                <Icon.Arrow />
              </div>
            </a>
          ))}
        </div>
      </div>
    </RevealSection>
  );
}
