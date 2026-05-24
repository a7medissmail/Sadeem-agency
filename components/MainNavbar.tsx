"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "./Icons";
import { SadeemMark } from "./marks";
import { useSiteSettings } from "./SiteSettingsProvider";

const links = [
  { label: "About", href: "/#about" },
  { label: "Services", href: "/#services" },
  { label: "Our approach", href: "/#approach" },
  { label: "Workshops", href: "/courses" },
  { label: "Team", href: "/team" },
  { label: "Careers", href: "/careers" },
  { label: "Success stories", href: "/#cases" },
  { label: "Contact", href: "/#contact" },
];

export default function MainNavbar({ overDark }: { overDark: boolean }) {
  const pathname = usePathname();
  const settings = useSiteSettings();
  const [activeHash, setActiveHash] = useState("");
  const logoUrl = overDark ? settings.logoLightUrl : settings.logoDarkUrl;

  useEffect(() => {
    const updateHash = () => setActiveHash(window.location.hash || "");
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  return (
    <header className={`mainnav ${overDark ? "is-dark" : "is-light"}`}>
      <div className="mainnav-inner">
        <a href="/" aria-label="SADEEM home" className="mainnav-logo">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="SADEEM" className="brand-logo-img" />
          ) : (
            <SadeemMark dark={!overDark} />
          )}
        </a>
        <nav className="mainnav-links">
          {links.map((l) => {
            const isHashLink = l.href.startsWith("/#");
            const isActive = isHashLink
              ? pathname === "/" && activeHash === l.href.slice(1)
              : pathname === l.href || pathname.startsWith(`${l.href}/`);

            return (
              <a key={l.href} href={l.href} className={isActive ? "is-active" : undefined}>
                {l.label}
              </a>
            );
          })}
        </nav>
        <a className="mainnav-cta" href="/consultation">
          <span>LET&apos;S TALK</span>
          <Icon.Arrow />
        </a>
      </div>
    </header>
  );
}
