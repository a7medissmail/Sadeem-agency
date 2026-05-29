"use client";

import { useState } from "react";
import TeamFounderCard from "./TeamFounderCard";
import TeamMemberModal, { type TeamMemberDetail } from "./TeamMemberModal";

export default function TeamGrid({ members }: { members: TeamMemberDetail[] }) {
  const [selected, setSelected] = useState<TeamMemberDetail | null>(null);

  return (
    <>
      <div className="team-founder-grid">
        {members.map((member, index) => (
          <TeamFounderCard
            key={member.id}
            index={index}
            name={member.name}
            role={member.role}
            credential={member.credential}
            bio={member.bio}
            photoUrl={member.photo_url}
            onSelect={() => setSelected(member)}
          />
        ))}
      </div>
      <TeamMemberModal member={selected} onClose={() => setSelected(null)} />
    </>
  );
}
