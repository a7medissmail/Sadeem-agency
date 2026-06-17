"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Icon } from "./Icons";

export type ServiceCardItem = {
  icon: ReactNode;
  title: string;
  tagline: string;
  body: string;
  href: string;
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.14 } },
};

const cardReveal = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0 },
};

// Client grid so the cards reveal with the same staggered motion as the
// Problem/Approach cards. The reveal lives on a wrapper div, so the inner
// <a> keeps its CSS hover lift (framer's inline transform would otherwise
// override the :hover transform).
export default function ServicesGrid({ items }: { items: ServiceCardItem[] }) {
  return (
    <motion.div
      className="services-grid"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      variants={container}
    >
      {items.map((it, i) => (
        <motion.div
          className="s-card-wrap"
          key={it.href + i}
          variants={cardReveal}
          transition={{ duration: 0.82, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <a className="s-card" href={it.href}>
            <div className="s-card-index">0{i + 1}</div>
            <div className="s-card-icon">{it.icon}</div>
            <h3 className="s-card-title">{it.title}</h3>
            {it.tagline ? <p className="s-card-tagline">{it.tagline}</p> : null}
            <p className="s-card-body">{it.body}</p>
            <div className="s-card-arrow">
              <Icon.Arrow />
            </div>
          </a>
        </motion.div>
      ))}
    </motion.div>
  );
}
