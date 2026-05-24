import Footer from "@/components/Footer";
import ConsultationBooking from "@/components/ConsultationBooking";
import RevealSection from "@/components/RevealSection";
import SectionAwareNavbar from "@/components/SectionAwareNavbar";
import SectionLabel from "@/components/SectionLabel";

export const metadata = {
  title: "Consultation - SADEEM",
  description: "Book a strategic consultation with SADEEM.",
};

export default function ConsultationPage() {
  return (
    <>
      <SectionAwareNavbar initialOverDark />
      <main className="page consultation-page">
        <RevealSection className="consult-hero dark" data-section="01">
          <SectionLabel n="01" text="CONSULTATION" onDark />
          <div className="consult-hero-bg" aria-hidden="true" />
          <div className="section-inner consult-hero-inner">
            <div className="consult-hero-copy">
              <p className="team-brief-kicker">STRATEGIC ROOM</p>
              <h1 className="display consult-hero-title">
                Book the room
                <br />
                <span>where decisions move.</span>
              </h1>
              <p>
                A focused consultation for founders and operators who need clarity on growth, execution, and the next
                practical move.
              </p>
              <a href="#booking" className="team-line-cta">
                <span>CHOOSE A SLOT</span>
                <span aria-hidden>-&gt;</span>
              </a>
            </div>
          </div>
        </RevealSection>

        <RevealSection className="consult-booking light" data-section="02" id="booking">
          <div className="section-inner consult-booking-grid">
            <div className="consult-booking-copy">
              <p className="team-brief-kicker">CUSTOM BOOKING</p>
              <h2>
                Pick a precise
                <br />
                <span>operating window.</span>
              </h2>
              <p>
                The calendar below reads SADEEM availability, removes busy time, and reserves a Google Meet once you
                submit.
              </p>
              <div className="consult-booking-notes">
                <div>
                  <span>01</span>
                  <strong>Availability is live</strong>
                </div>
                <div>
                  <span>02</span>
                  <strong>Calendar invite included</strong>
                </div>
                <div>
                  <span>03</span>
                  <strong>Team notified instantly</strong>
                </div>
              </div>
            </div>

            <ConsultationBooking />
          </div>
        </RevealSection>

        <RevealSection className="consult-principles dark" data-section="03">
          <SectionLabel n="03" text="WHAT TO EXPECT" onDark />
          <div className="section-inner consult-principles-grid">
            <div>
              <p className="team-brief-kicker">INSIDE THE SESSION</p>
              <h2>
                Less advice.
                <br />
                <span>More operating clarity.</span>
              </h2>
            </div>
            <div className="consult-principle-list">
              {[
                ["Diagnose", "We isolate the real constraint behind the visible symptoms."],
                ["Prioritize", "We choose the next move that can create measurable momentum."],
                ["Transfer", "You leave with language, owners, and actions your team can carry."],
              ].map(([title, body], index) => (
                <article key={title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </RevealSection>
      </main>
      <Footer />
    </>
  );
}
