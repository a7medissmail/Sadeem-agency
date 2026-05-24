import { NextResponse } from "next/server";
import { getPublicSiteSettings } from "@/lib/site/settings";

export async function GET() {
  const settings = await getPublicSiteSettings();
  return NextResponse.json(settings, {
    headers: {
      "cache-control": "public, max-age=60, stale-while-revalidate=600",
    },
  });
}
