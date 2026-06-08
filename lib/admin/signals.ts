/**
 * lib/admin/signals.ts
 * ────────────────────
 * Shared signal-loading logic used by:
 *   - app/admin/(authed)/layout.tsx   (SSR initial load)
 *   - app/api/admin/signals/route.ts  (client-side polling endpoint)
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type AdminSignal = {
  kind: string;
  title: string;
  detail: string;
  href: string;
  when: string; // formatted display string
  at: string;   // ISO timestamp — used for unread comparison client-side
  tone?: "accent" | "muted";
};

export type AdminBadgeCounts = {
  leads: number;        // status = 'new'
  bookings: number;     // scheduled + upcoming + no meet link
  applications: number; // status = 'new'
  proposals: number;    // status = 'submitted' (client filled brief, awaiting review)
};

const signalDateFmt = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function signalWhen(value: string) {
  try {
    return signalDateFmt.format(new Date(value));
  } catch {
    return "recently";
  }
}

export async function loadAdminSignals(): Promise<AdminSignal[]> {
  try {
    const admin = getSupabaseAdmin();

    const [leads, bookings, applications, campaigns, proposals, quotations] = await Promise.all([
      admin
        .from("leads")
        .select("name, email, source, created_at")
        .order("created_at", { ascending: false })
        .limit(3),
      admin
        .from("bookings")
        .select("name, email, slot_start, meet_link, status, created_at")
        .order("created_at", { ascending: false })
        .limit(3),
      admin
        .from("applications")
        .select("name, email, status, created_at")
        .order("created_at", { ascending: false })
        .limit(3),
      admin
        .from("email_campaigns")
        .select("subject, status, created_at, sent_at")
        .order("created_at", { ascending: false })
        .limit(2),
      admin
        .from("proposals")
        .select("title, client_name, client_email, submitted_at")
        .not("submitted_at", "is", null)
        .order("submitted_at", { ascending: false })
        .limit(3),
      admin
        .from("quotations")
        .select("title, accepted_at, declined_at, total, currency")
        .or("status.eq.accepted,status.eq.declined")
        .order("accepted_at", { ascending: false, nullsFirst: false })
        .limit(4),
    ]);

    const raw: Array<{ sortAt: string } & Omit<AdminSignal, "at">> = [
      ...(leads.data ?? []).map((lead) => ({
        sortAt: lead.created_at,
        kind: "Lead",
        title: `${lead.name} entered via ${lead.source}.`,
        detail: lead.email,
        href: "/admin/leads",
        when: signalWhen(lead.created_at),
      })),
      ...(bookings.data ?? []).map((booking) => ({
        sortAt: booking.created_at,
        kind: "Booking",
        title: `${booking.name} reserved a consultation.`,
        detail: `${booking.meet_link ? "Meeting link attached" : `${booking.status} — link pending`} · ${signalWhen(booking.slot_start)}`,
        href: "/admin/bookings",
        when: signalWhen(booking.created_at),
        tone: (booking.meet_link ? "muted" : "accent") as "muted" | "accent",
      })),
      ...(applications.data ?? []).map((application) => ({
        sortAt: application.created_at,
        kind: "Hiring",
        title: `${application.name} is in ${application.status}.`,
        detail: application.email,
        href: "/admin/applications",
        when: signalWhen(application.created_at),
      })),
      ...(campaigns.data ?? []).map((campaign) => ({
        sortAt: campaign.sent_at ?? campaign.created_at,
        kind: "Dispatch",
        title: campaign.subject,
        detail: campaign.status,
        href: "/admin/campaigns",
        when: signalWhen(campaign.sent_at ?? campaign.created_at),
        tone: "muted" as const,
      })),
      ...(proposals.data ?? [])
        .filter((p) => p.submitted_at)
        .map((p) => ({
          sortAt: p.submitted_at as string,
          kind: "Brief",
          title: `${p.client_name} submitted "${p.title}".`,
          detail: p.client_email,
          href: "/admin/proposals",
          when: signalWhen(p.submitted_at as string),
          tone: "accent" as const,
        })),
      ...(quotations.data ?? [])
        .filter((q) => q.accepted_at || q.declined_at)
        .map((q) => {
          const isAccepted = !!q.accepted_at;
          const at = (q.accepted_at ?? q.declined_at) as string;
          const fmtTotal = new Intl.NumberFormat("en", {
            style: "currency",
            currency: q.currency ?? "SAR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(q.total ?? 0);
          return {
            sortAt: at,
            kind: "Quote",
            title: isAccepted
              ? `"${q.title}" accepted — ${fmtTotal}`
              : `"${q.title}" declined.`,
            detail: isAccepted ? "Proposal converted" : "Client declined the quotation",
            href: "/admin/proposals",
            when: signalWhen(at),
            tone: (isAccepted ? "accent" : "muted") as "accent" | "muted",
          };
        }),
    ];

    return raw
      .sort((a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime())
      .slice(0, 12)
      .map(({ sortAt, ...signal }) => ({ ...signal, at: sortAt }));
  } catch {
    return [];
  }
}

/** Per-section "needs attention" counts shown as nav badges. */
export async function loadBadgeCounts(): Promise<AdminBadgeCounts> {
  try {
    const admin = getSupabaseAdmin();
    const now = new Date().toISOString();

    const [leads, bookings, applications, proposals] = await Promise.all([
      admin
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("status", "new"),
      admin
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "scheduled")
        .is("meet_link", null)
        .gte("slot_start", now),
      admin
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "new"),
      admin
        .from("proposals")
        .select("id", { count: "exact", head: true })
        .eq("status", "submitted"),
    ]);

    return {
      leads: Math.min(99, leads.count ?? 0),
      bookings: Math.min(99, bookings.count ?? 0),
      applications: Math.min(99, applications.count ?? 0),
      proposals: Math.min(99, proposals.count ?? 0),
    };
  } catch {
    return { leads: 0, bookings: 0, applications: 0, proposals: 0 };
  }
}
