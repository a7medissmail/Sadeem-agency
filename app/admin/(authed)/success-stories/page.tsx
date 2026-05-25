import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { EmptyState, TableShell } from "@/components/admin/ui/Table";
import { deleteSuccessStoryAction, toggleSuccessStoryPublishedAction } from "./actions";

export const metadata = { title: "Success Stories - SADEEM Admin" };

async function loadStories() {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("success_stories")
      .select("id, slug, title, client_name, industry, metric_value, metric_label, sort_order, is_published, created_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { stories: data ?? [], error: null as string | null };
  } catch (err) {
    return { stories: [], error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export default async function SuccessStoriesAdminPage() {
  await requireRole(["admin", "editor", "viewer"]);
  const { stories, error } = await loadStories();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="PROOF"
        title="Success stories"
        description="Publish measurable case narratives for the homepage and public success stories pages."
        actions={
          <Link href="/admin/success-stories/new">
            <Button>New story</Button>
          </Link>
        }
      />

      {error ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-amber-200">
          Couldn&apos;t load success stories: <code>{error}</code>
        </div>
      ) : null}

      <TableShell>
        <div
          style={{ gridTemplateColumns: "1.4fr 0.75fr 0.75fr 0.65fr 0.5fr 0.7fr 0.5fr" }}
          className="grid gap-4 border-b border-white/10 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45"
        >
          <div>Title</div>
          <div>Industry</div>
          <div>Metric</div>
          <div>Order</div>
          <div>Status</div>
          <div>Toggle</div>
          <div></div>
        </div>

        {stories.length === 0 ? (
          <EmptyState title="No success stories yet." hint="Click 'New story' to create the first proof point." />
        ) : (
          stories.map((story) => (
            <div
              key={story.id}
              style={{ gridTemplateColumns: "1.4fr 0.75fr 0.75fr 0.65fr 0.5fr 0.7fr 0.5fr" }}
              className="grid items-center gap-4 border-b border-white/5 px-5 py-3 text-[13.5px] last:border-0"
            >
              <div className="min-w-0">
                <Link
                  href={`/admin/success-stories/${story.id}`}
                  className="block truncate text-white/95 hover:text-[#ff6a00]"
                >
                  {story.title}
                </Link>
                <div className="truncate font-mono text-[11px] text-white/40">
                  /{story.slug}
                  {story.client_name ? ` / ${story.client_name}` : ""}
                </div>
              </div>
              <div className="truncate text-white/70">{story.industry || "-"}</div>
              <div className="font-mono text-[11px] text-white/65">
                {story.metric_value ? `${story.metric_value} ${story.metric_label ?? ""}` : "-"}
              </div>
              <div className="font-mono text-[11px] text-white/65">{story.sort_order}</div>
              <div>
                <Badge tone={story.is_published ? "green" : "neutral"}>
                  {story.is_published ? "Live" : "Off"}
                </Badge>
              </div>
              <form action={toggleSuccessStoryPublishedAction}>
                <input type="hidden" name="id" value={story.id} />
                <input type="hidden" name="next" value={story.is_published ? "off" : "on"} />
                <Button type="submit" variant={story.is_published ? "ghost" : "outline"} size="sm">
                  {story.is_published ? "Turn off" : "Turn on"}
                </Button>
              </form>
              <form action={deleteSuccessStoryAction}>
                <input type="hidden" name="id" value={story.id} />
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
