import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";

function html(title: string, message: string, status = 200) {
  return new NextResponse(
    `<!doctype html>
<html>
  <body style="margin:0;background:#f5f3f0;color:#0d0d0f;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
    <main style="min-height:100vh;display:grid;place-items:center;padding:32px">
      <section style="max-width:560px;border:1px solid rgba(13,13,15,.12);background:white;padding:32px;border-radius:14px">
        <p style="font-family:Menlo,monospace;font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#ff6a00;margin:0 0 16px">SADEEM</p>
        <h1 style="font-size:28px;margin:0 0 12px">${title}</h1>
        <p style="font-size:16px;line-height:1.6;color:#57575a;margin:0">${message}</p>
      </section>
    </main>
  </body>
</html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  const token = url.searchParams.get("token") ?? "";

  if (!id || !token || !verifyUnsubscribeToken(id, token)) {
    return html("Invalid link.", "This unsubscribe link is no longer valid.", 400);
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("leads")
    .update({ marketing_unsubscribed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return html("Could not unsubscribe.", "Please reply to the email and we will remove you manually.", 500);
  }

  return html("You're unsubscribed.", "We removed this email from SADEEM marketing updates.");
}
