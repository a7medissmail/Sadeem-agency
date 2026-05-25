import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 12) || 12, 1), 24);

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("success_stories")
      .select("id, slug, title, industry, summary, image_url, metric_value, metric_label")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ stories: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load stories";
    return NextResponse.json({ stories: [], error: message }, { status: 200 });
  }
}
