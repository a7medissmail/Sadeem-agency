// Fire-and-forget portal status advancement, called during /p/[token] and
// /q/[token] server renders AFTER the token has been verified.
//
// Deliberately NOT server actions: exporting these from a "use server" file
// would make them public POST endpoints keyed by raw row ids. As plain
// server-only functions they are unreachable from the network.
import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function recordProposalOpen(proposalId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  // Only update to 'opened' if currently 'sent' (idempotent)
  await admin
    .from("proposals")
    .update({ status: "opened", opened_at: new Date().toISOString() })
    .eq("id", proposalId)
    .in("status", ["sent"]);
}

export async function recordQuotationView(quotationId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  await admin
    .from("quotations")
    .update({ status: "viewed", viewed_at: new Date().toISOString() })
    .eq("id", quotationId)
    .in("status", ["sent"]); // idempotent: only advance from 'sent'
}
