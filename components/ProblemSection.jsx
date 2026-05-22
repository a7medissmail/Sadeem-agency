"use client";

import { motion } from "framer-motion";
import RevealSection from "./RevealSection";
import SectionLabel from "./SectionLabel";
import { Icon } from "./Icons";

const items = [
  { Glyph: Icon.Question, title: "Unclear strategy", body: "Lack of clarity and direction leads to wasted resources and missed opportunities." },
  { Glyph: Icon.Gap, title: "Execution gap", body: "Good plans fail without disciplined execution and accountability." },
  { Glyph: Icon.Scale, title: "Scalability issues", body: "Systems and structures aren't built to support sustainable growth." },
  { Glyph: Icon.Pressure, title: "Market pressure", body: "Intense competition and rapid change create persistent uncertainty." },
];

export default function ProblemSection() {
  return (
    <RevealSection className="problem dark" data-section="03" id="problem">
      <SectionLabel n="03" text="THE PROBLEM" onDark />
      <div className="problem-atmosphere" aria-hidden="true" />
      <div className="section-inner problem-grid">
        <div className="problem-intro">
          <motion.div
            className="section-eyebrow"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.55 }}
            transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
          >
            THE PROBLEM
          </motion.div>
          <motion.h2
            className="h2"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.55 }}
            transition={{ duration: 0.9, delay: 0.08, ease: [0.2, 0.7, 0.2, 1] }}
          >
            Ambition is<br />
            universal.<br />
            <span className="accent-soft">Growth is</span><br />
            <span className="strike">not</span>.
          </motion.h2>
          <motion.p
            className="body"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.55 }}
            transition={{ duration: 0.8, delay: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
          >
            Most companies face the same four critical pressures that quietly
            stall them just below their next level.
          </motion.p>
          <motion.a
            className="cta-link on-dark problem-cta"
            href="#approach"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.55 }}
            transition={{ duration: 0.75, delay: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <span>DISCOVER MORE</span>
            <Icon.Arrow />
          </motion.a>
        </div>
        <motion.div
          className="problem-cards"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.35 }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.11, delayChildren: 0.16 } },
          }}
        >
          {items.map((it, i) => (
            <motion.div
              className={`p-card p-card-${i + 1}`}
              key={i}
              variants={{
                hidden: { opacity: 0, y: 26 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.82, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <div className="p-card-num">0{i + 1}</div>
              <div className="p-card-icon">
                <it.Glyph s={34} />
              </div>
              <h3 className="p-card-title">{it.title}</h3>
              <p className="p-card-body">{it.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </RevealSection>
  );
}
