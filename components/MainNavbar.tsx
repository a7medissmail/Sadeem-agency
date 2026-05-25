"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "./Icons";
import { SadeemMark } from "./marks";
import { useSiteSettings } from "./SiteSettingsProvider";

const links = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "Services", href: "/#services" },
  { label: "Our approach", href: "/#approach" },
  { label: "Workshops", href: "/courses" },
  { label: "Team", href: "/team" },
  { label: "Careers", href: "/careers" },
  { label: "Success stories", href: "/success-stories" },
  { label: "Contact", href: "/#contact" },
];

export default function MainNavbar({ overDark }: { overDark: boolean }) {
  const pathname = usePathname();
  const settings = useSiteSettings();
  const [activeHash, setActiveHash] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const logoUrl = overDark ? settings.logoLightUrl : settings.logoDarkUrl;

  useEffect(() => {
    const updateHash = () => setActiveHash(window.location.hash || "");
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, activeHash]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header className={`mainnav ${overDark ? "is-dark" : "is-light"} ${menuOpen ? "menu-open" : ""}`}>
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
            const isHome = l.href === "/";
            const isActive = isHome
              ? pathname === "/" && !activeHash
              : isHashLink
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
        <button
          type="button"
          className="mainnav-menu-button"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>
      </div>
      <div id="mobile-navigation" className="mainnav-mobile-panel" aria-hidden={!menuOpen}>
        <nav className="mainnav-mobile-links">
          {links.map((l, index) => (
            <a
              key={l.href}
              href={l.href}
              style={{ transitionDelay: menuOpen ? `${index * 35}ms` : "0ms" }}
              onClick={() => setMenuOpen(false)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {l.label}
            </a>
          ))}
        </nav>
        <a className="mainnav-mobile-cta" href="/consultation" onClick={() => setMenuOpen(false)}>
          <span>LET&apos;S TALK</span>
          <Icon.Arrow />
        </a>
      </div>
    </header>
  );
}
