import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import Footer from "@/components/Footer";
import RevealSection from "@/components/RevealSection";
import SectionAwareNavbar from "@/components/SectionAwareNavbar";
import SectionLabel from "@/components/SectionLabel";
import TeamBeliefItem from "@/components/TeamBeliefItem";
import TeamFounderCard from "@/components/TeamFounderCard";
import { Icon } from "@/components/Icons";

export const metadata = {
  title: "Team - SADEEM",
  description: "Three founders. One operating system.",
};

type TeamMember = {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  photo_url: string | null;
  socials: Json | null;
  sort_order: number;
};

const beliefs = [
  {
    icon: <Icon.Target s={38} />,
    title: "Operator DNA",
    body: "We think like operators and build like owners.",
  },
  {
    icon: <Icon.Merge s={38} />,
    title: "Integrated Thinking",
    body: "Strategy, execution, and growth - connected from day one.",
  },
  {
    icon: <Icon.Team s={38} />,
    title: "Quiet Partnership",
    body: "We listen first, challenge honestly, and stay invisible in the process.",
  },
  {
    icon: <Icon.Trend s={38} />,
    title: "Measurable Outcomes",
    body: "We measure what matters and deliver what moves the needle.",
  },
];

async function loadTeamMembers(): Promise<TeamMember[]> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("team_members")
      .select("id, name, role, bio, photo_url, socials, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function TeamPage() {
  const members = await loadTeamMembers();
  const memberCount = members.length;

  return (
    <>
      <SectionAwareNavbar initialOverDark />
      <main className="page team-page">
        <section className="team-brief-hero dark" data-section="01">
          <SectionLabel n="01" text="TEAM" onDark />
          <div className="team-hero-bg" aria-hidden="true" />
          <div className="team-orbit team-orbit-hero" aria-hidden="true" />
          <div className="section-inner team-brief-hero-inner">
            <div className="team-brief-copy">
              <p className="team-brief-kicker">OUR TEAM</p>
              <h1 className="display team-brief-title">
                Three founders.
                <br />
                <span>One operating system.</span>
              </h1>
              <p>
                We bring together strategy, operations, and growth expertise to build solutions that compound.
              </p>
              <a href="#founders" className="team-line-cta">
                <span>OUR STORY</span>
                <Icon.Arrow />
              </a>
            </div>
          </div>
        </section>

        <RevealSection className="team-founders light" data-section="02" id="founders">
          <div className="section-inner">
            <div className="team-founders-head">
              <div>
                <p className="team-brief-kicker">FOUNDERS</p>
                <h2>
                  Different expertise.
                  <br />
                  Unified <span>mission.</span>
                </h2>
              </div>
              <div className="team-founders-controls" aria-hidden="true">
                <span>
                  {memberCount > 0 ? "01" : "00"} / <strong>{String(memberCount).padStart(2, "0")}</strong>
                </span>
              </div>
            </div>

            {members.length > 0 ? (
              <div className="team-founder-grid">
                {members.map((member, index) => (
                  <TeamFounderCard
                    bio={member.bio}
                    index={index}
                    key={member.id}
                    name={member.name}
                    photoUrl={member.photo_url}
                    role={member.role}
                  />
                ))}
              </div>
            ) : (
              <div className="team-founders-empty">
                <p>No active team members are published yet.</p>
                <span>Publish a profile from /admin/team to show it here.</span>
              </div>
            )}
          </div>
        </RevealSection>

        <RevealSection className="team-belief dark" data-section="03">
          <div className="team-orbit team-orbit-belief" aria-hidden="true" />
          <div className="section-inner team-belief-grid">
            <div className="team-belief-copy">
              <p className="team-brief-kicker">WHAT WE BELIEVE</p>
              <h2>
                We don&apos;t work
                <br />
                above teams.
                <br />
                We work <span>beside them.</span>
              </h2>
            </div>

            <div className="team-belief-list">
              {beliefs.map((belief, index) => (
                <TeamBeliefItem body={belief.body} index={index} key={belief.title} title={belief.title}>
                  {belief.icon}
                </TeamBeliefItem>
              ))}
            </div>
          </div>
        </RevealSection>

        <RevealSection className="team-future light" data-section="04">
          <div className="team-future-image" aria-hidden="true" />
          <div className="team-orbit team-orbit-future" aria-hidden="true" />
          <div className="section-inner team-future-inner">
            <div className="team-future-copy">
              <p className="team-brief-kicker">THE FUTURE</p>
              <h2>
                Building the team
                <br />
                around the <span>mission.</span>
              </h2>
              <p>
                We&apos;re assembling exceptional operators, thinkers, and builders who want to create real impact. If
                that&apos;s you, let&apos;s build what&apos;s next - together.
              </p>
              <Link href="/careers" className="team-light-cta">
                <span>EXPLORE CAREERS</span>
                <Icon.Arrow />
              </Link>
            </div>
          </div>
        </RevealSection>
      </main>
      <Footer />
    </>
  );
}
