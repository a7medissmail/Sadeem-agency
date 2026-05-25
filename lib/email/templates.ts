import "server-only";
import sanitizeHtml from "sanitize-html";
import { getPublicSiteSettings } from "@/lib/site/settings";

// Inline-styled HTML email templates for Gmail/Outlook compatibility.

const accent = "#FF6A00";
const dark = "#0D0D0F";
const panel = "#111113";
const ink = "#F5F3F0";
const muted = "#B8B8B8";
const soft = "#F5F3F0";
const line = "rgba(245,243,240,0.12)";

export type EmailBranding = {
  logoUrl?: string | null;
  footerEmail?: string | null;
};

export async function getEmailBranding(): Promise<EmailBranding> {
  const settings = await getPublicSiteSettings();
  return {
    logoUrl: settings.logoLightUrl || settings.logoDarkUrl,
    footerEmail: settings.footerEmail,
  };
}

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

function paragraphs(text: string, color = ink) {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(
      (part) =>
        `<p style="margin:0 0 18px;color:${color};font-size:16px;line-height:1.7;white-space:pre-wrap">${esc(
          part,
        )}</p>`,
    )
    .join("");
}

function hasHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function campaignBody(value: string) {
  if (!hasHtml(value)) return paragraphs(value);

  return sanitizeHtml(value, {
    allowedTags: ["a", "b", "br", "em", "i", "li", "ol", "p", "strong", "u", "ul"],
    allowedAttributes: {
      a: ["href", "title"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      p: () => ({
        tagName: "p",
        attribs: { style: `margin:0 0 18px;color:${ink};font-size:16px;line-height:1.7` },
      }),
      ul: () => ({
        tagName: "ul",
        attribs: { style: `margin:0 0 18px 20px;padding:0;color:${ink};font-size:16px;line-height:1.7` },
      }),
      ol: () => ({
        tagName: "ol",
        attribs: { style: `margin:0 0 18px 20px;padding:0;color:${ink};font-size:16px;line-height:1.7` },
      }),
      li: () => ({ tagName: "li", attribs: { style: "margin:0 0 8px" } }),
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          href: attribs.href,
          title: attribs.title,
          style: `color:${accent};font-weight:700;text-decoration:underline`,
        },
      }),
      strong: () => ({ tagName: "strong", attribs: { style: "font-weight:700" } }),
      b: () => ({ tagName: "b", attribs: { style: "font-weight:700" } }),
      em: () => ({ tagName: "em", attribs: { style: "font-style:italic" } }),
      i: () => ({ tagName: "i", attribs: { style: "font-style:italic" } }),
    },
  });
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

function logoBlock(brand?: EmailBranding) {
  if (brand?.logoUrl) {
    return `<img src="${esc(
      brand.logoUrl,
    )}" width="156" alt="SADEEM" style="display:block;width:156px;max-width:156px;height:auto;border:0;outline:none;text-decoration:none" />`;
  }

  return `<span style="font-family:Menlo,Consolas,monospace;font-size:13px;letter-spacing:0.38em;text-transform:uppercase;font-weight:700;color:#ffffff">SADEEM</span>`;
}

