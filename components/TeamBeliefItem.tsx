"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";

type TeamBeliefItemProps = {
  index: number;
  title: string;
  body: string;
  children: ReactNode;
};

export default function TeamBeliefItem({ index, title, body, children }: TeamBeliefItemProps) {
  return (
    <motion.article
      className="team-belief-item"
      initial={{ opacity: 0, y: 42, scale: 0.96 }}
      whileInView={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.68, delay: index * 0.08, ease: [0.2, 0.7, 0.2, 1] },
      }}
      whileHover={{ y: -12, transition: { duration: 0.32, ease: [0.2, 0.7, 0.2, 1] } }}
      viewport={{ once: false, amount: 0.42 }}
    >
      <div className="team-belief-icon">{children}</div>
      <h3>{title}</h3>
      <p>{body}</p>
    </motion.article>
  );
}
