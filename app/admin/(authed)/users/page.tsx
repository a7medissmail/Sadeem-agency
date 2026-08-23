import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { Input, Select } from "@/components/admin/ui/Field";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import InviteForm from "./InviteForm";
import { deleteUserAction, updateUserAction } from "./actions";
import { DeleteConfirmButton } from "@/components/admin/ui/DeleteConfirmButton";
import { MetricCard } from "@/components/admin/ui/Stats";

export const metadata = { title: "Users - SADEEM Admin" };

type Row = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "admin" | "editor" | "viewer";
  created_at: string;
};

async function loadUsers(): Promise<{ users: Row[]; error: string | null }> {
  try {
    const admin = getSupabaseAdmin();
    const { data: profiles, error } = await admin
      .from("profiles")
      .select("id, full_name, role, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (!profiles) return { users: [], error: null };

    const { data: usersList } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const emailById = new Map<string, string | null>(
      (usersList?.users ?? []).map((user) => [user.id, user.email ?? null]),
    );

    return {
      users: profiles.map((profile) => ({
        id: profile.id,
        email: emailById.get(profile.id) ?? null,
        full_name: profile.full_name,
        role: profile.role,
        created_at: profile.created_at,
      })),
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[admin/users] load failed:", message);
    return { users: [], error: message };
  }
}

function roleTone(role: Row["role"]) {
  if (role === "admin") return "orange" as const;
  if (role === "editor") return "blue" as const;
  return "neutral" as const;
}

export default async function UsersPage() {
  const me = await requireRole(["admin"]);
  const { users, error: loadError } = await loadUsers();
  const adminCount = users.filter((user) => user.role === "admin").length;
  const editorCount = users.filter((user) => user.role === "editor").length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="TEAM ACCESS"
        title="Users & Roles"
        description="Manage staff access. This is the beginning of the stronger RBAC layer."
      />

      {loadError ? (
        <div className="border border-[color-mix(in_srgb,var(--sdm-status-warning)_30%,transparent)] bg-[color-mix(in_srgb,var(--sdm-status-warning)_6%,transparent)] text-[var(--sdm-text-warning)] text-[13px] rounded-md px-4 py-3">
          Couldn&apos;t load users: <code className="text-[var(--sdm-text-warning)]">{loadError}</code>
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <MetricCard label="Users" value={users.length} hint="Staff profiles" />
        <MetricCard label="Admins" value={adminCount} hint="Full access" />
        <MetricCard label="Editors" value={editorCount} hint="Content operators" />
      </section>

      <InviteForm />

      {users.length === 0 ? (
        <div className="border border-dashed border-[var(--admin-border)] bg-[var(--admin-panel)] px-5 py-12 text-center text-[13px] text-[var(--admin-subtle)]">
          No users yet. Invite the first staff member above.
        </div>
      ) : (
        <section className="grid gap-3">
          {users.map((user) => (
            <article key={user.id} className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
              <form action={updateUserAction} className="grid gap-4 xl:grid-cols-[1.2fr_1.3fr_0.7fr_0.7fr_auto] xl:items-center">
                <input type="hidden" name="id" value={user.id} />
                <div className="min-w-0">
                  <Input name="full_name" defaultValue={user.full_name ?? ""} className="w-full text-[15px] font-semibold" />
                  <p className="mt-2 sdm-eyebrow text-[var(--admin-subtle)]">{user.id === me.id ? "Current user" : "Staff user"}</p>
                </div>
                <div className="truncate text-[13px] text-[var(--admin-muted)]">{user.email ?? "-"}</div>
                <div>
                  <Badge tone={roleTone(user.role)}>{user.role}</Badge>
                </div>
                <Select name="role" defaultValue={user.role} disabled={user.id === me.id}>
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </Select>
                <div className="flex items-center gap-2 xl:justify-end">
                  <Button type="submit" variant="outline" size="sm" disabled={user.id === me.id}>Save</Button>
                </div>
              </form>
              <div className="mt-3 flex items-center justify-between border-t border-[var(--admin-border-soft)] pt-3">
                <span className="sdm-eyebrow text-[var(--admin-subtle)]">
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </span>
                {user.id !== me.id ? (
                  <DeleteConfirmButton
                    action={deleteUserAction}
                    id={user.id}
                    label="Delete user"
                    message={`Delete user ${user.email ?? user.id}? This cannot be undone.`}
                  />
                ) : null}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
