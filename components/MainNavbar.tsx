"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icons";
import { SadeemMark } from "./marks";

const links = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Our approach", href: "#approach" },
  { label: "Industries", href: "#industries" },
  { label: "Success stories", href: "#cases" },
  { label: "Insights", href: "#insights" },
  { label: "Contact", href: "#contact" },
];

export default function MainNavbar({ overDark }: { overDark: boolean }) {
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    const updateHash = () => setActiveHash(window.location.hash || "");
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  return (
    <header className={`mainnav ${overDark ? "is-dark" : "is-light"}`}>
      <div className="mainnav-inner">
        <SadeemMark dark={!overDark} />
        <nav className="mainnav-links">
          {links.map((l) => (
            <a key={l.href} href={l.href} className={activeHash === l.href ? "is-active" : undefined}>
              {l.label}
            </a>
          ))}
        </nav>
        <a className="mainnav-cta" href="#contact">
          <span>LET&apos;S TALK</span>
          <Icon.Arrow />
        </a>
      </div>
    </header>
  );
}
