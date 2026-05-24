"use client";

import { motion } from "framer-motion";

type TeamFounderCardProps = {
  index: number;
  name: string;
  role: string | null;
  bio: string | null;
  photoUrl: string | null;
};

export default function TeamFounderCard({ index, name, role, bio, photoUrl }: TeamFounderCardProps) {
  return (
    <motion.article
      className="team-founder-card"
      initial={{ opacity: 0, y: 58, scale: 0.96, filter: "blur(10px)" }}
      whileInView={{
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        transition: { duration: 0.78, delay: index * 0.1, ease: [0.2, 0.7, 0.2, 1] },
      }}
      whileHover={{ y: -14, scale: 1.015, transition: { duration: 0.36, ease: [0.2, 0.7, 0.2, 1] } }}
      viewport={{ once: false, amount: 0.32 }}
    >
      <div className="team-founder-card-bg" aria-hidden="true">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" />
        ) : null}
      </div>
      <div className="team-founder-number">{String(index + 1).padStart(2, "0")}</div>
      <div className="team-founder-line" />
      <div className="team-founder-copy">
        <p className="team-founder-role">{role || "SADEEM"}</p>
        <h3>{name}</h3>
        {bio ? <p className="team-founder-focus">{bio}</p> : null}
      </div>
      <span className="team-founder-plus" aria-hidden="true">
        +
      </span>
    </motion.article>
  );
}
