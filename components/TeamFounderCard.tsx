"use client";

import { motion } from "framer-motion";
import Image from "next/image";

type TeamFounderCardProps = {
  index: number;
  name: string;
  role: string | null;
  credential?: string | null;
  bio: string | null;
  photoUrl: string | null;
  onSelect?: () => void;
};

export default function TeamFounderCard({ index, name, role, credential, bio, photoUrl, onSelect }: TeamFounderCardProps) {
  const interactive = Boolean(onSelect);
  return (
    <motion.article
      className={`team-founder-card${interactive ? " is-interactive" : ""}`}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{
        opacity: 1,
        y: 0,
        transition: { duration: 0.58, delay: index * 0.08, ease: [0.2, 0.7, 0.2, 1] },
      }}
      whileHover={{ y: -5, transition: { duration: 0.28, ease: [0.2, 0.7, 0.2, 1] } }}
      viewport={{ once: true, amount: 0.24 }}
      {...(interactive
        ? {
            role: "button" as const,
            tabIndex: 0,
            "aria-label": `View ${name}`,
            onClick: onSelect,
            onKeyDown: (event: React.KeyboardEvent) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect?.();
              }
            },
          }
        : {})}
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
        {credential ? <p className="team-founder-credential">{credential}</p> : null}
        {bio ? <p className="team-founder-focus">{bio}</p> : null}
      </div>
      <span className="team-founder-plus" aria-hidden="true">
        +
      </span>
    </motion.article>
  );
}
