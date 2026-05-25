import type { MetadataRoute } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sadeem-agency.vercel.app";

type UrlEntry = MetadataRoute.Sitemap[number];

function url(path: string, options: Omit<UrlEntry, "url"> = {}): UrlEntry {
  return {
    url: `${siteUrl}${path}`,
    ...options,
  };
}

async function loadDynamicUrls(): Promise<UrlEntry[]> {
  try {
    const admin = getSupabaseAdmin();
    const [courses, jobs, stories] = await Promise.all([
      admin.from("courses").select("slug, updated_at").eq("is_active", true),
      admin.from("jobs").select("slug, updated_at").eq("is_open", true),
      admin.from("success_stories").select("slug, updated_at").eq("is_published", true),
    ]);

    const entries: UrlEntry[] = [];
    for (const course of courses.data ?? []) {
      entries.push(url(`/courses/${course.slug}`, { lastModified: course.updated_at, changeFrequency: "weekly", priority: 0.72 }));
    }
    for (const job of jobs.data ?? []) {
      entries.push(url(`/careers/${job.slug}`, { lastModified: job.updated_at, changeFrequency: "weekly", priority: 0.58 }));
    }
    for (const story of stories.data ?? []) {
      entries.push(url(`/success-stories/${story.slug}`, { lastModified: story.updated_at, changeFrequency: "monthly", priority: 0.7 }));
    }

    return entries;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  return [
    url("/", { lastModified: now, changeFrequency: "weekly", priority: 1 }),
    url("/courses", { lastModified: now, changeFrequency: "weekly", priority: 0.82 }),
    url("/consultation", { lastModified: now, changeFrequency: "weekly", priority: 0.86 }),
    url("/success-stories", { lastModified: now, changeFrequency: "weekly", priority: 0.78 }),
    url("/team", { lastModified: now, changeFrequency: "monthly", priority: 0.68 }),
    url("/careers", { lastModified: now, changeFrequency: "weekly", priority: 0.7 }),
    url("/privacy", { lastModified: now, changeFrequency: "yearly", priority: 0.28 }),
    url("/terms", { lastModified: now, changeFrequency: "yearly", priority: 0.28 }),
    ...(await loadDynamicUrls()),
  ];
}
