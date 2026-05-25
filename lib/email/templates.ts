// Minimal, dependency-free HTML email templates.
// Inline styles so they survive in Gmail/Outlook.

const accent = "#FF6A00";
const dark = "#0D0D0F";
const muted = "#6b6b6e";
const wrapStyle = `font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#fafaf7;padding:32px;color:${dark};line-height:1.55`;
const cardStyle = `max-width:560px;margin:0 auto;background:#ffffff;border:1px solid rgba(13,13,15,0.08);border-radius:14px;padding:32px;`;

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function leadConfirmation({ name }: { name: string }) {
  const subject = "We received your message - SADEEM";
  const html = `
<!doctype html><html><body style="${wrapStyle}">
  <div style="${cardStyle}">
    <p style="font-family:Menlo,monospace;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:${accent};margin:0 0 14px">SADEEM</p>
    <h1 style="font-size:24px;letter-spacing:-0.02em;margin:0 0 12px">Thanks, ${esc(name)}.</h1>
    <p style="margin:0 0 16px;color:${dark}">Your message reached us. A member of the team will reach out shortly - usually within one business day.</p>
    <p style="margin:0 0 16px;color:${muted}">In the meantime, feel free to think through what "next level" looks like for you. The clearer the ambition, the faster we can map a path to it.</p>
    <hr style="border:none;border-top:1px solid rgba(13,13,15,0.08);margin:24px 0" />
    <p style="font-family:Menlo,monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${muted};margin:0">SADEEM - Strategic Growth Advisory</p>
  </div>
</body></html>`.trim();
  return { subject, html };
}

export function leadNotification({
  name,
  email,
  phone,
  company,
  message,
  source,
}: {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  message?: string | null;
  source: string;
}) {
  const subject = `New lead - ${name} (${source})`;
  const rows = [
    ["Name", name],
    ["Email", email],
    ["Phone", phone || "-"],
    ["Company", company || "-"],
    ["Source", source],
    ["Message", message || "-"],
  ]
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:8px 0;width:120px;color:${muted};font-family:Menlo,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;vertical-align:top">${k}</td>
        <td style="padding:8px 0;color:${dark};vertical-align:top;white-space:pre-wrap">${esc(String(v))}</td>
      </tr>`,
    )
    .join("");
  const html = `
<!doctype html><html><body style="${wrapStyle}">
  <div style="${cardStyle}">
    <p style="font-family:Menlo,monospace;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:${accent};margin:0 0 14px">NEW LEAD</p>
    <h1 style="font-size:22px;letter-spacing:-0.02em;margin:0 0 8px">${esc(name)}</h1>
    <p style="margin:0 0 18px;color:${muted}">Submitted via ${esc(source)}.</p>
    <table style="border-collapse:collapse;width:100%">${rows}</table>
  </div>
</body></html>`.trim();
  return { subject, html };
}

export function applicationConfirmation({ name, jobTitle }: { name: string; jobTitle: string }) {
  const subject = `Application received - ${jobTitle}`;
  const html = `
<!doctype html><html><body style="${wrapStyle}">
  <div style="${cardStyle}">
    <p style="font-family:Menlo,monospace;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:${accent};margin:0 0 14px">APPLICATION RECEIVED</p>
    <h1 style="font-size:24px;letter-spacing:-0.02em;margin:0 0 12px">Thanks, ${esc(name)}.</h1>
    <p style="margin:0 0 16px;color:${dark}">We received your application for <strong>${esc(jobTitle)}</strong>.</p>
    <p style="margin:0;color:${muted}">The SADEEM team will review your profile and follow up if there is a strong fit for the role.</p>
  </div>
</body></html>`.trim();
  return { subject, html };
}

export function applicationNotification({
  name,
  email,
  phone,
  jobTitle,
  coverNote,
}: {
  name: string;
  email: string;
  phone?: string | null;
  jobTitle: string;
  coverNote?: string | null;
}) {
  const subject = `New application - ${jobTitle} - ${name}`;
  const rows = [
    ["Name", name],
    ["Email", email],
    ["Phone", phone || "-"],
    ["Role", jobTitle],
    ["Cover note", coverNote || "-"],
  ]
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:8px 0;width:120px;color:${muted};font-family:Menlo,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;vertical-align:top">${k}</td>
        <td style="padding:8px 0;color:${dark};vertical-align:top;white-space:pre-wrap">${esc(String(v))}</td>
      </tr>`,
    )
    .join("");
  const html = `
<!doctype html><html><body style="${wrapStyle}">
  <div style="${cardStyle}">
    <p style="font-family:Menlo,monospace;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:${accent};margin:0 0 14px">NEW APPLICATION</p>
    <h1 style="font-size:22px;letter-spacing:-0.02em;margin:0 0 8px">${esc(name)}</h1>
    <p style="margin:0 0 18px;color:${muted}">Submitted for ${esc(jobTitle)}.</p>
    <table style="border-collapse:collapse;width:100%">${rows}</table>
  </div>
</body></html>`.trim();
  return { subject, html };
}

