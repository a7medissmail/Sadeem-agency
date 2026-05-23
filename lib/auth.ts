// Auth helpers — read the current user + profile, enforce admin roles.
import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Role = Database["public"]["Tables"]["profiles"]["Row"]["role"];

export async function getCurrentUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  return profile ? { ...profile, email: user.email ?? null } : null;
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
