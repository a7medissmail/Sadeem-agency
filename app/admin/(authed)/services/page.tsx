export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { DeleteServiceButton } from "./DeleteServiceButton";

export const metadata = { title: "Services - SADEEM Admin" };

function MetricCard({ label, value, hint }: { label: string; value: number | string; hint: string }) {
  return (
    <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">{label}</p>
      <div className="mt-3 text-[30px] font-semibold leading-none text-[var(--admin-text)]">{value}</div>
      <p className="mt-3 text-[12.5px] text-[var(--admin-muted)]">{hint}</p>
    </div>
  );
}

async function loadData() {
  try {
    const admin = getSupabaseAdmin();
    const [catResult, svcResult] = await Promise.all([
      admin
        .from("service_categories")
        .select("id, slug, label, tagline, sort_order")
        .order("sort_order", { ascending: true }),
      admin
        .from("services")
        .select("id, slug, title, category, tagline, is_published, sort_order")
        .order("sort_order", { ascending: true })
        .order("title", { ascending: true }),
    ]);
    return {
      categories: catResult.data ?? [],
      services: svcResult.data ?? [],
      error: (catResult.error ?? svcResult.error)?.message ?? null,
    };
  } catch (err) {
    return { categories: [], services: [], error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export default async function ServicesAdminPage() {
  await requireRole(["admin", "editor"]);
  const { categories, services, error } = await loadData();

  const publishedCount = services.filter((s) => s.is_published).length;

  // Build a map: category slug → services[]
  const byCategory: Record<string, typeof services> = {};
  for (const svc of services) {
    if (!byCategory[svc.category]) byCategory[svc.category] = [];
    byCategory[svc.category].push(svc);
  }

  // Services whose category doesn't exist in the table yet
  const categorySlugs = new Set(categories.map((c) => c.slug));
  const uncategorized = services.filter((s) => !categorySlugs.has(s.category));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="CONTENT"
        title="Services"
        description="Manage the service pages shown on the public website."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/services/categories">
              <Button variant="ghost" size="sm">Manage categories</Button>
            </Link>
            <Link href="/admin/services/new">
              <Button>+ New service</Button>
            </Link>
          </div>
        }
      />

      {error ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200">
          Couldn&apos;t load data: <code>{error}</code>
        </div>
      ) : null}

      {/* Overview */}
      <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--admin-accent)]">Service Library</p>
          <h2 className="mt-2 max-w-[14ch] text-[34px] font-semibold leading-[1.02] tracking-tight text-[var(--admin-text)]">
            Expertise that earns attention.
          </h2>
          <p className="mt-4 max-w-[68ch] text-[14.5px] leading-relaxed text-[var(--admin-muted)]">
            Each service controls a public page — title, tagline, category, full body copy, and the deliverables list.
            Published services appear on the website; drafts are invisible to visitors.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Total" value={services.length} hint="All service records" />
          <MetricCard label="Published" value={publishedCount} hint="Visible publicly" />
          <MetricCard label="Categories" value={categories.length} hint="Service groups" />
        </div>
      </section>

      {services.length === 0 ? (
        <div className="border border-dashed border-[var(--admin-border)] bg-[var(--admin-panel)] px-5 py-12 text-center text-[13px] text-[var(--admin-subtle)]">
          No services yet.{" "}
          <Link href="/admin/services/new" className="text-[var(--admin-accent)] underline-offset-2 hover:underline">
            Create the first service.
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {categories.map((cat) => {
            const items = byCategory[cat.slug] ?? [];
            if (!items.length) return null;
            return (
              <section key={cat.id}>
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--admin-accent)]">
                      {cat.label}
                    </p>
                    {cat.tagline && (
                      <p className="mt-0.5 text-[13px] text-[var(--admin-muted)]">{cat.tagline}</p>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-[var(--admin-subtle)]">
                    {items.length} {items.length === 1 ? "service" : "services"}
                  </span>
                </div>
                <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                  {items.map((service) => (
                    <article
                      key={service.id}
                      className="group overflow-hidden border border-[var(--admin-border)] bg-[var(--admin-panel)] transition-colors hover:border-[var(--admin-accent)]"
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <Link
                            href={`/admin/services/${service.id}`}
                            className="flex-1 min-w-0 text-[17px] font-semibold leading-snug text-[var(--admin-text)] hover:text-[var(--admin-accent)] transition-colors"
                          >
                            {service.title}
                          </Link>
                          <div className="flex-shrink-0 flex items-center gap-2">
                            <span className="font-mono text-[10px] text-[var(--admin-subtle)]">
                              #{service.sort_order}
                            </span>
                            <Badge tone={service.is_published ? "green" : "neutral"}>
                              {service.is_published ? "Published" : "Draft"}
                            </Badge>
                          </div>
                        </div>

                        {service.tagline && (
                          <p className="mt-2 text-[13px] leading-relaxed text-[var(--admin-muted)] line-clamp-2">
                            {service.tagline}
                          </p>
                        )}

                        <div className="mt-4 flex items-center justify-between border-t border-[var(--admin-border-soft)] pt-3">
                          <span className="font-mono text-[10px] text-[var(--admin-subtle)] truncate max-w-[160px]">
                            /{service.slug}
                          </span>
                          <div className="flex items-center gap-3">
                            <a
                              href={`/services/${service.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-[var(--admin-muted)] hover:text-[var(--admin-accent)] transition-colors"
                            >
                              Preview ↗
                            </a>
                            <Link
                              href={`/admin/services/${service.id}`}
                              className="text-xs text-[var(--admin-muted)] hover:text-[var(--admin-text)] transition-colors"
                            >
                              Edit
                            </Link>
                            <DeleteServiceButton id={service.id} title={service.title} />
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}

          {/* Orphaned services (category not found in service_categories table) */}
          {uncategorized.length > 0 && (
            <section>
              <div className="mb-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-400">Uncategorized</p>
                <p className="mt-0.5 text-[13px] text-[var(--admin-muted)]">
                  These services have a category slug not found in the categories table.
                </p>
              </div>
              <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                {uncategorized.map((service) => (
                  <article
                    key={service.id}
                    className="group overflow-hidden border border-amber-500/20 bg-[var(--admin-panel)] transition-colors hover:border-amber-400/50"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={`/admin/services/${service.id}`}
                          className="flex-1 min-w-0 text-[17px] font-semibold leading-snug text-[var(--admin-text)] hover:text-[var(--admin-accent)] transition-colors"
                        >
                          {service.title}
                        </Link>
                        <Badge tone="amber">{service.category}</Badge>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-[var(--admin-border-soft)] pt-3">
                        <span className="font-mono text-[10px] text-[var(--admin-subtle)]">/{service.slug}</span>
                        <div className="flex items-center gap-3">
                          <Link href={`/admin/services/${service.id}`} className="text-xs text-[var(--admin-muted)] hover:text-[var(--admin-text)] transition-colors">
                            Edit
                          </Link>
                          <DeleteServiceButton id={service.id} title={service.title} />
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
