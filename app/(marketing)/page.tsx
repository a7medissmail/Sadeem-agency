"use client";

import { useScrollY } from "@/components/SmoothScroll";
import SectionAwareNavbar from "@/components/SectionAwareNavbar";
import HeroSlider from "@/components/HeroSlider";
import AboutSection from "@/components/AboutSection";
import ProblemSection from "@/components/ProblemSection";
import ApproachSection from "@/components/ApproachSection";
import ServicesSection from "@/components/ServicesSection";
import WhySadeem from "@/components/WhySadeem";
import CasesSection from "@/components/CasesSection";
import ClientsSection from "@/components/ClientsSection";
import FinalCTA from "@/components/FinalCTA";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export default function Home() {
  const scrollY = useScrollY();

  return (
    <div className="page">
      <SectionAwareNavbar initialOverDark />
      <main>
        <HeroSlider scrollY={scrollY} />
        <AboutSection />
        <ProblemSection />
        <ApproachSection />
        <ServicesSection />
        <WhySadeem />
        <CasesSection />
        <ClientsSection />
        <FinalCTA />
        <ContactSection />
        <Footer />
      </main>
    </div>
  );
}
