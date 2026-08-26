"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { loginSchema } from "@/lib/validation/user";

export type LoginResult = { error?: string };

export async function loginAction(_prev: LoginResult, formData: FormData): Promise<LoginResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid credentials" };
  }

  // Throttle before touching the auth server. Supabase applies its own limits,
  // but they are per-project and generous; this caps what one address can try.
  // 10 in ten minutes is far above a person mistyping a password and far below
  // anything that makes guessing worthwhile.
  const limit = await checkRateLimit({ action: "admin-login", max: 10, windowSeconds: 600 });
  if (!limit.ok) return { error: limit.reason };

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // Deliberately one message for both "no such account" and "wrong password":
  // telling them apart tells an attacker which addresses are worth attacking.
  if (error) return { error: "Invalid email or password" };

  const next = (formData.get("next") as string) || "/admin";
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function signOutAction() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
