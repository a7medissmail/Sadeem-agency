/**
 * lib/audit.ts
 * ────────────
 * Best-effort audit logging for destructive admin actions.
 * Failures are swallowed — the primary operation is never blocked.
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function logAudit({
  tableName,
  recordId,
  action,
  actorId,
  actorName,
  meta,
}: {
  tableName: string;
  recordId: string;
  action: "delete" | "update";
  actorId: string | null;
  actorName: string | null;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = getSupabaseAdmin();
    await admin.from("audit_log").insert({
      table_name: tableName,
      record_id:  recordId,
      action,
      actor_id:   actorId   ?? null,
      actor_name: actorName ?? null,
      meta:       meta      ?? null,
    });
  } catch {
    // best-effort — never block the primary operation
  }
}
