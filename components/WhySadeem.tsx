"use client";

import { motion } from "framer-motion";
import RevealSection from "./RevealSection";
import SectionLabel from "./SectionLabel";

// Headline split into lines → words, so each word can reveal on its own.
const headline = [
  [{ t: "We" }, { t: "don't" }, { t: "sell" }, { t: "decks." }],
  [{ t: "We" }, { t: "build" }, { t: "solution", accent: true }, { t: "systems", accent: true }],
  [{ t: "that" }, { t: "compound." }],
];

const principles = [
  { n: "01", title: "Operator DNA", body: "We've built and scaled what we now advise." },
  { n: "02", title: "Integrated approach", body: "Strategy, operations, marketing — one system." },
  { n: "03", title: "Outcomes, not hours", body: "Measured in EBITDA, throughput, and share." },
  { n: "04", title: "Quiet partnership", body: "Beside the founder. No noise. No theater." },
];

const headContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const word = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0 },
};
const barContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};
const principle = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

export default function WhySadeem() {
  return (
    <RevealSection className="why light" data-section="06">
      <SectionLabel n="06" text="WHY SADEEM" />
      <div className="why-atmosphere" aria-hidden="true" />
      <div className="section-inner">
        <div className="section-eyebrow">WHY SADEEM</div>

        <motion.h2
          className="why-title"
          variants={headContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
        >
          {headline.map((line, li) => (
            <span className="why-line" key={li}>
              {line.map((w, wi) => (
                <motion.span
                  className={`why-word${w.accent ? " accent" : ""}`}
                  key={wi}
                  variants={word}
                  transition={{
                    duration: w.accent ? 1.05 : 0.62,
                    ease: [0.2, 0.7, 0.2, 1],
                  }}
                >
                  {w.t}
                </motion.span>
              ))}
            </span>
          ))}
        </motion.h2>

        <motion.div
          className="why-principles"
          variants={barContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          {principles.map((p, i) => (
            <motion.div
              className="why-principle"
              key={i}
              variants={principle}
              transition={{ duration: 0.85, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <span className="why-principle-num">{p.n}</span>
              <h3 className="why-principle-title">{p.title}</h3>
              <p className="why-principle-body">{p.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </RevealSection>
  );
}
