import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { TableShell, EmptyState } from "@/components/admin/ui/Table";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { toggleCourseActiveAction, deleteCourseAction } from "./actions";

export const metadata = { title: "Courses — SADEEM Admin" };

async function loadCourses() {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("courses")
      .select("id, slug, title, summary, location, starts_at, capacity, is_active, image_url")
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
          style={{ gridTemplateColumns: "1.6fr 1fr 1fr 0.8fr 0.6fr 0.7fr 0.5fr" }}
          className="grid gap-4 px-5 py-3 border-b border-white/10 font-mono text-[10px] tracking-[0.2em] uppercase text-white/45"
        >
          <div>Title</div>
          <div>Location</div>
          <div>Starts</div>
          <div>Capacity</div>
          <div>Status</div>
          <div>Toggle</div>
          <div></div>
        </div>

        {courses.length === 0 ? (
          <EmptyState title="No courses yet." hint="Click 'New course' to create the first workshop." />
        ) : (
          courses.map((c) => (
            <div
              key={c.id}
              style={{ gridTemplateColumns: "1.6fr 1fr 1fr 0.8fr 0.6fr 0.7fr 0.5fr" }}
              className="grid gap-4 px-5 py-3 items-center border-b border-white/5 last:border-0 text-[13.5px]"
            >
              <div className="min-w-0">
                <Link
                  href={`/admin/courses/${c.id}`}
                  className="text-white/95 hover:text-[#ff6a00] truncate block"
                >
                  {c.title}
                </Link>
                <div className="font-mono text-[11px] text-white/40 truncate">/{c.slug}</div>
              </div>
              <div className="text-white/70 truncate">{c.location || "—"}</div>
              <div className="font-mono text-[11px] text-white/65">
                {c.starts_at ? fmt.format(new Date(c.starts_at)) : "—"}
              </div>
              <div className="text-white/65">{c.capacity ?? "—"}</div>
              <div>
                <Badge tone={c.is_active ? "green" : "neutral"}>{c.is_active ? "Live" : "Off"}</Badge>
              </div>
              <form action={toggleCourseActiveAction}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="next" value={c.is_active ? "off" : "on"} />
                <Button type="submit" variant={c.is_active ? "ghost" : "outline"} size="sm">
                  {c.is_active ? "Turn off" : "Turn on"}
                </Button>
              </form>
              <form action={deleteCourseAction}>
                <input type="hidden" name="id" value={c.id} />
                <Button type="submit" variant="danger" size="sm">Del</Button>
              </form>
            </div>
          ))
        )}
      </TableShell>
    </div>
  );
}
