"use client";

import { useEffect, useState } from "react";
import { useScrollY } from "./SmoothScroll";
import MainNavbar from "./MainNavbar";

function isDarkSection(section: Element | null) {
  if (!section) return false;
  return (
    section.classList.contains("dark") ||
    section.classList.contains("hero") ||
    section.getAttribute("data-nav-theme") === "dark"
  );
}

function sectionUnderNavbar(initialOverDark: boolean) {
  if (typeof window === "undefined") return initialOverDark;

  const maxX = Math.max(window.innerWidth - 1, 1);
  const sampleY = Math.min(56, Math.max(window.innerHeight - 1, 1));
  const sampleXs = [
    window.innerWidth / 2,
    Math.min(maxX, 120),
    Math.max(1, maxX - 120),
  ];

  for (const sampleX of sampleXs) {
    const elements = document.elementsFromPoint(sampleX, sampleY);

    for (const element of elements) {
      if (element.closest(".mainnav")) continue;
      const section = element.closest("section, footer.footer");
      if (section) return isDarkSection(section);
    }
  }

  const sections = document.querySelectorAll("section, footer.footer");
  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    if (sampleY >= rect.top && sampleY < rect.bottom) return isDarkSection(section);
  }

  return initialOverDark;
}

export default function SectionAwareNavbar({ initialOverDark = false }: { initialOverDark?: boolean }) {
  const scrollY = useScrollY();
  const [overDark, setOverDark] = useState(initialOverDark);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setOverDark(sectionUnderNavbar(initialOverDark)));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [initialOverDark, scrollY]);

  return <MainNavbar overDark={overDark} />;
}
