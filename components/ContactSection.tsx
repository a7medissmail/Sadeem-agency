"use client";

import { telHref, whatsappHref } from "@/lib/site/contact";
import RevealSection from "./RevealSection";
import SectionLabel from "./SectionLabel";
import LeadForm from "./LeadForm";
import { useSiteSettings } from "./SiteSettingsProvider";

/**
 * Cities to show while the address fields are still empty.
 *
 * These two lines were hardcoded in the markup, so editing the admin changed
 * the footer and left this section stating whatever was true the day it was
 * written. They survive only as the fallback: the moment a real address is
 * saved it wins, and this never contradicts the footer again.
 */
const PLACEHOLDER_OFFICES = ["Cairo, Egypt", "Riyadh, KSA"];

export default function ContactSection({ n = "12" }: { n?: string }) {
  const settings = useSiteSettings();
  const email = settings.footerEmail || "hello@sadeem.agency";
  const phoneHref = telHref(settings.footerPhone);
  const waHref = whatsappHref(settings.footerWhatsapp);
  const offices = [settings.footerLocation, settings.footerLocationSecondary].filter(Boolean) as string[];
  const officeLines = offices.length > 0 ? offices : PLACEHOLDER_OFFICES;

  return (
    <RevealSection className="contact light" data-section={n} id="contact">
      <SectionLabel n={n} text="GET IN TOUCH" />
      <div className="section-inner contact-grid">
        <div className="contact-copy">
          <div className="section-eyebrow">START A CONVERSATION</div>
          <h2 className="h2">
            Tell us where<br />
            you&apos;re heading.
          </h2>
          <p className="body">
            We work with a small number of ambitious teams at a time. Share a few details
            and the right person will reach out, usually within one business day.
          </p>
          <ul className="contact-meta">
            <li>
              <span>Reach</span>
              <a href={`mailto:${email}`}>{email}</a>
            </li>
            {settings.footerPhone ? (
              <li>
                <span>Call</span>
                {phoneHref ? <a href={phoneHref}>{settings.footerPhone}</a> : <span>{settings.footerPhone}</span>}
              </li>
            ) : null}
            {settings.footerWhatsapp ? (
              <li>
                <span>WhatsApp</span>
                {waHref ? (
                  <a href={waHref} target="_blank" rel="noreferrer">
                    {settings.footerWhatsapp}
                  </a>
                ) : (
                  <span>{settings.footerWhatsapp}</span>
                )}
              </li>
            ) : null}
            <li>
              <span>{officeLines.length > 1 ? "Offices" : "Office"}</span>
              <span className="contact-meta-stack">
                {officeLines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </span>
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
