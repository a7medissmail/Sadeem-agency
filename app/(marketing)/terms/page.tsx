import Footer from "@/components/Footer";
import SectionAwareNavbar from "@/components/SectionAwareNavbar";
import SectionLabel from "@/components/SectionLabel";

export const metadata = {
  title: "Terms",
  description: "Basic terms for using the SADEEM website and submitting information.",
};

const sections = [
  {
    title: "Website use",
    body:
      "The SADEEM website is provided for general information and communication. You agree not to misuse the site, interfere with its operation, or submit unlawful, misleading, or harmful content.",
  },
  {
    title: "No automatic engagement",
    body:
      "Submitting a form, booking a consultation, or applying for a role does not automatically create a client, employment, partnership, or advisory relationship. Any formal engagement will be governed by a separate written agreement.",
  },
  {
    title: "Content and materials",
    body:
      "Website text, visuals, brand assets, and design are owned by or licensed to SADEEM. You may not copy, reuse, or redistribute them commercially without permission.",
  },
  {
    title: "Bookings and communication",
    body:
      "Consultation availability may change. SADEEM may reschedule, decline, or follow up for more context when needed. Calendar invites and emails are provided to make coordination easier.",
  },
  {
    title: "Limitation",
    body:
      "The website is provided as-is. We work to keep it accurate and available, but we cannot guarantee uninterrupted access or that every piece of information is complete for your specific situation.",
  },
];

export default function TermsPage() {
  return (
    <>
      <SectionAwareNavbar initialOverDark />
      <main className="page legal-page">
        <section className="legal-hero dark" data-section="01">
          <SectionLabel n="01" text="TERMS" onDark />
          <div className="section-inner legal-hero-inner">
            <p className="team-brief-kicker">WEBSITE TERMS</p>
            <h1 className="display legal-title">
              Simple rules.
              <br />
              <span>Clear expectations.</span>
            </h1>
            <p>
              These terms cover use of the SADEEM website and the information you submit through public forms and
              booking flows.
            </p>
          </div>
        </section>

        <section className="legal-body light" data-section="02">
          <div className="section-inner legal-grid">
            <aside>
              <p className="team-brief-kicker">LAST UPDATED</p>
              <strong>May 25, 2026</strong>
              <span>Formal client work is governed by separate engagement terms.</span>
            </aside>
            <div className="legal-copy">
              {sections.map((section, index) => (
                <article key={section.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h2>{section.title}</h2>
                  <p>{section.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
