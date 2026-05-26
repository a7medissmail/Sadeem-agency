"use client";

import RevealSection from "./RevealSection";
import SectionLabel from "./SectionLabel";

// Inline list for now. A Supabase-backed admin CRUD will replace this with
// the same shape later (anchor + 7 grid logos + nda tile).
type GridLogo = { name: string; src: string; alt: string };

const anchor = {
  name: "Vodafone",
  src: "/partners/vodafone.png",
  alt: "Vodafone",
  caption: "Telecom · enterprise growth · multi-year retainer",
};

const grid: GridLogo[] = [
  { name: "Al Ahlia", src: "/partners/ahlia.png", alt: "Al Ahlia" },
  { name: "Alfa Labs", src: "/partners/alpha.png", alt: "Alfa Labs" },
  { name: "Roshdy", src: "/partners/roshdy.png", alt: "Roshdy" },
  { name: "Shezlong", src: "/partners/shezlong.png", alt: "Shezlong" },
  { name: "Sha2ty", src: "/partners/sha2ty.png", alt: "Sha2ty" },
  { name: "TSS", src: "/partners/tss.png", alt: "TSS" },
  { name: "Horror House", src: "/partners/horror.png", alt: "The Horror House" },
];

export default function ClientsSection() {
  const rowA = grid.slice(0, 4);
  const rowB = grid.slice(4, 7);

  return (
    <RevealSection className="clients light" data-section="08">
      <SectionLabel n="08" text="CLIENTS" />
      <div className="section-inner">
        <div className="clients-head">
          <div className="section-eyebrow">TRUSTED BY AMBITIOUS OPERATORS</div>
          <div className="clients-head-meta">
            <span className="accent">8 engagements</span>
            <span className="sep">·</span>
            <span>2019 — 2026</span>
          </div>
        </div>

        <div className="clients-editorial">
          <figure className="clients-anchor">
            <img src={anchor.src} alt={anchor.alt} loading="lazy" />
            <div className="meta">
              <span className="name">{anchor.name}</span>
              <span className="cap">{anchor.caption}</span>
            </div>
          </figure>

          <div className="clients-row row-a">
            {rowA.map((logo) => (
              <figure key={logo.src} className="clients-cell">
                <img src={logo.src} alt={logo.alt} loading="lazy" />
                <span className="name">{logo.name}</span>
              </figure>
            ))}
          </div>

          <div className="clients-row row-b">
            {rowB.map((logo) => (
              <figure key={logo.src} className="clients-cell">
                <img src={logo.src} alt={logo.alt} loading="lazy" />
                <span className="name">{logo.name}</span>
              </figure>
            ))}
            <div className="clients-more">
              <div className="num">+ 14</div>
              <div className="lbl">
                other operators
                <br />
                under NDA
              </div>
            </div>
          </div>
        </div>

        <div className="clients-foot">
          Hover any logo for context. Most engagements run 90 days; the longest, six years.
        </div>
      </div>
    </RevealSection>
  );
}
