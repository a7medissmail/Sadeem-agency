"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaSnapchat,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { telHref, whatsappHref } from "@/lib/site/contact";
import { socialPlatformLabels, type SiteSocialLink, type SocialPlatform } from "@/lib/site/social";
import { SadeemMark } from "./marks";
import { useSiteSettings } from "./SiteSettingsProvider";

type FooterItem = {
  label: string;
  href?: string;
};

function FooterCol({ title, items }: { title: string; items: FooterItem[] }) {
  return (
    <div className="footer-col">
      <div className="footer-title">{title}</div>
      <ul className="footer-list">
        {items.map((item) => (
          <li key={item.label}>
            {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

const socialIcons: Record<SocialPlatform, ComponentType<{ "aria-hidden"?: boolean }>> = {
  linkedin: FaLinkedinIn,
  x: FaXTwitter,
  instagram: FaInstagram,
  facebook: FaFacebookF,
  snapchat: FaSnapchat,
  youtube: FaYoutube,
  tiktok: FaTiktok,
};

function SocialDot({ link }: { link: SiteSocialLink }) {
  const SocialIcon = socialIcons[link.platform];
  return (
    <a className="social-dot" href={link.url} target="_blank" rel="noreferrer" aria-label={socialPlatformLabels[link.platform]}>
      <SocialIcon aria-hidden />
    </a>
  );
}

/**
 * A contact line, and the href that makes it actionable.
 *
 * These used to render as bare <li> text. On a phone — where most of this
 * site's traffic reads the footer — that means a visitor who wants to call has
 * to select the number by hand, and one who wants WhatsApp has to copy it into
 * another app. Both are places a lead quietly gives up, so every line that can
 * carry a destination now does.
 *
 * A number that does not parse falls back to plain text rather than a link
 * that goes nowhere.
 */
type ContactLine = { key: string; text: string; href: string | null; external?: boolean };

function contactLines(settings: ReturnType<typeof useSiteSettings>): ContactLine[] {
  const lines: ContactLine[] = [];

  if (settings.footerEmail) {
    lines.push({ key: "email", text: settings.footerEmail, href: `mailto:${settings.footerEmail}` });
  }
  if (settings.footerPhone) {
    lines.push({ key: "phone", text: settings.footerPhone, href: telHref(settings.footerPhone) });
  }
  if (settings.footerWhatsapp) {
    lines.push({
      key: "whatsapp",
      text: `WhatsApp ${settings.footerWhatsapp}`,
      href: whatsappHref(settings.footerWhatsapp),
      external: true,
    });
  }
  // Addresses stay plain text — a map link is a different decision, and a
  // wrong pin is worse than none.
  for (const [index, place] of [settings.footerLocation, settings.footerLocationSecondary].entries()) {
    if (place) lines.push({ key: `place-${index}`, text: place, href: null });
  }

  return lines;
}

export default function Footer() {
  const settings = useSiteSettings();
  const contact = contactLines(settings);

  return (
    <footer className="footer dark">
      <div className="section-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            {settings.logoLightUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logoLightUrl} alt="SADEEM" className="brand-logo-img footer-logo-img" />
            ) : (
              <SadeemMark />
            )}
            <p className="body on-dark sm">{settings.footerDescription}</p>
            {settings.socialLinks.length ? (
              <div className="footer-social">
                {settings.socialLinks.map((link) => (
                  <SocialDot key={link.platform} link={link} />
                ))}
              </div>
            ) : null}
          </div>
          <FooterCol
            title="Company"
            items={[
              { label: "About us", href: "/#about" },
              { label: "Our approach", href: "/#approach" },
              { label: "Team", href: "/team" },
              { label: "Careers", href: "/careers" },
            ]}
          />
          <FooterCol
            title="Services"
            items={[
              { label: "Strategy", href: "/services#strategy" },
              { label: "Enablement", href: "/services#enablement" },
              { label: "Execution support", href: "/services#execution" },
              { label: "Workshops", href: "/courses" },
              { label: "All services", href: "/services" },
            ]}
          />
          <FooterCol
            title="Get started"
            items={[
              // Parked alongside the navbar entry — see components/MainNavbar.tsx.
              // { label: "Success stories", href: "/success-stories" },
              { label: "Book a consultation", href: "/consultation" },
              { label: "Contact us", href: "/#contact" },
            ]}
          />
          <div className="footer-col">
            <div className="footer-title">Contact</div>
            <ul className="footer-list">
              {contact.map((line) => (
                <li key={line.key}>
                  {line.href ? (
                    <a
                      href={line.href}
                      {...(line.external ? { target: "_blank", rel: "noreferrer" } : {})}
                    >
                      {line.text}
                    </a>
                  ) : (
                    line.text
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer-rule" />
        <div className="footer-base">
          <span>© 2026 SADEEM. All rights reserved.</span>
          <span className="footer-base-right">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
