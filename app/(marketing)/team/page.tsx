import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import Footer from "@/components/Footer";
import RevealSection from "@/components/RevealSection";
import SectionAwareNavbar from "@/components/SectionAwareNavbar";
import SectionLabel from "@/components/SectionLabel";

export const metadata = {
  title: "Team - SADEEM",
  description: "Meet the operators, strategists, and builders behind SADEEM.",
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

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function socialLinks(socials: Json | null) {
  if (!socials || typeof socials !== "object" || Array.isArray(socials)) return [];
  const labels: Record<string, string> = {
    website: "Website",
    linkedin: "LinkedIn",
    x: "X",
    instagram: "Instagram",
  };

  return Object.entries(labels)
    .map(([key, label]) => {
      const href = socials[key];
      return typeof href === "string" ? { label, href } : null;
    })
    .filter((link): link is { label: string; href: string } => Boolean(link));
}

function TeamPortrait({ member, featured = false }: { member: TeamMember; featured?: boolean }) {
  return (
    <div className={featured ? "team-portrait is-featured" : "team-portrait"}>
      {member.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={member.photo_url} alt="" />
      ) : (
        <div className="team-portrait-fallback">{initials(member.name)}</div>
      )}
    </div>
  );
}

export default async function TeamPage() {
  const members = await loadTeamMembers();

  return (
    <>
      <SectionAwareNavbar initialOverDark />
      <main className="page team-page">
        <RevealSection className="team-hero dark" data-section="01">
          <SectionLabel n="01" text="TEAM" onDark />
          <div className="section-inner team-hero-shell">
            <div className="team-hero-copy">
              <p className="team-kicker">THE PEOPLE BEHIND THE WORK</p>
              <h1 className="display team-hero-title">
                Not a cast. An operating room.
              </h1>
            </div>

            <div className="team-hero-panel">
              <p>
                SADEEM is built by people who move between strategy rooms and operating floors. The team stays small,
                senior, and close to the work.
              </p>
              <div className="team-hero-actions">
                <a href="#roster" className="team-primary">
                  Meet the team
                </a>
                <Link href="/#contact">Work with us</Link>
              </div>
            </div>
          </div>

          <div className="section-inner team-hero-index" aria-label="Team operating cadence">
            <div>
              <span>01</span>
              <strong>Diagnose with operators</strong>
            </div>
            <div>
              <span>02</span>
              <strong>Build the rhythm</strong>
            </div>
            <div>
              <span>03</span>
              <strong>Transfer capability</strong>
            </div>
            <div>
              <span>Team</span>
              <strong>{members.length > 0 ? `${members.length} active profile${members.length === 1 ? "" : "s"}` : "Roster pending"}</strong>
            </div>
          </div>
        </RevealSection>

        <RevealSection className="team-roster light" data-section="02" id="roster">
          <div className="section-inner">
            <div className="team-section-head">
              <p className="team-kicker">ROSTER</p>
              <h2>Small enough to stay close. Senior enough to matter.</h2>
            </div>

            {members.length > 0 ? (
              <div className="team-list">
                {members.map((member, index) => {
                  const links = socialLinks(member.socials);
                  return (
                    <article className="team-row" key={member.id}>
                      <div className="team-row-index">{String(index + 1).padStart(2, "0")}</div>
                      <div className="team-row-name">
                        <h3>{member.name}</h3>
                      </div>
                      <div className="team-row-copy">
                        <p className="team-row-role">{member.role || "SADEEM"}</p>
                        {member.bio ? <div className="team-row-bio">{member.bio}</div> : null}
                        {links.length > 0 ? (
                          <div className="team-socials">
                            {links.map((link) => (
                              <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
                                {link.label}
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <TeamPortrait member={member} />
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="team-empty-state">
                <p className="team-kicker">COMING ONLINE</p>
                <h3>The public team roster is not published yet.</h3>
                <Link href="/#contact">Contact SADEEM</Link>
              </div>
            )}
          </div>
        </RevealSection>

        <RevealSection className="team-principles dark" data-section="03">
          <div className="section-inner team-principles-grid">
            <div>
              <p className="team-kicker">HOW WE WORK</p>
              <h2>Senior attention, practical rhythm, measurable movement.</h2>
            </div>
            <div className="team-principles-list">
              <div>
                <span>01</span>
                <strong>Close to the operator</strong>
                <p>We shape decisions with the people who will carry them, not around them.</p>
              </div>
              <div>
                <span>02</span>
                <strong>Built for transfer</strong>
                <p>The work leaves behind capability, not dependency.</p>
              </div>
              <div>
                <span>03</span>
                <strong>Clear enough to execute</strong>
                <p>Every engagement moves from diagnosis to decisions, owners, and next actions.</p>
              </div>
            </div>
          </div>
        </RevealSection>
      </main>
      <Footer />
    </>
  );
}
