"use client";

import type { ComponentType } from "react";
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

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="footer-col">
      <div className="footer-title">{title}</div>
      <ul className="footer-list">
        {items.map((i) => (
          <li key={i}>{i}</li>
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
          <FooterCol title="Company" items={["About us", "Our approach", "Team", "Careers", "Insights"]} />
          <FooterCol
            title="Services"
            items={["Strategy", "Growth & marketing", "Operations", "Transformation", "M&A advisory"]}
          />
          <FooterCol
            title="Industries"
            items={["Manufacturing", "Technology", "Retail", "Healthcare", "Real estate"]}
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
          <span>© 2026 Sadeem. All rights reserved.</span>
          <span className="footer-base-right">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
