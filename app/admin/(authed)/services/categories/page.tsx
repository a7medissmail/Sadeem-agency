export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Button } from "@/components/admin/ui/Button";
import { DeleteCategoryButton } from "./DeleteCategoryButton";

export const metadata = { title: "Service Categories - SADEEM Admin" };

async function loadCategories() {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("service_categories")
      .select("id, slug, label, tagline, description, sort_order")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return { categories: data ?? [], error: null as string | null };
  } catch (err) {
    return { categories: [], error: err instanceof Error ? err.message : "Unknown error" };
  }
}

async function loadServiceCountByCategory() {
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin.from("services").select("category");
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      counts[row.category] = (counts[row.category] ?? 0) + 1;
    }
    return counts;
  } catch {
    return {} as Record<string, number>;
  }
}

export default async function CategoriesAdminPage() {
  await requireRole(["admin", "editor"]);
  const [{ categories, error }, serviceCounts] = await Promise.all([
    loadCategories(),
    loadServiceCountByCategory(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="SERVICES"
        title="Categories"
        description="Manage the groups that organise your services on the public website."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/services">
              <Button variant="ghost" size="sm">← All services</Button>
            </Link>
            <Link href="/admin/services/categories/new">
              <Button>+ New category</Button>
            </Link>
          </div>
        }
      />

      {error ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200">
          Couldn&apos;t load categories: <code>{error}</code>
        </div>
      ) : null}

      {categories.length === 0 ? (
        <div className="border border-dashed border-[var(--admin-border)] bg-[var(--admin-panel)] px-5 py-12 text-center text-[13px] text-[var(--admin-subtle)]">
          No categories yet.{" "}
          <Link href="/admin/services/categories/new" className="text-[var(--admin-accent)] underline-offset-2 hover:underline">
            Create the first category.
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {categories.map((cat) => (
            <article
              key={cat.id}
              className="group overflow-hidden border border-[var(--admin-border)] bg-[var(--admin-panel)] transition-colors hover:border-[var(--admin-accent)]"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/admin/services/categories/${cat.id}`}
                      className="block text-[18px] font-semibold leading-tight text-[var(--admin-text)] hover:text-[var(--admin-accent)] transition-colors"
                    >
                      {cat.label}
                    </Link>
                    {cat.tagline && (
                      <p className="mt-1 text-[13px] text-[var(--admin-muted)]">{cat.tagline}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <span className="font-mono text-[10px] text-[var(--admin-subtle)]">
                      #{cat.sort_order}
                    </span>
                    <span className="font-mono text-[11px] text-[var(--admin-accent)]">
                      {serviceCounts[cat.slug] ?? 0} services
                    </span>
                  </div>
                </div>

                {cat.description && (
                  <p className="mt-3 text-[13px] leading-relaxed text-[var(--admin-muted)] line-clamp-3">
                    {cat.description}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-[var(--admin-border-soft)] pt-3">
                  <span className="font-mono text-[10px] text-[var(--admin-subtle)]">
                    slug: {cat.slug}
                  </span>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/services/categories/${cat.id}`}
                      className="text-xs text-[var(--admin-muted)] hover:text-[var(--admin-text)] transition-colors"
                    >
                      Edit
                    </Link>
                    <DeleteCategoryButton id={cat.id} label={cat.label} />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
