import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Match every route except static assets, image optimization, and the public hero images.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|hero/|image/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
