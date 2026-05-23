"use client";

import Image from "next/image";
import RevealSection from "./RevealSection";
import SectionLabel from "./SectionLabel";
import { Icon } from "./Icons";

export default function FinalCTA() {
  return (
    <RevealSection className="final dark" data-section="09" id="contact">
      <SectionLabel n="09" text="GET IN TOUCH" onDark />

      <div className="final-scene" aria-hidden="true">
        <div className="final-bg">
          <Image
            src="/hero/cta-scene.webp"
            alt=""
            fill
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        </div>
        <div className="final-rings">
          <svg viewBox="0 0 400 400" className="orbital-rings">
            <g transform="translate(200 200)">
              <circle r="80" fill="none" stroke="#FF6A00" strokeWidth="0.7" opacity="0.5" />
              <circle r="120" fill="none" stroke="#FF6A00" strokeWidth="0.6" opacity="0.36" strokeDasharray="3 6" />
              <circle r="160" fill="none" stroke="#F5F3F0" strokeWidth="0.5" opacity="0.2" />
              <circle r="195" fill="none" stroke="#FF6A00" strokeWidth="0.5" opacity="0.28" strokeDasharray="1 7" />
              <circle cx="80" cy="0" r="2.2" fill="#FF6A00" />
              <circle cx="-118" cy="30" r="1.8" fill="#FF6A00" opacity="0.7" />
              <circle cx="40" cy="-158" r="1.8" fill="#F5F3F0" opacity="0.8" />
            </g>
          </svg>
        </div>
        <div className="final-fog" />
        <div className="final-shade" />
      </div>

      <div className="final-text">
        <div className="section-eyebrow on-dark">LET&apos;S BEGIN</div>
        <h2 className="final-title">
          Ready to unlock<br />
          your <span className="accent">next level</span>
          <br />
          of growth?
        </h2>
        <p className="body on-dark">Let&apos;s start a conversation.</p>
        <a className="btn-outline" href="#">
          <span>LET&apos;S TALK</span>
          <Icon.Arrow />
        </a>
      </div>
    </RevealSection>
  );
}
