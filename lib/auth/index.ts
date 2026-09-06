// Auth helpers — read the current user, resolve what they may do, enforce it.
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  type DataScope,
  type PermissionKey,
  type Tier,
  isDataScope,
  isTier,
  resolvePermissions,
} from "./permissions";

export * from "./permissions";

/** @deprecated Tier only. Kept as a name so existing imports keep resolving. */
export type Role = Tier;

export type JobRole = {
  id: string;
  key: string;
  name_ar: string;
  name_en: string;
  data_scope: DataScope;
};

export type Session = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: Tier;
  is_active: boolean;
  jobRole: JobRole | null;
  /** Everything this person may do, tier baseline and template already folded in. */
  permissions: ReadonlySet<PermissionKey>;
  /** 'assigned' means queries must be narrowed to rows they own. */
  scope: DataScope;
};

function envOk() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// ─── Session ──────────────────────────────────────────────────────────────────

/**
 * The whole picture in one place: who is signed in, what tier they hold, which
 * job role they carry, and the permission set that falls out of both.
 *
 * Wrapped in React's `cache` so a request that checks permissions in the
 * layout, again in the page, and again in three server components pays for one
 * round trip rather than five. The cache is per-request; a server action is its
 * own request and resolves fresh, which is what we want — a revoked permission
 * must not survive in a cache the next action reads.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  if (!envOk()) return null;
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, role, full_name, avatar_url, is_active, job_role_id, extra_perms, denied_perms")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      if (error) console.error("[auth] profile read failed:", error.message);
      return null;
    }

    const role: Tier = isTier(profile.role) ? profile.role : "employee";
    const isActive = profile.is_active !== false;

    // Second hop only when there is a template to read. An admin or super admin
    // usually has none, and paying for the join on every request to learn that
    // would be a query spent on nothing.
    let jobRole: JobRole | null = null;
    let jobRolePermissions: string[] | null = null;
    if (profile.job_role_id) {
      const { data: staffRole } = await supabase
        .from("staff_roles")
        .select("id, key, name_ar, name_en, permissions, data_scope")
        .eq("id", profile.job_role_id)
        .single();
      if (staffRole) {
        jobRole = {
          id: staffRole.id,
          key: staffRole.key,
          name_ar: staffRole.name_ar,
          name_en: staffRole.name_en,
          data_scope: isDataScope(staffRole.data_scope) ? staffRole.data_scope : "all",
        };
        jobRolePermissions = staffRole.permissions;
      }
    }

    return {
      id: profile.id,
      email: user.email ?? null,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      role,
      is_active: isActive,
      jobRole,
      permissions: resolvePermissions({
        role,
        isActive,
        jobRolePermissions,
        extraPerms: profile.extra_perms,
        deniedPerms: profile.denied_perms,
      }),
      // Only an employee can be narrowed. Someone running the floor needs to see
      // the whole floor, including the rows nobody has picked up.
      scope: role === "employee" ? (jobRole?.data_scope ?? "all") : "all",
    };
  } catch (err) {
    console.error("[auth] getSession threw:", err);
    return null;
  }
});

// ─── Predicates ───────────────────────────────────────────────────────────────

export function can(session: Session | null, permission: PermissionKey): boolean {
  return Boolean(session?.is_active && session.permissions.has(permission));
}

export function canAny(session: Session | null, permissions: readonly PermissionKey[]): boolean {
  return permissions.some((p) => can(session, p));
}

/** Holds at least one write permission — the new spelling of "is staff". */
export function canWrite(session: Session | null): boolean {
  if (!session?.is_active) return false;
  for (const p of session.permissions) {
    if (p.endsWith(":edit") || p.endsWith(":delete") || p.endsWith(":manage")) return true;
  }
  return false;
}

/** Whether `actor` is allowed to change `target`'s account at all. */
export function canManageUser(actor: Session, targetRole: Tier): boolean {
  if (actor.role === "super_admin") return true;
  // An admin runs the floor, so they may manage employees — but never anyone at
  // their own tier or above, which is what stops an admin minting an equal and
  // stops the hierarchy from being flat in practice.
  if (actor.role === "admin") return targetRole === "employee";
  return false;
}

// ─── Guards ───────────────────────────────────────────────────────────────────
//
// Two different failures, two different exits. No session at all means the login
// page is the right answer. A session that lacks the permission must go to
// /admin/no-access instead: /admin is the page asking the question, and
// middleware bounces signed-in users off /admin/login, so either would loop.

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!session.is_active) redirect("/admin/no-access");
  return session;
}

/** Gate for the admin shell: anyone with any permission at all belongs inside. */
export async function requireStaff(): Promise<Session> {
  const session = await requireSession();
  if (session.permissions.size === 0) redirect("/admin/no-access");
  return session;
}

export async function requirePermission(permission: PermissionKey): Promise<Session> {
  const session = await requireSession();
  if (!session.permissions.has(permission)) redirect("/admin/no-access");
  return session;
}

/** For a page reachable through more than one capability. */
export async function requireAnyPermission(
  permissions: readonly PermissionKey[],
): Promise<Session> {
  const session = await requireSession();
  if (!permissions.some((p) => session.permissions.has(p))) redirect("/admin/no-access");
  return session;
}

// ─── Legacy surface ───────────────────────────────────────────────────────────

/** @deprecated Prefer `getSession`. */
export async function getCurrentUser() {
  if (!envOk()) return null;
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (err) {
    console.error("[auth] getCurrentUser failed:", err);
    return null;
  }
}

/** @deprecated Prefer `getSession` — this shape predates permissions. */
export async function getCurrentProfile() {
  const session = await getSession();
  if (!session) return null;
  return {
    id: session.id,
    role: session.role,
    full_name: session.full_name,
    avatar_url: session.avatar_url,
    email: session.email,
  };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

// requireRole() lived here as a shim over the old admin/editor/viewer enum
// while the call sites were converted. All 119 now ask for a permission by
// name, so the shim is gone: it could not tell `leads:delete` from
// `settings:manage` — the old enum could not either — and leaving it available
// would have let the next page written reintroduce that blindness.
