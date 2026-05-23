import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { TableShell, EmptyState } from "@/components/admin/ui/Table";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { toggleCourseActiveAction, deleteCourseAction } from "./actions";

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

export default async function CoursesAdminPage() {
  await requireRole(["admin", "editor", "viewer"]);
  const { courses, error } = await loadCourses();
  const fmt = new Intl.DateTimeFormat("en", { dateStyle: "medium" });
  const priceFmt = (price: number | null, currency: string | null) =>
    price == null ? "-" : `${currency ?? "SAR"} ${price.toLocaleString()}`;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="WORKSHOPS"
        title="Courses"
        description="Announce upcoming workshops. Toggle a course on to publish it; toggle off to hide it from the site."
        actions={
          <Link href="/admin/courses/new">
            <Button>New course</Button>
          </Link>
        }
      />

      {error ? (
        <div className="border border-amber-500/30 bg-amber-500/[0.06] text-amber-200 text-[13px] rounded-md px-4 py-3">
          Couldn&apos;t load courses: <code>{error}</code>
        </div>
      ) : null}

      <TableShell>
        <div
          style={{ gridTemplateColumns: "1.5fr 0.9fr 0.9fr 0.65fr 0.75fr 0.55fr 0.7fr 0.5fr" }}
          className="grid gap-4 px-5 py-3 border-b border-white/10 font-mono text-[10px] tracking-[0.2em] uppercase text-white/45"
        >
          <div>Title</div>
          <div>Location</div>
          <div>Starts</div>
          <div>Capacity</div>
          <div>Price</div>
          <div>Status</div>
          <div>Toggle</div>
          <div></div>
        </div>

        {courses.length === 0 ? (
          <EmptyState title="No courses yet." hint="Click 'New course' to create the first workshop." />
        ) : (
          courses.map((course) => (
            <div
              key={course.id}
              style={{ gridTemplateColumns: "1.5fr 0.9fr 0.9fr 0.65fr 0.75fr 0.55fr 0.7fr 0.5fr" }}
              className="grid gap-4 px-5 py-3 items-center border-b border-white/5 last:border-0 text-[13.5px]"
            >
              <div className="min-w-0">
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="text-white/95 hover:text-[#ff6a00] truncate block"
                >
                  {course.title}
                </Link>
                <div className="font-mono text-[11px] text-white/40 truncate">/{course.slug}</div>
              </div>
              <div className="text-white/70 truncate">{course.location || "-"}</div>
              <div className="font-mono text-[11px] text-white/65">
                {course.starts_at ? fmt.format(new Date(course.starts_at)) : "-"}
              </div>
              <div className="text-white/65">{course.capacity ?? "-"}</div>
              <div className="font-mono text-[11px] text-white/65">
                {priceFmt(course.price, course.currency)}
              </div>
              <div>
                <Badge tone={course.is_active ? "green" : "neutral"}>{course.is_active ? "Live" : "Off"}</Badge>
              </div>
              <form action={toggleCourseActiveAction}>
                <input type="hidden" name="id" value={course.id} />
                <input type="hidden" name="next" value={course.is_active ? "off" : "on"} />
                <Button type="submit" variant={course.is_active ? "ghost" : "outline"} size="sm">
                  {course.is_active ? "Turn off" : "Turn on"}
                </Button>
              </form>
              <form action={deleteCourseAction}>
                <input type="hidden" name="id" value={course.id} />
                <Button type="submit" variant="danger" size="sm">
                  Del
                </Button>
              </form>
            </div>
          ))
        )}
      </TableShell>
    </div>
  );
}
