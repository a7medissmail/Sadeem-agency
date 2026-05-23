import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { EmptyState, TableShell } from "@/components/admin/ui/Table";
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

export default async function TeamAdminPage() {
  await requireRole(["admin", "editor", "viewer"]);
  const { members, error } = await loadTeamMembers();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="PEOPLE"
        title="Team"
        description="Manage the public team page. Drag-and-drop can come later; for now, sort order controls the roster."
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

      <TableShell>
        <div
          style={{ gridTemplateColumns: "1.35fr 1fr 0.55fr 0.55fr 0.7fr 0.5fr" }}
          className="grid gap-4 border-b border-white/10 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45"
        >
          <div>Name</div>
          <div>Role</div>
          <div>Order</div>
          <div>Status</div>
          <div>Toggle</div>
          <div></div>
        </div>

        {members.length === 0 ? (
          <EmptyState title="No team members yet." hint="Click 'New member' to build the public team page." />
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              style={{ gridTemplateColumns: "1.35fr 1fr 0.55fr 0.55fr 0.7fr 0.5fr" }}
              className="grid items-center gap-4 border-b border-white/5 px-5 py-3 text-[13.5px] last:border-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                {member.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.photo_url} alt="" className="h-10 w-10 shrink-0 border border-white/10 object-cover" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 bg-white/[0.04] font-mono text-[10px] text-white/55">
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <Link href={`/admin/team/${member.id}`} className="block truncate text-white/95 hover:text-[#ff6a00]">
                    {member.name}
                  </Link>
                  <div className="truncate font-mono text-[11px] text-white/40">{member.bio || "No bio yet"}</div>
                </div>
              </div>
              <div className="truncate text-white/70">{member.role || "-"}</div>
              <div className="font-mono text-[11px] text-white/65">{member.sort_order}</div>
              <div>
                <Badge tone={member.is_active ? "green" : "neutral"}>{member.is_active ? "Live" : "Off"}</Badge>
              </div>
              <form action={toggleTeamMemberActiveAction}>
                <input type="hidden" name="id" value={member.id} />
                <input type="hidden" name="next" value={member.is_active ? "off" : "on"} />
                <Button type="submit" variant={member.is_active ? "ghost" : "outline"} size="sm">
                  {member.is_active ? "Turn off" : "Turn on"}
                </Button>
              </form>
              <form action={deleteTeamMemberAction}>
                <input type="hidden" name="id" value={member.id} />
                <Button type="submit" variant="danger" size="sm">
                  Del
                </Button>
              </form>
            </div>
          ))
        )}
      </TableShell>
    </div>
  );
}
