import Link from "next/link";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { defaultClientSection } from "@/lib/site/clients";
import type { Database } from "@/types/database";
import {
  deleteClientPartnerAction,
  setSortOrderAction,
  toggleClientPartnerActiveAction,
} from "@/lib/actions/clients";
import { DeleteConfirmButton } from "@/components/admin/ui/DeleteConfirmButton";
import ClientSectionForm from "./ClientSectionForm";

export const metadata = { title: "Clients - SADEEM Admin" };

type SectionRow = Database["public"]["Tables"]["client_section"]["Row"];
type PartnerRow = Database["public"]["Tables"]["client_partners"]["Row"];

async function loadData(): Promise<{
  section: SectionRow;
  partners: PartnerRow[];
  error: string | null;
}> {
  const fallback: SectionRow = {
    id: true,
    eyebrow: defaultClientSection.eyebrow,
    meta_accent: defaultClientSection.metaAccent,
    meta_value: defaultClientSection.metaValue,
    foot: defaultClientSection.foot,
    nda_count: defaultClientSection.ndaCount,
    nda_label: defaultClientSection.ndaLabel,
    updated_at: new Date().toISOString(),
  };

  try {
    const admin = getSupabaseAdmin();
    const [sectionRes, partnersRes] = await Promise.all([
      admin.from("client_section").select("*").eq("id", true).maybeSingle(),
      admin
        .from("client_partners")
        .select("id, name, caption, logo_url, role, sort_order, is_active, created_at, updated_at")
        .order("role", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

    return {
      section: (sectionRes.data as SectionRow | null) ?? fallback,
      partners: (partnersRes.data ?? []) as PartnerRow[],
      error: sectionRes.error?.message ?? partnersRes.error?.message ?? null,
    };
  } catch (err) {
    return {
      section: fallback,
      partners: [],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

function MetricCard({ label, value, hint }: { label: string; value: number | string; hint: string }) {
  return (
    <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">{label}</p>
      <div className="mt-3 text-[30px] font-semibold leading-none text-[var(--admin-text)]">{value}</div>
      <p className="mt-3 text-[12.5px] text-[var(--admin-muted)]">{hint}</p>
    </div>
  );
}

function FlashBanner({ updated }: { updated?: string }) {
  if (!updated) return null;
  const messages: Record<string, string> = {
    section: "Section text saved.",
    created: "Partner added.",
    updated: "Partner updated.",
  };
  const text = messages[updated] ?? "Saved.";
  return (
    <div className="border border-emerald-400/25 bg-emerald-500/[0.08] px-4 py-3 text-[13px] text-emerald-200">
      {text}
    </div>
  );
}

export default async function ClientsAdminPage({
  searchParams,
}: {
  searchParams: { updated?: string };
}) {
  await requireRole(["admin", "editor", "viewer"]);
  const { section, partners, error } = await loadData();
  const anchorCount = partners.filter((p) => p.role === "anchor" && p.is_active).length;
  const activeGrid = partners.filter((p) => p.role === "grid" && p.is_active).length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="SECTION 08"
        title="Clients"
        description="Edit the public clients section: header text, partner list, anchor, and the NDA tile."
        actions={
          <Link href="/admin/clients/new">
            <Button>Add partner</Button>
          </Link>
        }
      />

      <FlashBanner updated={searchParams.updated} />

      {error ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200">
          Couldn&apos;t load clients data: <code>{error}</code>
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--admin-accent)]">Editorial frame</p>
          <h2 className="mt-2 max-w-[18ch] text-[34px] font-semibold leading-[1.02] tracking-tight text-[var(--admin-text)]">
            One anchor. Seven witnesses. One promise.
          </h2>
          <p className="mt-4 max-w-[68ch] text-[14.5px] leading-relaxed text-[var(--admin-muted)]">
            The anchor sits at full size on the left. The remaining active partners fill the 2-row grid in sort order. The
            &ldquo;+N under NDA&rdquo; tile is the last slot of the bottom row.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Partners" value={partners.length} hint="Anchor + grid + hidden" />
          <MetricCard label="Anchor" value={anchorCount} hint="Active anchors (max 1)" />
          <MetricCard label="Grid" value={activeGrid} hint="Visible in the 4×2 grid" />
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--admin-subtle)]">
          Section text
        </h2>
        <ClientSectionForm section={section} />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--admin-subtle)]">
            Partner list
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--admin-subtle)]">
            {partners.length} {partners.length === 1 ? "record" : "records"}
          </p>
        </div>

        {partners.length === 0 ? (
          <div className="border border-dashed border-[var(--admin-border)] bg-[var(--admin-panel)] px-5 py-12 text-center text-[13px] text-[var(--admin-subtle)]">
            No partners yet. Run migration 0018 then add the first partner.
          </div>
        ) : (
          <div className="overflow-hidden border border-[var(--admin-border)] bg-[var(--admin-panel)]">
            <table className="w-full text-left text-[13.5px]">
              <thead className="border-b border-[var(--admin-border)] bg-[var(--admin-surface-strong)]">
                <tr className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--admin-subtle)]">
                  <th className="px-4 py-3">Logo</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--admin-border-soft)] last:border-b-0">
                    <td className="px-4 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.logo_url}
                        alt={p.name}
                        className="h-10 w-24 object-contain"
                        style={{ filter: "grayscale(1) brightness(0) opacity(0.6)" }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/clients/${p.id}`} className="font-medium text-[var(--admin-text)] hover:text-[var(--admin-accent)]">
                        {p.name}
                      </Link>
                      {p.caption ? (
                        <p className="mt-1 line-clamp-1 text-[12px] text-[var(--admin-muted)]">{p.caption}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={p.role === "anchor" ? "orange" : "neutral"}>
                        {p.role === "anchor" ? "Anchor" : "Grid"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <form action={setSortOrderAction} className="flex items-center gap-1">
                        <input type="hidden" name="id" value={p.id} />
                        <input
                          type="number"
                          name="sort_order"
                          defaultValue={p.sort_order}
                          min="0"
                          className="w-14 border border-[var(--admin-border)] bg-[var(--admin-input)] px-2 py-1 font-mono text-[12px] text-[var(--admin-text)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-accent)]"
                        />
                        <button
                          type="submit"
                          className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] border border-[var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-subtle)] hover:text-[var(--admin-text)] transition-colors"
                        >
                          Set
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={p.is_active ? "green" : "neutral"}>{p.is_active ? "Live" : "Off"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <form action={toggleClientPartnerActiveAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="next" value={p.is_active ? "off" : "on"} />
                          <Button type="submit" variant={p.is_active ? "ghost" : "outline"} size="sm">
                            {p.is_active ? "Hide" : "Show"}
                          </Button>
                        </form>
                        <Link href={`/admin/clients/${p.id}`}>
                          <Button variant="outline" size="sm">Edit</Button>
                        </Link>
                        <DeleteConfirmButton
                          action={deleteClientPartnerAction}
                          id={p.id}
                          message={`Delete "${p.name}"? This cannot be undone.`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
