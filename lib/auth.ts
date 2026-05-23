// Auth helpers — read the current user + profile, enforce admin roles.
import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Role = Database["public"]["Tables"]["profiles"]["Row"]["role"];

function envOk() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

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

export async function getCurrentProfile() {
  if (!envOk()) return null;
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, role, full_name, avatar_url")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("[auth] profile read failed:", error.message);
      return null;
    }
    return profile ? { ...profile, email: user.email ?? null } : null;
  } catch (err) {
    console.error("[auth] getCurrentProfile threw:", err);
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function requireRole(allowed: Role[]) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/admin/login");
  if (!allowed.includes(profile.role)) redirect("/admin?error=forbidden");
  return profile;
}
