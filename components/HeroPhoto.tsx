"use client";

import Image from "next/image";

// Layered photographic hero scene:
//   background photo (Ken-Burns zoom) → fog → rotating orbital rings →
//   parallax lone figure → dark shade for text legibility.
export default function HeroPhoto({
  src,
  alt,
  scrollY = 0,
  withFigure = false,
  priority = false,
}: {
  src: string;
  alt: string;
  scrollY?: number;
  withFigure?: boolean;
  priority?: boolean;
}) {
  const ringsY = scrollY * 0.05;
  const figureY = scrollY * 0.12;
  const fogY = scrollY * 0.06;
  const bandY = scrollY * 0.07;
  const wispY = scrollY * 0.11;

  return (
    <div className="hero-photo">
      <div className="hero-bg">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
      </div>

      {/* drifting cloud band — high in the sky, slow */}
      <div className="hero-depth-grade" />
      <div className="hero-volumetric-light" />

      <div className="hero-cloud hero-cloud-band" style={{ transform: `translate3d(0, ${bandY}px, 0)` }}>
        <div className="cloud-move cloud-move-slow">
          <Image src="/hero/cloud-band.webp" alt="" width={2600} height={1300} priority={priority} sizes="120vw" />
        </div>
      </div>

      <div className="hero-fog" style={{ transform: `translate3d(0, ${fogY}px, 0)` }} />

      <div className="hero-rings" style={{ transform: `translate3d(0, ${ringsY}px, 0)` }}>
        <svg viewBox="0 0 400 400" className="orbital-rings" aria-hidden="true">
          <g transform="translate(200 200)">
            <circle r="80" fill="none" stroke="#FF6A00" strokeWidth="0.7" opacity="0.55" />
            <circle r="120" fill="none" stroke="#FF6A00" strokeWidth="0.6" opacity="0.4" strokeDasharray="3 6" />
            <circle r="160" fill="none" stroke="#F5F3F0" strokeWidth="0.5" opacity="0.22" />
            <circle r="195" fill="none" stroke="#FF6A00" strokeWidth="0.5" opacity="0.3" strokeDasharray="1 7" />
            <circle cx="80" cy="0" r="2.2" fill="#FF6A00" />
            <circle cx="-118" cy="30" r="1.8" fill="#FF6A00" opacity="0.7" />
            <circle cx="40" cy="-158" r="1.8" fill="#F5F3F0" opacity="0.8" />
            <circle cx="-150" cy="-70" r="2.2" fill="#FF6A00" opacity="0.9" />
          </g>
        </svg>
      </div>

      {/* closer drifting wisp — lower, a touch faster, for depth */}
      <div className="hero-cloud hero-cloud-wisp" style={{ transform: `translate3d(0, ${wispY}px, 0)` }}>
        <div className="cloud-move cloud-move-med">
          <Image src="/hero/cloud-wisp.webp" alt="" width={1600} height={1067} sizes="80vw" />
        </div>
      </div>

      {withFigure && (
        <div className="hero-figure" style={{ transform: `translate3d(0, ${figureY}px, 0)` }}>
          <div className="hero-figure-inner">
            <Image
              src="/hero/figure.webp"
              alt=""
              width={1100}
              height={733}
              sizes="(max-width: 720px) 60vw, 34vw"
              style={{ width: "100%", height: "auto" }}
            />
          </div>
        </div>
      )}

      <div className="hero-shade" />
    </div>
  );
}
