"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import type { SiteSocialLink, SocialPlatform } from "@/lib/site/settings";
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
  youtube: FaYoutube,
  tiktok: FaTiktok,
};

function SocialDot({ link }: { link: SiteSocialLink }) {
  const SocialIcon = socialIcons[link.platform];
  return (
    <a className="social-dot" href={link.url} target="_blank" rel="noreferrer" aria-label={link.platform}>
      <SocialIcon aria-hidden />
    </a>
  );
}

export default function Footer() {
  const settings = useSiteSettings();
  const contactItems = [settings.footerEmail, settings.footerPhone, settings.footerLocation].filter(Boolean) as string[];

  return (
    <footer className="footer dark" data-section="10">
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
              { label: "Success stories", href: "/success-stories" },
            ]}
          />
          <FooterCol
            title="Services"
            items={[
              { label: "Strategy", href: "/#services" },
              { label: "Growth & marketing", href: "/#services" },
              { label: "Operations", href: "/#services" },
              { label: "Transformation", href: "/#services" },
              { label: "M&A advisory", href: "/#services" },
            ]}
          />
          <FooterCol
            title="Industries"
            items={[
              { label: "Manufacturing", href: "/#cases" },
              { label: "Technology", href: "/#cases" },
              { label: "Retail", href: "/#cases" },
              { label: "Healthcare", href: "/#contact" },
              { label: "Real estate", href: "/#contact" },
            ]}
          />
          <div className="footer-col">
            <div className="footer-title">Contact</div>
            <ul className="footer-list">
              {contactItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer-rule" />
        <div className="footer-base">
          <span>Copyright 2026 Sadeem. All rights reserved.</span>
          <span className="footer-base-right">
            <span>Privacy</span>
            <span>Terms</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
