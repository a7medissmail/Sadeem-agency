"use client";

import { useEffect, useState } from "react";
import HeroPhoto from "./HeroPhoto";
import SectionLabel from "./SectionLabel";
import { Icon } from "./Icons";

const slides = [
  {
    eyebrow: "01 / STRATEGIC ADVISORY",
    title: (
      <>
        STRATEGIC<br />GROWTH<br />
        <span className="accent">ADVISORY.</span>
      </>
    ),
    sub: "Bridging the gap between ambition and execution.",
    src: "/hero/slide1.webp",
    alt: "Sunlit mountain peak above a sea of clouds at sunset",
    withFigure: false,
  },
  {
    eyebrow: "02 / OPERATING SYSTEM",
    title: (
      <>
        GROWTH IS<br />
        <span className="accent">ENGINEERED.</span>
      </>
    ),
    sub: "We build structured systems that turn strategy into measurable results.",
    src: "/hero/slide2.webp",
    alt: "Layered mountain ridges fading into mist at dawn",
    withFigure: false,
  },
  {
    eyebrow: "03 / EXECUTION",
    title: (
      <>
        FROM AMBITION<br />TO <span className="accent">EXECUTION.</span>
      </>
    ),
    sub: "Aligning strategy, operations, and performance for scalable growth.",
    src: "/hero/slide3.webp",
    alt: "Mountain summits rising through golden clouds at sunrise",
    withFigure: false,
  },
];

export default function HeroSlider({ scrollY }: { scrollY: number }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = slides.length;

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setI((p) => (p + 1) % total), 7200);
    return () => clearTimeout(t);
  }, [i, paused, total]);

  return (
    <section
      className="hero"
      data-section="01"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, idx) => (
        <div
          key={idx}
          className={`hero-slide ${idx === i ? "is-active" : ""}`}
          aria-hidden={idx !== i}
        >
          <HeroPhoto
            src={s.src}
            alt={s.alt}
            scrollY={scrollY}
            withFigure={s.withFigure}
            priority={idx === 0}
          />
          <div className="hero-text">
            <div className="eyebrow">{s.eyebrow}</div>
            <h1 className="display">{s.title}</h1>
            <p className="lede">{s.sub}</p>
            <a className="cta-link" href="#about">
              <span>DISCOVER MORE</span>
              <Icon.Arrow />
            </a>
          </div>
        </div>
      ))}

      <SectionLabel n="01" text="INTRODUCTION" onDark />

      <div className="hero-controls">
        <div className="hero-progress">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Go to slide ${idx + 1}`}
              className={`hp-dot ${idx === i ? "is-active" : ""}`}
              onClick={() => setI(idx)}
            >
              <span className="hp-fill" />
            </button>
          ))}
        </div>
        <div className="hero-counter">
          <span className="hc-now">{String(i + 1).padStart(2, "0")}</span>
          <span className="hc-sep">/</span>
          <span className="hc-tot">{String(total).padStart(2, "0")}</span>
        </div>
      </div>
    </section>
  );
}
