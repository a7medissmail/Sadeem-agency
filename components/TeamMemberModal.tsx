"use client";

import { useEffect } from "react";
import { FaLinkedinIn, FaXTwitter, FaInstagram, FaFacebookF, FaGlobe } from "react-icons/fa6";
import type { Json } from "@/types/database";

export type TeamMemberDetail = {
  id: string;
  name: string;
  role: string | null;
  credential: string | null;
  bio: string | null;
  photo_url: string | null;
  socials: Json | null;
};

type SocialKey = "website" | "linkedin" | "x" | "instagram" | "facebook";

const socialMeta: Record<SocialKey, { label: string; Icon: React.ComponentType<{ "aria-hidden"?: boolean }> }> = {
  website: { label: "Website", Icon: FaGlobe },
  linkedin: { label: "LinkedIn", Icon: FaLinkedinIn },
  x: { label: "X / Twitter", Icon: FaXTwitter },
  instagram: { label: "Instagram", Icon: FaInstagram },
  facebook: { label: "Facebook", Icon: FaFacebookF },
};

function socialLinks(socials: Json | null): { key: SocialKey; url: string }[] {
  if (!socials || typeof socials !== "object" || Array.isArray(socials)) return [];
  const record = socials as Record<string, unknown>;
  return (Object.keys(socialMeta) as SocialKey[])
    .map((key) => ({ key, url: typeof record[key] === "string" ? (record[key] as string) : "" }))
    .filter((entry) => /^https?:\/\//i.test(entry.url));
}

export default function TeamMemberModal({
  member,
  onClose,
}: {
  member: TeamMemberDetail | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!member) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [member, onClose]);

  if (!member) return null;

  const links = socialLinks(member.socials);

  return (
    <div className="team-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className={`team-modal${member.photo_url ? " has-photo" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={member.name}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="team-modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {member.photo_url ? (
          <div className="team-modal-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={member.photo_url} alt={member.name} />
          </div>
        ) : null}

        <div className="team-modal-body">
          {member.role ? <p className="team-modal-role">{member.role}</p> : null}
          <h3 className="team-modal-name">{member.name}</h3>
          {member.credential ? <p className="team-modal-credential">{member.credential}</p> : null}

          {member.bio ? <p className="team-modal-bio">{member.bio}</p> : null}

          {links.length > 0 ? (
            <div className="team-modal-socials">
              {links.map(({ key, url }) => {
                const { label, Icon } = socialMeta[key];
                return (
                  <a key={key} href={url} target="_blank" rel="noreferrer" className="social-dot" aria-label={label}>
                    <Icon aria-hidden />
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
