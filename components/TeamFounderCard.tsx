"use client";

import { motion } from "framer-motion";
import Image from "next/image";

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
      initial={{ opacity: 0, y: 28 }}
      whileInView={{
        opacity: 1,
        y: 0,
        transition: { duration: 0.58, delay: index * 0.08, ease: [0.2, 0.7, 0.2, 1] },
      }}
      whileHover={{ y: -5, transition: { duration: 0.28, ease: [0.2, 0.7, 0.2, 1] } }}
      viewport={{ once: true, amount: 0.24 }}
    >
      <div className="team-founder-card-bg" aria-hidden="true">
        {photoUrl ? (
          <Image src={photoUrl} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" />
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
