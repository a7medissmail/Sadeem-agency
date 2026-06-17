"use client";

import { motion } from "framer-motion";
import RevealSection from "./RevealSection";
import SectionLabel from "./SectionLabel";

const fit = [
  "Founder-led SMEs with real revenue and something to scale",
  "E-commerce & D2C brands that can't yet see what actually pays back",
  "Funded operators building a serious go-to-market — including KSA & the Gulf",
  "Teams who want a partner in the operating seat, not a report on the shelf",
];

const notFit = [
  "Pre-revenue startups looking for free strategy — you need customers first",
  "Anyone shopping for the cheapest media buyer or content shop",
  "Teams who want a 200-slide deck and no intention of changing how they operate",
  "Companies unwilling to put their own people in the room",
];

const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const listItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export default function WhoWeWorkWith() {
  return (
    <RevealSection className="fit dark" data-section="07" id="fit">
      <SectionLabel n="07" text="FIT" onDark />
      <div className="section-inner">
        <motion.div
          className="section-eyebrow on-dark"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
        >
          WHO IT&apos;S FOR
        </motion.div>
        <motion.h2
          className="h2 on-dark"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.55 }}
          transition={{ duration: 0.9, delay: 0.08, ease: [0.2, 0.7, 0.2, 1] }}
        >
          We&apos;re selective<br />
          about <span className="accent">fit.</span>
        </motion.h2>
        <motion.p
          className="body fit-intro"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.55 }}
          transition={{ duration: 0.8, delay: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
        >
          We work with a small number of teams at a time, so we&apos;d rather be honest
          early about where we do our best work — and where we don&apos;t.
        </motion.p>
        <div className="fit-grid">
          <motion.div
            className="fit-col fit-yes"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={listContainer}
          >
            <h3>We do our best work with</h3>
            <ul>
              {fit.map((item) => (
                <motion.li key={item} variants={listItem} transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}>
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            className="fit-col fit-no"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={listContainer}
          >
            <h3>We&apos;re not the right fit for</h3>
            <ul>
              {notFit.map((item) => (
                <motion.li key={item} variants={listItem} transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}>
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </RevealSection>
  );
}
