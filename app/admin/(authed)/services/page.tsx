export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Badge } from "@/components/admin/ui/Badge";
import { CATEGORY_LABELS, type ServiceCategory } from "@/lib/validation/service";
import { DeleteServiceButton } from "./DeleteServiceButton";

export const metadata = { title: "Services - SADEEM Admin" };

async function loadServices() {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("services")
    .select("id, slug, title, category, tagline, is_published, sort_order")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });
  return data ?? [];
}

export default async function ServicesAdminPage() {
  await requireRole(["admin", "editor"]);
  const services = await loadServices();

  const byCategory = {
    strategy:   services.filter((s) => s.category === "strategy"),
    enablement: services.filter((s) => s.category === "enablement"),
    execution:  services.filter((s) => s.category === "execution"),
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="CONTENT"
        title="Services"
        description="Manage the service pages shown on the public website."
        actions={<Link href="/admin/services/new" className="admin-btn-primary">+ New service</Link>}
      />

      {services.length === 0 ? (
        <div className="admin-empty">
          <p>No services yet.</p>
          <Link href="/admin/services/new" className="admin-btn-primary">Create first service</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {(["strategy", "enablement", "execution"] as ServiceCategory[]).map((cat) => {
            const items = byCategory[cat];
            if (!items.length) return null;
            return (
              <div key={cat}>
                <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-[var(--admin-accent)] mb-3">
                  {CATEGORY_LABELS[cat]}
                </p>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Title</th>
                        <th>Slug</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((service) => (
                        <tr key={service.id}>
                          <td className="w-10 text-[var(--admin-muted)] font-mono text-xs">
                            {service.sort_order}
                          </td>
                          <td>
                            <Link
                              href={`/admin/services/${service.id}`}
                              className="font-medium hover:text-[var(--admin-accent)] transition-colors"
                            >
                              {service.title}
                            </Link>
                            {service.tagline && (
                              <p className="text-xs text-[var(--admin-muted)] mt-0.5 truncate max-w-[320px]">
                                {service.tagline}
                              </p>
                            )}
                          </td>
                          <td className="font-mono text-xs text-[var(--admin-muted)]">
                            {service.slug}
                          </td>
                          <td>
                            <Badge tone={service.is_published ? "green" : "neutral"}>
                              {service.is_published ? "Published" : "Draft"}
                            </Badge>
                          </td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-3">
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
