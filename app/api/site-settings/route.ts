import { NextResponse } from "next/server";
import { getPublicSiteSettings } from "@/lib/site/settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const settings = await getPublicSiteSettings();
  return NextResponse.json(settings, {
    headers: {
      "cache-control": "no-store",
    },
  });
}
