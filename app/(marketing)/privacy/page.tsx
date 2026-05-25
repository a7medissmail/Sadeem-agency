import Footer from "@/components/Footer";
import SectionAwareNavbar from "@/components/SectionAwareNavbar";
import SectionLabel from "@/components/SectionLabel";

export const metadata = {
  title: "Privacy",
  description: "How SADEEM handles website, lead, booking, and application information.",
};

const sections = [
  {
    title: "Information we collect",
    body:
      "When you contact SADEEM, register interest in a workshop, book a consultation, apply for a role, or subscribe to updates, we collect the information you choose to submit. This may include your name, email, phone number, company, message, booking details, application materials, and related communication history.",
  },
  {
    title: "How we use it",
    body:
      "We use this information to respond to inquiries, manage consultations and workshops, review applications, operate our CRM, send relevant transactional emails, and improve how the website and services work.",
  },
  {
    title: "Service providers",
    body:
      "We use trusted service providers for hosting, database, storage, email delivery, and calendar workflows. These providers process information only as needed to support the website and SADEEM operations.",
  },
  {
    title: "Marketing email",
    body:
      "If you receive marketing updates from SADEEM, you can unsubscribe using the link in the email. Transactional messages, such as booking confirmations or application updates, may still be sent when needed.",
  },
  {
    title: "Retention and access",
    body:
      "We keep information for as long as it is useful for the relationship, required for operations, or needed for legal and administrative reasons. You can contact us to request access, correction, or deletion where applicable.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <SectionAwareNavbar initialOverDark />
      <main className="page legal-page">
        <section className="legal-hero dark" data-section="01">
          <SectionLabel n="01" text="PRIVACY" onDark />
          <div className="section-inner legal-hero-inner">
            <p className="team-brief-kicker">PRIVACY NOTICE</p>
            <h1 className="display legal-title">
              Clear handling.
              <br />
              <span>Practical care.</span>
            </h1>
            <p>
              This notice explains how SADEEM handles information submitted through the website, admin-backed forms, and
              related communication flows.
            </p>
          </div>
        </section>

        <section className="legal-body light" data-section="02">
          <div className="section-inner legal-grid">
            <aside>
              <p className="team-brief-kicker">LAST UPDATED</p>
              <strong>May 25, 2026</strong>
              <span>For privacy questions, contact hello@sadeem.agency.</span>
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
