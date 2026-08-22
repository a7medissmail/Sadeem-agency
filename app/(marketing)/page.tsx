import type { ComponentType } from "react";
import SectionAwareNavbar from "@/components/SectionAwareNavbar";
import HeroSlider from "@/components/HeroSlider";
import AboutSection from "@/components/AboutSection";
import ProblemSection from "@/components/ProblemSection";
import ApproachSection from "@/components/ApproachSection";
import ServicesSection from "@/components/ServicesSection";
import WhySadeem from "@/components/WhySadeem";
import WhoWeWorkWith from "@/components/WhoWeWorkWith";
import CasesSection from "@/components/CasesSection";
import ClientsSection from "@/components/ClientsSection";
import FaqSection from "@/components/FaqSection";
import FinalCTA from "@/components/FinalCTA";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import { getPublicClientSection } from "@/lib/site/clients";
import { getHomeSectionLayout, type HomeSectionKey } from "@/lib/site/homeSections";

export const revalidate = 300;

/**
 * Which component renders each registry key. The registry (lib/site/homeSections.ts)
 * owns the metadata and the DB owns visibility + order; this map is the only place
 * that knows about JSX, so the admin never has to.
 *
 * Every section takes an `n` prop — its editorial number, derived from position
 * among enabled sections. Nothing hardcodes a number any more.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SECTION_COMPONENTS: Record<HomeSectionKey, ComponentType<any>> = {
  hero: HeroSlider,
  about: AboutSection,
  problem: ProblemSection,
  approach: ApproachSection,
  services: ServicesSection,
  why: WhySadeem,
  fit: WhoWeWorkWith,
  faq: FaqSection,
  cases: CasesSection,
  clients: ClientsSection,
  "final-cta": FinalCTA,
  contact: ContactSection,
};

export default async function Home() {
  const [{ section, anchor, grid }, layout] = await Promise.all([
    getPublicClientSection(),
    getHomeSectionLayout(),
  ]);

  // Props that only some sections need, keyed by registry key.
  const extraProps: Partial<Record<HomeSectionKey, Record<string, unknown>>> = {
    clients: { section, anchor, grid },
  };

  const visible = layout.filter((entry) => entry.enabled);

  return (
    <div className="page">
      <SectionAwareNavbar initialOverDark />
      <main>
        {visible.map((entry) => {
          const Section = SECTION_COMPONENTS[entry.key];
          if (!Section) return null;
          return <Section key={entry.key} n={entry.number} {...(extraProps[entry.key] ?? {})} />;
        })}
        <Footer />
      </main>
    </div>
  );
}
