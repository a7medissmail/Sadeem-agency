import Link from "next/link";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { deleteSuccessStoryAction, toggleSuccessStoryPublishedAction } from "./actions";
import { DeleteConfirmButton } from "@/components/admin/ui/DeleteConfirmButton";
import { MetricCard } from "@/components/admin/ui/Stats";
import { UserValue } from "@/components/admin/ui/UserValue";

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
  const liveCount = stories.filter((story) => story.is_published).length;
  const metricCount = stories.filter((story) => story.metric_value).length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="PROOF"
        title="Stories"
        description="Build measurable case narratives for the homepage and success stories library."
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

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <MetricCard label="Stories" value={stories.length} hint="All proof points" />
        <MetricCard label="Live" value={liveCount} hint="Published publicly" />
        <MetricCard label="Metrics" value={metricCount} hint="With headline data" />
      </section>

      {stories.length === 0 ? (
        <div className="border border-dashed border-[var(--admin-border)] bg-[var(--admin-panel)] px-5 py-12 text-center text-[13px] text-[var(--admin-subtle)]">
          No success stories yet. Create the first proof point.
        </div>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {stories.map((story) => (
            <article key={story.id} className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5 transition-colors hover:border-[var(--admin-accent)]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link href={`/admin/success-stories/${story.id}`} className="block text-[22px] font-semibold leading-tight text-[var(--admin-text)] hover:text-[var(--admin-accent)]">
                    {story.title}
                  </Link>
                  <p className="mt-2 sdm-eyebrow text-[var(--admin-subtle)]">
                    /{story.slug}
                    {story.client_name ? (
                      <>
                        {" / "}
                        <UserValue>{story.client_name}</UserValue>
                      </>
                    ) : null}
                  </p>
                </div>
                <Badge tone={story.is_published ? "green" : "neutral"}>{story.is_published ? "Live" : "Off"}</Badge>
              </div>

              <div className="mt-6 border-y border-[var(--admin-border-soft)] py-5">
                <p className="sdm-eyebrow text-[var(--admin-accent)]">Headline metric</p>
                <p className="mt-2 text-[30px] font-semibold leading-none text-[var(--admin-text)]">
                  {story.metric_value || "-"}
                  {story.metric_label ? <span className="ms-2 text-[14px] font-normal text-[var(--admin-muted)]">{story.metric_label}</span> : null}
                </p>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-4 text-[12.5px]">
                <div>
                  <dt className="sdm-eyebrow text-[var(--admin-subtle)]">Industry</dt>
                  <dd className="mt-1 truncate text-[var(--admin-muted)]">{story.industry || "-"}</dd>
                </div>
                <div>
                  <dt className="sdm-eyebrow text-[var(--admin-subtle)]">Order</dt>
                  <dd className="mt-1 text-[var(--admin-muted)]">{story.sort_order}</dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Link href={`/admin/success-stories/${story.id}`}>
                  <Button variant="outline" size="sm">Edit</Button>
                </Link>
                <form action={toggleSuccessStoryPublishedAction}>
                  <input type="hidden" name="id" value={story.id} />
                  <input type="hidden" name="next" value={story.is_published ? "off" : "on"} />
                  <Button type="submit" variant="ghost" size="sm">
                    {story.is_published ? "Turn off" : "Publish"}
                  </Button>
                </form>
                <DeleteConfirmButton
                  action={deleteSuccessStoryAction}
                  id={story.id}
                  message={`Delete "${story.title}"? This cannot be undone.`}
                />
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
