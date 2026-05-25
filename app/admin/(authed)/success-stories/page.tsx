import Link from "next/link";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { requireRole } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
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

function MetricCard({ label, value, hint }: { label: string; value: number | string; hint: string }) {
  return (
    <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">{label}</p>
      <div className="mt-3 text-[30px] font-semibold leading-none text-[var(--admin-text)]">{value}</div>
      <p className="mt-3 text-[12.5px] text-[var(--admin-muted)]">{hint}</p>
    </div>
  );
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

      <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <div className="border border-[var(--admin-border)] bg-[var(--admin-panel)] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--admin-accent)]">Proof OS</p>
          <h2 className="mt-2 max-w-[13ch] text-[34px] font-semibold leading-[1.02] tracking-tight text-[var(--admin-text)]">
            Proof points with a measurable spine.
          </h2>
          <p className="mt-4 max-w-[68ch] text-[14.5px] leading-relaxed text-[var(--admin-muted)]">
            Stories work best when the narrative, metric, industry, and publish state are visible at a glance.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Stories" value={stories.length} hint="All proof points" />
          <MetricCard label="Live" value={liveCount} hint="Published publicly" />
          <MetricCard label="Metrics" value={metricCount} hint="With headline data" />
        </div>
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
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">
                    /{story.slug}
                    {story.client_name ? ` / ${story.client_name}` : ""}
                  </p>
                </div>
                <Badge tone={story.is_published ? "green" : "neutral"}>{story.is_published ? "Live" : "Off"}</Badge>
              </div>

              <div className="mt-6 border-y border-[var(--admin-border-soft)] py-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-accent)]">Headline metric</p>
                <p className="mt-2 text-[30px] font-semibold leading-none text-[var(--admin-text)]">
                  {story.metric_value || "-"}
                  {story.metric_label ? <span className="ml-2 text-[14px] font-normal text-[var(--admin-muted)]">{story.metric_label}</span> : null}
                </p>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-4 text-[12.5px]">
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">Industry</dt>
                  <dd className="mt-1 truncate text-[var(--admin-muted)]">{story.industry || "-"}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--admin-subtle)]">Order</dt>
                  <dd className="mt-1 text-[var(--admin-muted)]">{story.sort_order}</dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <form action={toggleSuccessStoryPublishedAction}>
                  <input type="hidden" name="id" value={story.id} />
                  <input type="hidden" name="next" value={story.is_published ? "off" : "on"} />
                  <Button type="submit" variant={story.is_published ? "ghost" : "outline"} size="sm">
                    {story.is_published ? "Turn off" : "Publish"}
                  </Button>
                </form>
                <form action={deleteSuccessStoryAction}>
                  <input type="hidden" name="id" value={story.id} />
                  <Button type="submit" variant="danger" size="sm">
                    Delete
                  </Button>
                </form>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
