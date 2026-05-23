import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import InviteForm from "./InviteForm";
import { updateUserAction, deleteUserAction } from "./actions";

export const metadata = { title: "Users — SADEEM Admin" };

type Row = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "admin" | "editor" | "viewer";
  created_at: string;
};

async function loadUsers(): Promise<Row[]> {
  const admin = getSupabaseAdmin();
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, full_name, role, created_at")
    .order("created_at", { ascending: false });
  if (error || !profiles) return [];

  // Pair profile rows with auth emails (single admin API call).
  const { data: usersList } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const emailById = new Map<string, string | null>(
    (usersList?.users ?? []).map((u) => [u.id, u.email ?? null])
  );

  return profiles.map((p) => ({
    id: p.id,
    email: emailById.get(p.id) ?? null,
    full_name: p.full_name,
    role: p.role,
    created_at: p.created_at,
  }));
}

export default async function UsersPage() {
  const me = await requireRole(["admin"]);
  const users = await loadUsers();

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-[#ff6a00]">TEAM ACCESS</p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight">Users</h1>
        <p className="mt-2 text-white/55 text-[14px] max-w-[60ch]">
          Manage staff accounts and roles. Only admins can see this page.
        </p>
      </div>

      <InviteForm />

      <section className="border border-white/10 rounded-xl bg-white/[0.02] overflow-hidden">
        <div className="grid grid-cols-[1.4fr_1.6fr_0.9fr_1fr_auto] gap-4 px-5 py-3 border-b border-white/10 font-mono text-[10px] tracking-[0.2em] uppercase text-white/45">
          <div>Name</div>
          <div>Email</div>
          <div>Role</div>
          <div>Joined</div>
          <div></div>
        </div>
        {users.length === 0 ? (
          <div className="px-5 py-8 text-[13.5px] text-white/55">
            No users yet. Invite the first staff member above.
          </div>
        ) : (
          users.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-[1.4fr_1.6fr_0.9fr_1fr_auto] gap-4 px-5 py-3 items-center border-b border-white/5 last:border-0 text-[13.5px]"
            >
              <form action={updateUserAction} className="contents">
                <input type="hidden" name="id" value={u.id} />
                <input
                  name="full_name"
                  defaultValue={u.full_name ?? ""}
                  className="bg-transparent border border-transparent hover:border-white/15 focus:border-[#ff6a00] px-2 py-1.5 outline-none text-white/95"
                />
                <div className="truncate text-white/75">{u.email ?? "—"}</div>
                <select
                  name="role"
                  defaultValue={u.role}
                  disabled={u.id === me.id}
                  className="bg-[#0a0b0d] border border-white/15 px-2 py-1.5 outline-none focus:border-[#ff6a00] text-white/95 disabled:opacity-60"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="font-mono text-[11px] tracking-[0.04em] text-white/55">
                  {new Date(u.created_at).toLocaleDateString()}
                </div>
                <button
                  type="submit"
                  className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#ff6a00] hover:underline"
                >
                  Save
                </button>
              </form>
              {u.id !== me.id ? (
                <form action={deleteUserAction} className="col-span-5 -mt-2 pl-2">
                  <input type="hidden" name="id" value={u.id} />
                  <button
                    type="submit"
                    className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/40 hover:text-red-400"
                  >
                    Delete user
                  </button>
                </form>
              ) : null}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