function shell({
  eyebrow,
  title,
  intro,
  children,
  footer,
  preview,
  brand,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children?: string;
  footer?: string;
  preview: string;
  brand?: EmailBranding;
}) {
  const footerText =
    footer || `SADEEM - Strategic Growth Advisory${brand?.footerEmail ? ` - ${esc(brand.footerEmail)}` : ""}`;

  return `<!doctype html>
<html>
  <head>
    <meta name="color-scheme" content="dark light" />
    <meta name="supported-color-schemes" content="dark light" />
    <style>
      @media only screen and (max-width: 520px) {
        .sadeem-wrap { padding: 18px 10px !important; }
        .sadeem-head, .sadeem-body { padding-left: 22px !important; padding-right: 22px !important; }
        .sadeem-title { font-size: 25px !important; line-height: 1.18 !important; }
        .sadeem-tagline { display: none !important; }
      }
    </style>
  </head>
  <body style="margin:0;background:${dark};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${ink};line-height:1.5">
    ${hiddenPreview(preview)}
    <table role="presentation" style="border-collapse:collapse;width:100%;background:${dark};padding:0;margin:0">
      <tr>
        <td class="sadeem-wrap" style="padding:34px 18px">
          <table role="presentation" style="border-collapse:collapse;width:100%;max-width:640px;margin:0 auto;background:${panel};border:1px solid rgba(245,243,240,0.1);border-radius:18px;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,0.22)">
            <tr>
              <td class="sadeem-head" style="background:${dark};padding:30px 34px 24px;color:#ffffff">
                <table role="presentation" style="border-collapse:collapse;width:100%">
                  <tr>
                    <td style="vertical-align:middle">${logoBlock(brand)}</td>
                    <td class="sadeem-tagline" style="text-align:right;color:${accent};font-family:Menlo,Consolas,monospace;font-size:12px;line-height:1.8;letter-spacing:0.24em;text-transform:uppercase;vertical-align:middle">Strategic<br />Advisory</td>
                  </tr>
                </table>
                <div style="height:2px;width:72px;background:${accent};margin-top:24px"></div>
              </td>
            </tr>
            <tr>
              <td class="sadeem-body" style="padding:34px 34px 32px;background:${panel}">
                <p style="font-family:Menlo,Consolas,monospace;font-size:12px;letter-spacing:0.3em;text-transform:uppercase;color:${accent};font-weight:700;margin:0 0 16px">${esc(
                  eyebrow,
                )}</p>
                <h1 class="sadeem-title" style="font-size:28px;line-height:1.16;letter-spacing:0;margin:0 0 18px;color:${ink};font-weight:760">${esc(
                  title,
                )}</h1>
                ${
                  intro
                    ? `<p style="margin:0 0 24px;color:${muted};font-size:16px;line-height:1.7">${esc(intro)}</p>`
                    : ""
                }
                ${children || ""}
                <div style="height:1px;background:${line};margin:28px 0 18px"></div>
                <p style="margin:0;color:${muted};font-size:12px;line-height:1.6">${footerText}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

export function leadConfirmation({ name, brand }: { name: string; brand?: EmailBranding }) {
  const subject = "We received your message - SADEEM";
  const html = shell({
    eyebrow: "Message received",
    title: `Thanks, ${name}.`,
    intro:
      "Your message reached us. A member of the team will come back shortly, usually within one business day.",
    preview: "Your message reached SADEEM.",
    brand,
    children: `
      <p style="margin:0 0 18px;color:${ink};font-size:16px;line-height:1.7">Before we speak, it helps to think through the outcome you want, the constraint slowing you down, and what would make the next 90 days valuable.</p>
      <div style="background:#18181b;border-left:3px solid ${accent};padding:16px 18px;margin-top:22px">
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
  brand,
}: {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  message?: string | null;
  source: string;
  brand?: EmailBranding;
}) {
  const subject = `New lead - ${name} (${source})`;
  const html = shell({
    eyebrow: "New lead",
    title: name,
    intro: `Submitted via ${source}.`,
    preview: `New SADEEM lead from ${name}.`,
    brand,
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

export function applicationConfirmation({
  name,
  jobTitle,
  brand,
}: {
  name: string;
  jobTitle: string;
  brand?: EmailBranding;
}) {
  const subject = `Application received - ${jobTitle}`;
  const html = shell({
    eyebrow: "Application received",
    title: `Thanks, ${name}.`,
    intro: `We received your application for ${jobTitle}.`,
    preview: `SADEEM received your application for ${jobTitle}.`,
    brand,
    children: `
      <p style="margin:0 0 18px;color:${ink};font-size:16px;line-height:1.7">The team will review your profile against the role, the work ahead, and the operating rhythm we need.</p>
      <p style="margin:0;color:${muted};font-size:15px;line-height:1.7">If there is a strong fit, we will follow up with next steps.</p>`,
  });
  return { subject, html };
}

export function applicationNotification({
  name,
  email,
  phone,
  jobTitle,
  coverNote,
  brand,
}: {
  name: string;
  email: string;
  phone?: string | null;
  jobTitle: string;
  coverNote?: string | null;
  brand?: EmailBranding;
}) {
  const subject = `New application - ${jobTitle} - ${name}`;
  const html = shell({
    eyebrow: "New application",
    title: name,
    intro: `Submitted for ${jobTitle}.`,
    preview: `New SADEEM application from ${name}.`,
    brand,
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

export function applicationRejection({
  name,
  jobTitle,
  brand,
}: {
  name: string;
  jobTitle: string;
  brand?: EmailBranding;
}) {
  const subject = `Update on your SADEEM application - ${jobTitle}`;
  const html = shell({
    eyebrow: "Application update",
    title: `Thank you, ${name}.`,
    intro: `We reviewed your application for ${jobTitle}.`,
    preview: `An update on your SADEEM application for ${jobTitle}.`,
    brand,
    children: `
      <p style="margin:0 0 18px;color:${ink};font-size:16px;line-height:1.7">We will not be moving forward with this role right now, but we appreciate the time and care you put into applying.</p>
      <p style="margin:0;color:${muted};font-size:15px;line-height:1.7">We are building the team deliberately, and we hope our paths cross again.</p>`,
  });
  return { subject, html };
}

export function bookingConfirmation({
  name,
  slotLabel,
  meetLink,
  brand,
}: {
  name: string;
  slotLabel: string;
  meetLink?: string | null;
  brand?: EmailBranding;
}) {
  const subject = "Consultation booked - SADEEM";
  const html = shell({
    eyebrow: "Consultation booked",
    title: `You're booked, ${name}.`,
    intro: `Your SADEEM consultation is scheduled for ${slotLabel}.`,
    preview: `Your SADEEM consultation is booked for ${slotLabel}.`,
    brand,
    children: `
      ${
        meetLink
          ? `<p style="margin:0 0 18px;color:${ink};font-size:16px;line-height:1.7">Join link: <a href="${esc(meetLink)}" style="color:${accent};font-weight:700">${esc(
              meetLink,
            )}</a></p>${actionLink(meetLink, "Join session")}`
          : `<p style="margin:0 0 18px;color:${ink};font-size:16px;line-height:1.7">We will follow up with the meeting details shortly.</p>`
      }
      <p style="margin:0;color:${muted};font-size:15px;line-height:1.7">We attached a calendar invite so the session lands in your calendar cleanly.</p>`,
  });
  return { subject, html };
}

export function campaignEmail({
  subject,
  body,
  leadName,
  unsubscribeUrl,
  brand,
}: {
  subject: string;
  body: string;
  leadName: string;
  unsubscribeUrl: string;
  brand?: EmailBranding;
}) {
  const html = shell({
    eyebrow: "SADEEM update",
    title: subject,
    intro: `Hi ${leadName},`,
    preview: subject,
    brand,
    children: campaignBody(body),
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
  brand,
}: {
  name: string;
  email: string;
  phone?: string | null;
  topic?: string | null;
  slotLabel: string;
  meetLink?: string | null;
  brand?: EmailBranding;
}) {
  const subject = `New consultation booking - ${name}`;
  const html = shell({
    eyebrow: "New consultation",
    title: name,
    intro: "A visitor booked through the custom consultation flow.",
    preview: `New SADEEM consultation booking from ${name}.`,
    brand,
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
