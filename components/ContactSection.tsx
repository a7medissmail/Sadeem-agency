"use client";

import RevealSection from "./RevealSection";
import SectionLabel from "./SectionLabel";
import LeadForm from "./LeadForm";

export default function ContactSection() {
  return (
    <RevealSection className="contact light" data-section="10" id="contact">
      <SectionLabel n="10" text="GET IN TOUCH" />
      <div className="section-inner contact-grid">
        <div className="contact-copy">
          <div className="section-eyebrow">START A CONVERSATION</div>
          <h2 className="h2">
            Tell us where<br />
            you&apos;re heading.
          </h2>
          <p className="body">
            We work with a small number of ambitious teams at a time. Share a few details
            and the right person will reach out — usually within one business day.
          </p>
          <ul className="contact-meta">
            <li>
              <span>Reach</span>
              <a href="mailto:hello@sadeem.co">hello@sadeem.co</a>
            </li>
            <li>
              <span>Office</span>
              <span>Riyadh, Saudi Arabia</span>
            </li>
          </ul>
        </div>
        <div className="contact-form">
          <LeadForm source="homepage" />
        </div>
      </div>
    </RevealSection>
  );
}
