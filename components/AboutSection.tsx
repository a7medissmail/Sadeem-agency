"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import RevealSection from "./RevealSection";
import SectionLabel from "./SectionLabel";
import { Icon } from "./Icons";

const stats = [
  { Glyph: Icon.Trophy, value: 15, suffix: "+", label: ["Years of", "Experience"] },
  { Glyph: Icon.Users, value: 200, suffix: "+", label: ["Engagements", "Delivered"] },
  { Glyph: Icon.Globe, value: 30, suffix: "+", label: ["Industries", "Impacted"] },
];

function CountUp({ value, suffix = "", active }: { value: number; suffix?: string; active: boolean }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!active) return;
    const duration = 1350;
    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCurrent(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, value]);

  return (
    <span aria-label={`${value}${suffix}`}>
      {current}
      {suffix}
    </span>
  );
}

export default function AboutSection() {
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, amount: 0.45 });

  return (
    <RevealSection className="about light" data-section="02" id="about">
      <SectionLabel n="02" text="ABOUT SADEEM" />
      <div className="about-atmosphere" aria-hidden="true" />
      <div className="about-mountains" aria-hidden="true" />
      <div className="section-inner about-grid">
        <div className="about-copy">
          <motion.div
            className="section-eyebrow"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
          >
            ABOUT SADEEM
          </motion.div>
          <motion.h2
            className="h2"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.55 }}
            transition={{ duration: 0.95, delay: 0.08, ease: [0.2, 0.7, 0.2, 1] }}
          >
            We turn ambition<br />
            into <span className="accent">measurable impact.</span>
          </motion.h2>
          <motion.p
            className="body"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.55 }}
            transition={{ duration: 0.85, delay: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
          >
            Sadeem is a strategic growth advisory firm working with ambitious
            companies and high-growth SMEs - translating business potential into
            disciplined, scalable, measurable execution.
          </motion.p>
          <motion.a
            className="cta-link dark"
            href="#approach"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.55 }}
            transition={{ duration: 0.75, delay: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <span>LEARN MORE</span>
            <Icon.Arrow />
          </motion.a>
        </div>
        <motion.div
          className="stats"
          ref={statsRef}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.13, delayChildren: 0.18 } },
          }}
        >
          {stats.map((s, i) => (
            <motion.div
              className="stat"
              key={i}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.85, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <div className="stat-icon">
                <s.Glyph />
              </div>
              <div className="stat-num">
                <CountUp value={s.value} suffix={s.suffix} active={statsInView} />
              </div>
              <div className="stat-label">
                {s.label.map((l, j) => (
                  <span key={j}>{l}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </RevealSection>
  );
}
