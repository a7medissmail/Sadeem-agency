import Link from "next/link";
import Footer from "@/components/Footer";
import SectionAwareNavbar from "@/components/SectionAwareNavbar";
import SectionLabel from "@/components/SectionLabel";
import { Icon } from "@/components/Icons";

export const metadata = {
  title: "Thank you - SADEEM",
  description: "Your message reached SADEEM.",
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <>
      <SectionAwareNavbar initialOverDark />
      <main className="page thankyou-page">
        <section className="stories-hero dark" data-section="01">
          <SectionLabel n="01" text="THANK YOU" onDark />
          <div className="stories-hero-bg" aria-hidden="true" />
          <div className="section-inner stories-hero-inner">
            <div>
              <p className="team-brief-kicker">RECEIVED</p>
              <h1 className="display stories-hero-title">
                Got it — <span>thank you.</span>
              </h1>
              <p>
                Your message reached us. Someone from SADEEM — not a sales rep — will reply
                within one business day, usually with a couple of sharp questions and a
                suggested next step.
              </p>
              <div className="thankyou-actions">
                <Link href="/success-stories" className="cta-link on-dark">
                  <span>SEE OUR WORK</span>
                  <Icon.Arrow />
                </Link>
                <Link href="/" className="cta-link on-dark sm">
                  <span>BACK TO HOME</span>
                  <Icon.Arrow />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
