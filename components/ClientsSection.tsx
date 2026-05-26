import RevealSection from "./RevealSection";
import SectionLabel from "./SectionLabel";
import type { PublicClientPartner, PublicClientSection } from "@/lib/site/clients";
import { defaultClientSection } from "@/lib/site/clients";

const fallbackAnchor: PublicClientPartner = {
  id: "fallback-anchor",
  name: "Vodafone",
  caption: "Telecom · enterprise growth · multi-year retainer",
  logoUrl: "/partners/vodafone.png",
  role: "anchor",
};

const fallbackGrid: PublicClientPartner[] = [
  { id: "fallback-ahlia", name: "Al Ahlia", caption: null, logoUrl: "/partners/ahlia.png", role: "grid" },
  { id: "fallback-alpha", name: "Alfa Labs", caption: null, logoUrl: "/partners/alpha.png", role: "grid" },
  { id: "fallback-roshdy", name: "Roshdy", caption: null, logoUrl: "/partners/roshdy.png", role: "grid" },
  { id: "fallback-shezlong", name: "Shezlong", caption: null, logoUrl: "/partners/shezlong.png", role: "grid" },
  { id: "fallback-sha2ty", name: "Sha2ty", caption: null, logoUrl: "/partners/sha2ty.png", role: "grid" },
  { id: "fallback-tss", name: "TSS", caption: null, logoUrl: "/partners/tss.png", role: "grid" },
  { id: "fallback-horror", name: "Horror House", caption: null, logoUrl: "/partners/horror.png", role: "grid" },
];

export default function ClientsSection({
  section = defaultClientSection,
  anchor,
  grid,
}: {
  section?: PublicClientSection;
  anchor?: PublicClientPartner | null;
  grid?: PublicClientPartner[];
}) {
  const resolvedAnchor = anchor ?? fallbackAnchor;
  // Fall back to the shipped 7-logo set when the DB has no grid partners
  // (e.g. before migration 0018 runs). Cap to 7 grid items either way.
  const gridSource = grid && grid.length > 0 ? grid : fallbackGrid;
  const gridLogos = gridSource.slice(0, 7);
  const rowA = gridLogos.slice(0, 4);
  const rowB = gridLogos.slice(4, 7);

  return (
    <RevealSection className="clients light" data-section="08">
      <SectionLabel n="08" text="CLIENTS" />
      <div className="section-inner">
        <div className="clients-head">
          <div className="section-eyebrow">{section.eyebrow}</div>
          <div className="clients-head-meta">
            <span className="accent">{section.metaAccent}</span>
            <span className="sep">·</span>
            <span>{section.metaValue}</span>
          </div>
        </div>

        <div className="clients-editorial">
          <figure className="clients-anchor">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resolvedAnchor.logoUrl} alt={resolvedAnchor.name} loading="lazy" />
            <div className="meta">
              <span className="name">{resolvedAnchor.name}</span>
              {resolvedAnchor.caption ? <span className="cap">{resolvedAnchor.caption}</span> : null}
            </div>
          </figure>

          <div className="clients-row row-a">
            {rowA.map((logo) => (
              <figure key={logo.id} className="clients-cell">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo.logoUrl} alt={logo.name} loading="lazy" />
                <span className="name">{logo.name}</span>
              </figure>
            ))}
          </div>

          <div className="clients-row row-b">
            {rowB.map((logo) => (
              <figure key={logo.id} className="clients-cell">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo.logoUrl} alt={logo.name} loading="lazy" />
                <span className="name">{logo.name}</span>
              </figure>
            ))}
            <div className="clients-more">
              <div className="num">+ {section.ndaCount}</div>
              <div className="lbl">
                {section.ndaLabel.split("\n").map((line, i, arr) => (
                  <span key={i}>
                    {line}
                    {i < arr.length - 1 ? <br /> : null}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="clients-foot">{section.foot}</div>
      </div>
    </RevealSection>
  );
}
