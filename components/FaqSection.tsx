"use client";

import { motion } from "framer-motion";
import RevealSection from "./RevealSection";
import SectionLabel from "./SectionLabel";

const faqs = [
  {
    q: "Are you a consultancy or an agency?",
    a: "Neither, exactly. We're a growth advisory: we build the strategy and the operating system, and we stay close to execution. We don't run your ad account forever — we build the engine and the discipline so your team, or your vendors, can run it.",
  },
  {
    q: "Do you do media buying or digital marketing management?",
    a: "Yes — but not the way an agency sells it. We don't bill media by the hour. We build the growth engine, make the spend accountable to your margin, then run or oversee the execution as part of a system with a weekly scorecard. If you only want the cheapest hands on an ad account, we're not your fit — and we'll tell you early.",
  },
  {
    q: "Can you just run our growth on a monthly retainer?",
    a: "Yes — that's our managed-growth track. A senior operator runs or oversees performance, content, and lifecycle against one set of targets, with a weekly review you sit in. It's a partnership, not a vendor relationship.",
  },
  {
    q: "What does an engagement cost?",
    a: "Most relationships start with a fixed-scope growth diagnostic, then move into a project or a monthly partnership. We'll give you a clear number after a short call — no surprise invoices.",
  },
  {
    q: "How fast do we see results?",
    a: "A diagnostic gives you clarity in 2–4 weeks. Operating results typically show in the first 90 days; compounding shows over a couple of quarters.",
  },
  {
    q: "Do you work outside Egypt and KSA?",
    a: "Our base is Cairo and Riyadh, and that's where we're strongest. We'll take work elsewhere when the fit is right.",
  },
];

const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function FaqSection() {
  return (
    <RevealSection className="faq light" data-section="09" id="faq">
      <SectionLabel n="09" text="FAQ" />
      <div className="section-inner">
        <motion.div
          className="section-eyebrow"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
        >
          QUESTIONS
        </motion.div>
        <motion.h2
          className="h2"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.55 }}
          transition={{ duration: 0.9, delay: 0.08, ease: [0.2, 0.7, 0.2, 1] }}
        >
          Before you<br />
          reach <span className="accent">out.</span>
        </motion.h2>
        <motion.div
          className="faq-list"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={listContainer}
        >
          {faqs.map((f) => (
            <motion.div key={f.q} variants={item} transition={{ duration: 0.65, ease: [0.2, 0.7, 0.2, 1] }}>
              <details className="faq-item">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </RevealSection>
  );
}
