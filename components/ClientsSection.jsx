"use client";

import RevealSection from "./RevealSection";
import SectionLabel from "./SectionLabel";
import { LogoMark } from "./marks";

const logos = [
  { name: "NORTHWIND", shape: "wedge" },
  { name: "MERIDIAN", shape: "ring" },
  { name: "ATELIER 9", shape: "grid" },
  { name: "VANTA CO.", shape: "diamond" },
  { name: "HALLOW", shape: "bar" },
  { name: "ORBIT LABS", shape: "orbit" },
];

// Duplicated once so the marquee can loop seamlessly (translateX -50%).
const loop = [...logos, ...logos];

export default function ClientsSection() {
  return (
    <RevealSection className="clients light" data-section="08">
      <SectionLabel n="08" text="CLIENTS" />
      <div className="section-inner">
        <div className="clients-rail">
          <div className="section-eyebrow">TRUSTED BY AMBITIOUS ORGANIZATIONS</div>
          <div className="clients-marquee">
            <div className="clients-marquee-track">
              {loop.map((l, i) => (
                <div className="client" key={i} aria-hidden={i >= logos.length ? "true" : undefined}>
                  <LogoMark shape={l.shape} s={32} />
                  <div className="client-name">{l.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </RevealSection>
  );
}
