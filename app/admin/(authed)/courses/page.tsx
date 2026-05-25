import Link from "next/link";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { deleteCourseAction, toggleCourseActiveAction } from "./actions";

export const metadata = { title: "Courses - SADEEM Admin" };

async function loadCourses() {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("courses")
      .select("id, slug, title, summary, location, starts_at, capacity, price, currency, is_active, image_url")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { courses: data ?? [], error: null as string | null };
  } catch (err) {
    return { courses: [], error: err instanceof Error ? err.message : "Unknown error" };
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

export default async function CoursesAdminPage() {
  await requireRole(["admin", "editor", "viewer"]);
  const { courses, error } = await loadCourses();
  const fmt = new Intl.DateTimeFormat("en", { dateStyle: "medium" });
  const activeCount = courses.filter((course) => course.is_active).length;
  const datedCount = courses.filter((course) => course.starts_at).length;
  const priceFmt = (price: number | null, currency: string | null) =>
    price == null ? "Investment TBD" : `${currency ?? "SAR"} ${price.toLocaleString()}`;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="WORKSHOPS"
        title="Workshops"
        description="Publish and control cohort announcements without losing the public rhythm."
        actions={
          <Link href="/admin/courses/new">
            <Button>New workshop</Button>
          </Link>
        }
      />

      {error ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200">
          Couldn&apos;t load workshops: <code>{error}</code>
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--admin-accent)]">Content OS</p>
          <h2 className="mt-2 max-w-[13ch] text-[34px] font-semibold leading-[1.02] tracking-tight text-[var(--admin-text)]">
            Cohorts that can go live in one decision.
          </h2>
          <p className="mt-4 max-w-[68ch] text-[14.5px] leading-relaxed text-[var(--admin-muted)]">
            Each workshop card keeps the public state, date, location, capacity, price, and cover signal close to the action.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Total" value={courses.length} hint="All workshops" />
          <MetricCard label="Live" value={activeCount} hint="Visible publicly" />
          <MetricCard label="Dated" value={datedCount} hint="Has start date" />
        </div>
      </section>

      {courses.length === 0 ? (
        <div className="border border-dashed border-[var(--admin-border)] bg-[var(--admin-panel)] px-5 py-12 text-center text-[13px] text-[var(--admin-subtle)]">
          No workshops yet. Create the first cohort announcement.
        </div>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {courses.map((course) => (
            <article key={course.id} className="group overflow-hidden border border-[var(--admin-border)] bg-[var(--admin-panel)] transition-colors hover:border-[var(--admin-accent)]">
              <Link href={`/admin/courses/${course.id}`} className="block">
                <div className="relative aspect-[16/9] bg-[var(--admin-surface-strong)]">
                  {course.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={course.image_url} alt="" className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-[1.03]" />
                  ) : (
                    <div className="grid h-full place-items-center font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">
                      No cover
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/18 to-transparent" />
                  <div className="absolute left-4 top-4">
                    <Badge tone={course.is_active ? "green" : "neutral"}>{course.is_active ? "Live" : "Off"}</Badge>
                  </div>
                </div>
              </Link>

              <div className="p-5">
                <Link href={`/admin/courses/${course.id}`} className="block text-[22px] font-semibold leading-tight text-[var(--admin-text)] hover:text-[var(--admin-accent)]">
                  {course.title}
                </Link>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">/{course.slug}</p>
                <p className="mt-4 line-clamp-2 min-h-[42px] text-[13.5px] leading-relaxed text-[var(--admin-muted)]">
                  {course.summary || "No summary yet."}
                </p>

                <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--admin-border-soft)] pt-4 text-[12.5px]">
                  <div>
                    <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">When</dt>
                    <dd className="mt-1 text-[var(--admin-muted)]">{course.starts_at ? fmt.format(new Date(course.starts_at)) : "-"}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">Where</dt>
                    <dd className="mt-1 truncate text-[var(--admin-muted)]">{course.location || "-"}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">Seats</dt>
                    <dd className="mt-1 text-[var(--admin-muted)]">{course.capacity ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">Price</dt>
                    <dd className="mt-1 text-[var(--admin-muted)]">{priceFmt(course.price, course.currency)}</dd>
                  </div>
                </dl>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <form action={toggleCourseActiveAction}>
                    <input type="hidden" name="id" value={course.id} />
                    <input type="hidden" name="next" value={course.is_active ? "off" : "on"} />
                    <Button type="submit" variant={course.is_active ? "ghost" : "outline"} size="sm">
                      {course.is_active ? "Turn off" : "Publish"}
                    </Button>
                  </form>
                  <form action={deleteCourseAction}>
                    <input type="hidden" name="id" value={course.id} />
                    <Button type="submit" variant="danger" size="sm">
                      Delete
                    </Button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
