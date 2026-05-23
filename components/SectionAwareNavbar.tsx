"use client";

import { useEffect, useState } from "react";
import { useScrollY } from "./SmoothScroll";
import MainNavbar from "./MainNavbar";

export default function SectionAwareNavbar({ initialOverDark = false }: { initialOverDark?: boolean }) {
  const scrollY = useScrollY();
  const [overDark, setOverDark] = useState(initialOverDark);

  useEffect(() => {
    const sampleY = 50;
    const sections = document.querySelectorAll("section, footer.footer");
    let next = initialOverDark;

    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (sampleY >= rect.top && sampleY < rect.bottom) {
        next = section.classList.contains("dark") || section.classList.contains("hero");
        break;
      }
    }

    setOverDark(next);
  }, [initialOverDark, scrollY]);

  return <MainNavbar overDark={overDark} />;
}
