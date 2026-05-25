import Link from "next/link";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { deleteTeamMemberAction, toggleTeamMemberActiveAction } from "./actions";

export const metadata = { title: "Team - SADEEM Admin" };

async function loadTeamMembers() {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("team_members")
      .select("id, name, role, bio, photo_url, sort_order, is_active")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;
    return { members: data ?? [], error: null as string | null };
  } catch (err) {
    return { members: [], error: err instanceof Error ? err.message : "Unknown error" };
  }
}

function MetricCard({ label, value, hint }: { label: string; value: number | string; hint: string }) {
  return (
    <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">{label}</p>
      <div className="mt-3 text-[30px] font-semibold leading-none text-[var(--admin-text)]">{value}</div>
      <p className="mt-3 text-[12.5px] text-[var(--admin-muted)]">{hint}</p>
    </div>
  );
}

export default async function TeamAdminPage() {
  await requireRole(["admin", "editor", "viewer"]);
  const { members, error } = await loadTeamMembers();
  const activeCount = members.filter((member) => member.is_active).length;
  const photographedCount = members.filter((member) => member.photo_url).length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="PEOPLE"
        title="Team"
        description="Manage the public roster and keep the team page grounded, senior, and selective."
        actions={
          <Link href="/admin/team/new">
            <Button>New member</Button>
          </Link>
        }
      />

      {error ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200">
          Couldn&apos;t load team members: <code>{error}</code>
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--admin-accent)]">Roster OS</p>
          <h2 className="mt-2 max-w-[13ch] text-[34px] font-semibold leading-[1.02] tracking-tight text-[var(--admin-text)]">
            Small enough to stay close.
          </h2>
          <p className="mt-4 max-w-[68ch] text-[14.5px] leading-relaxed text-[var(--admin-muted)]">
            Each profile controls public visibility, sort order, biography, and the portrait used across the cinematic team page.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Profiles" value={members.length} hint="All team records" />
          <MetricCard label="Live" value={activeCount} hint="Visible publicly" />
          <MetricCard label="Photos" value={photographedCount} hint="With portraits" />
        </div>
      </section>

      {members.length === 0 ? (
        <div className="border border-dashed border-[var(--admin-border)] bg-[var(--admin-panel)] px-5 py-12 text-center text-[13px] text-[var(--admin-subtle)]">
          No team members yet. Add the first profile.
        </div>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {members.map((member) => (
            <article key={member.id} className="group overflow-hidden border border-[var(--admin-border)] bg-[var(--admin-panel)] transition-colors hover:border-[var(--admin-accent)]">
              <Link href={`/admin/team/${member.id}`} className="block">
                <div className="relative aspect-[4/3] bg-[var(--admin-surface-strong)]">
                  {member.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={member.photo_url} alt="" className="h-full w-full object-cover opacity-85 grayscale transition duration-500 group-hover:scale-[1.03] group-hover:grayscale-0" />
                  ) : (
                    <div className="grid h-full place-items-center text-[46px] font-semibold text-[var(--admin-subtle)]">
                      {member.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/12 to-transparent" />
                  <div className="absolute left-4 top-4 flex items-center gap-2">
                    <Badge tone={member.is_active ? "green" : "neutral"}>{member.is_active ? "Live" : "Off"}</Badge>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">#{member.sort_order}</span>
                  </div>
                </div>
              </Link>

              <div className="p-5">
                <Link href={`/admin/team/${member.id}`} className="block text-[24px] font-semibold leading-tight text-[var(--admin-text)] hover:text-[var(--admin-accent)]">
                  {member.name}
                </Link>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-accent)]">{member.role || "Role not set"}</p>
                <p className="mt-4 line-clamp-3 min-h-[62px] text-[13.5px] leading-relaxed text-[var(--admin-muted)]">
                  {member.bio || "No bio yet."}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[var(--admin-border-soft)] pt-4">
                  <form action={toggleTeamMemberActiveAction}>
                    <input type="hidden" name="id" value={member.id} />
                    <input type="hidden" name="next" value={member.is_active ? "off" : "on"} />
                    <Button type="submit" variant={member.is_active ? "ghost" : "outline"} size="sm">
                      {member.is_active ? "Turn off" : "Publish"}
                    </Button>
                  </form>
                  <form action={deleteTeamMemberAction}>
                    <input type="hidden" name="id" value={member.id} />
                    <Button type="submit" variant="danger" size="sm">
                      Delete
                    </Button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