export function applicationRejection({ name, jobTitle }: { name: string; jobTitle: string }) {
  const subject = `Update on your SADEEM application - ${jobTitle}`;
  const html = `
<!doctype html><html><body style="${wrapStyle}">
  <div style="${cardStyle}">
    <p style="font-family:Menlo,monospace;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:${accent};margin:0 0 14px">APPLICATION UPDATE</p>
    <h1 style="font-size:24px;letter-spacing:-0.02em;margin:0 0 12px">Thank you, ${esc(name)}.</h1>
    <p style="margin:0 0 16px;color:${dark}">We reviewed your application for <strong>${esc(jobTitle)}</strong>.</p>
    <p style="margin:0 0 16px;color:${muted}">We won&apos;t be moving forward with this role right now, but we appreciate the time and care you put into applying.</p>
    <p style="margin:0;color:${muted}">We&apos;ll keep building the team deliberately, and we hope our paths cross again.</p>
  </div>
</body></html>`.trim();
  return { subject, html };
}

export function bookingConfirmation({
  name,
  slotLabel,
  meetLink,
}: {
  name: string;
  slotLabel: string;
  meetLink?: string | null;
}) {
  const subject = "Consultation booked - SADEEM";
  const html = `
<!doctype html><html><body style="${wrapStyle}">
  <div style="${cardStyle}">
    <p style="font-family:Menlo,monospace;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:${accent};margin:0 0 14px">CONSULTATION BOOKED</p>
    <h1 style="font-size:24px;letter-spacing:-0.02em;margin:0 0 12px">You're booked, ${esc(name)}.</h1>
    <p style="margin:0 0 16px;color:${dark}">Your SADEEM consultation is scheduled for <strong>${esc(slotLabel)}</strong>.</p>
    ${
      meetLink
        ? `<p style="margin:0 0 16px;color:${dark}">Join link: <a href="${esc(meetLink)}" style="color:${accent}">${esc(meetLink)}</a></p>`
        : `<p style="margin:0 0 16px;color:${muted}">We'll follow up with the meeting details shortly.</p>`
    }
    <p style="margin:0;color:${muted}">We attached a calendar invite so the session lands in your calendar cleanly.</p>
  </div>
</body></html>`.trim();
  return { subject, html };
}

export function campaignEmail({
  subject,
  body,
  leadName,
  unsubscribeUrl,
}: {
  subject: string;
  body: string;
  leadName: string;
  unsubscribeUrl: string;
}) {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p style="margin:0 0 16px;color:${dark};white-space:pre-wrap">${esc(part)}</p>`)
    .join("");

  const html = `
<!doctype html><html><body style="${wrapStyle}">
  <div style="${cardStyle}">
    <p style="font-family:Menlo,monospace;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:${accent};margin:0 0 14px">SADEEM UPDATE</p>
    <h1 style="font-size:24px;letter-spacing:-0.02em;margin:0 0 16px">${esc(subject)}</h1>
    <p style="margin:0 0 16px;color:${muted}">Hi ${esc(leadName)},</p>
    ${paragraphs}
    <hr style="border:none;border-top:1px solid rgba(13,13,15,0.08);margin:24px 0" />
    <p style="font-size:12px;color:${muted};margin:0">You are receiving this because you contacted SADEEM. <a href="${esc(
      unsubscribeUrl,
    )}" style="color:${accent}">Unsubscribe</a>.</p>
  </div>
</body></html>`.trim();

  return { subject, html };
}

export function bookingNotification({
  name,
  email,
  phone,
  topic,
  slotLabel,
  meetLink,
}: {
  name: string;
  email: string;
  phone?: string | null;
  topic?: string | null;
  slotLabel: string;
  meetLink?: string | null;
}) {
  const subject = `New consultation booking - ${name}`;
  const rows = [
    ["Name", name],
    ["Email", email],
    ["Phone", phone || "-"],
    ["When", slotLabel],
    ["Meet link", meetLink || "-"],
    ["Topic", topic || "-"],
  ]
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:8px 0;width:120px;color:${muted};font-family:Menlo,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;vertical-align:top">${k}</td>
        <td style="padding:8px 0;color:${dark};vertical-align:top;white-space:pre-wrap">${esc(String(v))}</td>
      </tr>`,
    )
    .join("");
  const html = `
<!doctype html><html><body style="${wrapStyle}">
  <div style="${cardStyle}">
    <p style="font-family:Menlo,monospace;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:${accent};margin:0 0 14px">NEW CONSULTATION</p>
    <h1 style="font-size:22px;letter-spacing:-0.02em;margin:0 0 8px">${esc(name)}</h1>
    <p style="margin:0 0 18px;color:${muted}">A visitor booked through the custom consultation flow.</p>
    <table style="border-collapse:collapse;width:100%">${rows}</table>
  </div>
</body></html>`.trim();
  return { subject, html };
}
