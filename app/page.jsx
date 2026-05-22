"use client";

import { useEffect, useState } from "react";
import { useScrollY } from "@/components/SmoothScroll";
import MainNavbar from "@/components/MainNavbar";
import HeroSlider from "@/components/HeroSlider";
import AboutSection from "@/components/AboutSection";
import ProblemSection from "@/components/ProblemSection";
import ApproachSection from "@/components/ApproachSection";
import ServicesSection from "@/components/ServicesSection";
import WhySadeem from "@/components/WhySadeem";
import CasesSection from "@/components/CasesSection";
import ClientsSection from "@/components/ClientsSection";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export default function Home() {
  const scrollY = useScrollY();
  const [overDark, setOverDark] = useState(true); // hero is dark

  // Swap navbar between dark/light depending on the section beneath it.
  // Use rendered viewport rects (not scrollY math) so it stays correct even
  // when Lenis's virtual scroll and the browser's native scroll position differ.
  useEffect(() => {
    const sampleY = 50; // viewport coordinate just below the navbar's center
    const sections = document.querySelectorAll("section, footer.footer");
    let isDark = true;
    for (const s of sections) {
      const rect = s.getBoundingClientRect();
      if (sampleY >= rect.top && sampleY < rect.bottom) {
        isDark = s.classList.contains("dark") || s.classList.contains("hero");
        break;
      }
    }
    setOverDark(isDark);
  }, [scrollY]);

  return (
    <div className="page">
      <MainNavbar overDark={overDark} />
      <main>
        <HeroSlider scrollY={scrollY} />
        <AboutSection />
        <ProblemSection />
        <ApproachSection />
        <ServicesSection />
        <WhySadeem />
        <CasesSection />
        <ClientsSection />
        <FinalCTA scrollY={scrollY} />
        <Footer />
      </main>
    </div>
  );
}
