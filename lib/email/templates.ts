// Dependency-free HTML email templates.
// Everything is inline-styled so Gmail, Outlook, and Apple Mail render it predictably.

const accent = "#FF6A00";
const dark = "#0D0D0F";
const ink = "#202124";
const muted = "#74716d";
const soft = "#F5F3F0";
const line = "rgba(13,13,15,0.1)";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hiddenPreview(text: string) {
  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(text)}</div>`;
}

function paragraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(
      (part) =>
        `<p style="margin:0 0 18px;color:${ink};font-size:16px;line-height:1.65;white-space:pre-wrap">${esc(
          part,
        )}</p>`,
    )
    .join("");
}

function rowsTable(rows: Array<[string, string | null | undefined]>) {
  const body = rows
    .map(([label, value]) => {
      const safeValue = value && value.trim() ? value : "-";
      return `
        <tr>
          <td style="padding:13px 0;width:148px;color:${muted};font-family:Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;vertical-align:top;border-bottom:1px solid ${line}">${esc(
            label,
          )}</td>
          <td style="padding:13px 0;color:${ink};font-size:15px;line-height:1.6;vertical-align:top;white-space:pre-wrap;border-bottom:1px solid ${line}">${esc(
            safeValue,
          )}</td>
        </tr>`;
    })
    .join("");

  return `<table role="presentation" style="border-collapse:collapse;width:100%;margin-top:18px">${body}</table>`;
}

function actionLink(href: string, label: string) {
  return `
    <table role="presentation" style="border-collapse:collapse;margin:24px 0 4px">
      <tr>
        <td>
          <a href="${esc(href)}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-family:Menlo,Consolas,monospace;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;font-weight:700;padding:15px 20px">${esc(
            label,
          )}</a>
        </td>
      </tr>
    </table>`;
}

function shell({
  eyebrow,
  title,
  intro,
  children,
  footer,
  preview,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children?: string;
  footer?: string;
  preview: string;
}) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:${soft};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${dark};line-height:1.5">
    ${hiddenPreview(preview)}
    <table role="presentation" style="border-collapse:collapse;width:100%;background:${soft};padding:0;margin:0">
      <tr>
        <td style="padding:36px 18px">
          <table role="presentation" style="border-collapse:collapse;width:100%;max-width:640px;margin:0 auto;background:#ffffff;border:1px solid rgba(13,13,15,0.08);border-radius:18px;overflow:hidden;box-shadow:0 24px 70px rgba(13,13,15,0.08)">
            <tr>
              <td style="background:${dark};padding:26px 32px 22px;color:#ffffff">
                <table role="presentation" style="border-collapse:collapse;width:100%">
                  <tr>
                    <td style="font-family:Menlo,Consolas,monospace;font-size:13px;letter-spacing:0.38em;text-transform:uppercase;font-weight:700">SADEEM</td>
                    <td style="text-align:right;color:${accent};font-family:Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.24em;text-transform:uppercase">Strategic advisory</td>
                  </tr>
                </table>
                <div style="height:2px;width:56px;background:${accent};margin-top:22px"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 32px 32px">
                <p style="font-family:Menlo,Consolas,monospace;font-size:12px;letter-spacing:0.3em;text-transform:uppercase;color:${accent};font-weight:700;margin:0 0 16px">${esc(
                  eyebrow,
                )}</p>
                <h1 style="font-size:30px;line-height:1.12;letter-spacing:0;margin:0 0 16px;color:${dark};font-weight:760">${esc(
                  title,
                )}</h1>
                ${
                  intro
                    ? `<p style="margin:0 0 22px;color:${muted};font-size:16px;line-height:1.65">${esc(intro)}</p>`
                    : ""
                }
                ${children || ""}
                <div style="height:1px;background:${line};margin:28px 0 18px"></div>
                <p style="margin:0;color:${muted};font-size:12px;line-height:1.6">${footer || "SADEEM - Strategic Growth Advisory"}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

export function leadConfirmation({ name }: { name: string }) {
  const subject = "We received your message - SADEEM";
  const html = shell({
    eyebrow: "Message received",
    title: `Thanks, ${name}.`,
    intro:
      "Your message reached us. A member of the team will come back shortly, usually within one business day.",
    preview: "Your message reached SADEEM.",
    children: `
      <p style="margin:0 0 18px;color:${ink};font-size:16px;line-height:1.65">Before we speak, it helps to think through the outcome you want, the constraint slowing you down, and what would make the next 90 days valuable.</p>
      <div style="background:${soft};border-left:3px solid ${accent};padding:16px 18px;margin-top:22px">
        <p style="margin:0;color:${ink};font-size:15px;line-height:1.6">We work best when the ambition is clear and the operating reality is honest. Bring both.</p>
      </div>`,
  });
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
  const html = shell({
    eyebrow: "New lead",
    title: name,
    intro: `Submitted via ${source}.`,
    preview: `New SADEEM lead from ${name}.`,
    children: rowsTable([
      ["Name", name],
      ["Email", email],
      ["Phone", phone],
      ["Company", company],
      ["Source", source],
      ["Message", message],
    ]),
  });
  return { subject, html };
}

export function applicationConfirmation({ name, jobTitle }: { name: string; jobTitle: string }) {
  const subject = `Application received - ${jobTitle}`;
  const html = shell({
    eyebrow: "Application received",
    title: `Thanks, ${name}.`,
    intro: `We received your application for ${jobTitle}.`,
    preview: `SADEEM received your application for ${jobTitle}.`,
    children: `
      <p style="margin:0 0 18px;color:${ink};font-size:16px;line-height:1.65">The team will review your profile against the role, the work ahead, and the operating rhythm we need.</p>
      <p style="margin:0;color:${muted};font-size:15px;line-height:1.65">If there is a strong fit, we will follow up with next steps.</p>`,
  });
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
  const html = shell({
    eyebrow: "New application",
    title: name,
    intro: `Submitted for ${jobTitle}.`,
    preview: `New SADEEM application from ${name}.`,
    children: rowsTable([
      ["Name", name],
      ["Email", email],
      ["Phone", phone],
      ["Role", jobTitle],
      ["Cover note", coverNote],
    ]),
  });
  return { subject, html };
}

export function applicationRejection({ name, jobTitle }: { name: string; jobTitle: string }) {
  const subject = `Update on your SADEEM application - ${jobTitle}`;
  const html = shell({
    eyebrow: "Application update",
    title: `Thank you, ${name}.`,
    intro: `We reviewed your application for ${jobTitle}.`,
    preview: `An update on your SADEEM application for ${jobTitle}.`,
    children: `
      <p style="margin:0 0 18px;color:${ink};font-size:16px;line-height:1.65">We will not be moving forward with this role right now, but we appreciate the time and care you put into applying.</p>
      <p style="margin:0;color:${muted};font-size:15px;line-height:1.65">We are building the team deliberately, and we hope our paths cross again.</p>`,
  });
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
  const html = shell({
    eyebrow: "Consultation booked",
    title: `You're booked, ${name}.`,
    intro: `Your SADEEM consultation is scheduled for ${slotLabel}.`,
    preview: `Your SADEEM consultation is booked for ${slotLabel}.`,
    children: `
      ${
        meetLink
          ? `<p style="margin:0 0 18px;color:${ink};font-size:16px;line-height:1.65">Join link: <a href="${esc(meetLink)}" style="color:${accent};font-weight:700">${esc(
              meetLink,
            )}</a></p>${actionLink(meetLink, "Join session")}`
          : `<p style="margin:0 0 18px;color:${ink};font-size:16px;line-height:1.65">We will follow up with the meeting details shortly.</p>`
      }
      <p style="margin:0;color:${muted};font-size:15px;line-height:1.65">We attached a calendar invite so the session lands in your calendar cleanly.</p>`,
  });
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
  const html = shell({
    eyebrow: "SADEEM update",
    title: subject,
    intro: `Hi ${leadName},`,
    preview: subject,
    children: paragraphs(body),
    footer: `You are receiving this because you contacted SADEEM. <a href="${esc(
      unsubscribeUrl,
    )}" style="color:${accent};text-decoration:underline">Unsubscribe</a>.`,
  });

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
  const html = shell({
    eyebrow: "New consultation",
    title: name,
    intro: "A visitor booked through the custom consultation flow.",
    preview: `New SADEEM consultation booking from ${name}.`,
    children: rowsTable([
      ["Name", name],
      ["Email", email],
      ["Phone", phone],
      ["When", slotLabel],
      ["Meet link", meetLink],
      ["Topic", topic],
    ]),
  });
  return { subject, html };
}
