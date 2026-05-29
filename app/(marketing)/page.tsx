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
import { getPublicClientSection } from "@/lib/site/clients";

export const revalidate = 300;

export default async function Home() {
  const { section, anchor, grid } = await getPublicClientSection();

  return (
    <div className="page">
      <SectionAwareNavbar initialOverDark />
      <main>
        <HeroSlider />
        <AboutSection />
        <ProblemSection />
        <ApproachSection />
        <ServicesSection />
        <WhySadeem />
        <CasesSection />
        <ClientsSection section={section} anchor={anchor} grid={grid} />
        <FinalCTA />
        <ContactSection />
        <Footer />
      </main>
    </div>
  );
}
