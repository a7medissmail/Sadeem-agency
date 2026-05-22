"use client";

import { motion } from "framer-motion";
import RevealSection from "./RevealSection";
import SectionLabel from "./SectionLabel";
import { Icon } from "./Icons";

const steps = [
  { Glyph: Icon.Target, n: "01", title: "Discover", body: "Market clarity" },
  { Glyph: Icon.Chart, n: "02", title: "Design", body: "Strategic system" },
  { Glyph: Icon.Team, n: "03", title: "Deliver", body: "Disciplined execution" },
  { Glyph: Icon.Trend, n: "04", title: "Scale", body: "Sustained momentum" },
];

export default function ApproachSection() {
  return (
    <RevealSection className="framework light" data-section="04" id="approach">
      <SectionLabel n="04" text="OUR APPROACH" />
      <div className="framework-orbit" aria-hidden="true" />
      <div className="framework-mountains" aria-hidden="true" />
      <div className="section-inner framework-grid">
        <div className="framework-intro">
          <motion.div
            className="section-eyebrow"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.55 }}
            transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
          >
            OUR APPROACH
          </motion.div>
          <motion.h2
            className="h2"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.55 }}
            transition={{ duration: 0.9, delay: 0.08, ease: [0.2, 0.7, 0.2, 1] }}
          >
            A proven<br />
            framework<br />
            for <span className="accent">sustainable</span><br />
            <span className="accent">growth.</span>
          </motion.h2>
          <motion.p
            className="body"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.55 }}
            transition={{ duration: 0.8, delay: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
          >
            Our integrated approach aligns strategy, operations, and marketing
            into one operating system - compounding growth quarter over quarter.
          </motion.p>
          <motion.a
            className="cta-link dark"
            href="#services"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.55 }}
            transition={{ duration: 0.75, delay: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <span>EXPLORE FRAMEWORK</span>
            <Icon.Arrow />
          </motion.a>
        </div>

        <motion.div
          className="framework-panel"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.12 }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.1, delayChildren: 0.18 } },
          }}
        >
          <div className="framework-timeline" aria-hidden="true">
            {steps.map((s) => (
              <div className="framework-node" key={s.n}>
                <span>{s.n}</span>
              </div>
            ))}
          </div>

          <div className="framework-steps">
            {steps.map((s) => (
              <motion.div
                className="flow-step"
                key={s.n}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  show: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.82, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <div className="flow-ring">
                  <s.Glyph s={38} />
                </div>
                <div className="flow-title">{s.title}</div>
                <div className="flow-accent" />
                <div className="flow-body">{s.body}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </RevealSection>
  );
}
