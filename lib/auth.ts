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
  if (!envOk()) redirect("/admin/login");

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No session at all — the login page is the right answer.
  if (!user) redirect("/admin/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (error) console.error("[auth] profile read failed:", error.message);

  // Signed in, but not staff (or the profile row is unreadable). This must not
  // redirect to /admin — that is the page asking the question — and it must not
  // redirect to /admin/login either, because middleware sends signed-in users
  // straight back. /admin/no-access is the one exit that terminates.
  if (!profile || !allowed.includes(profile.role)) redirect("/admin/no-access");

  return { ...profile, email: user.email ?? null };
}
