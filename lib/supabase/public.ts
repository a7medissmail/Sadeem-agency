// Cookieless anon Supabase client for PUBLIC, cacheable reads.
// Server-only. Uses the anon key, so RLS is enforced exactly as for an
// anonymous visitor (public-read policies only) — no draft/unpublished leakage.
//
// Unlike createSupabaseServerClient (which binds to request cookies and forces
// dynamic rendering), this client reads no cookies, so pages that use it can be
// statically rendered / ISR-cached.
import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

let cached: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabasePublic() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Supabase public env missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  }
  cached = createClient<Database>(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
