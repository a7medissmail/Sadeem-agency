import "server-only";
import sanitizeHtml from "sanitize-html";
import { getPublicSiteSettings } from "@/lib/site/settings";

// Inline-styled HTML email templates for Gmail/Outlook compatibility.

// ─── Dark shell tokens (existing templates) ───────────────────────────────────
const accent = "#FF6A00";
const dark = "#0D0D0F";
const panel = "#111113";
const ink = "#F5F3F0";
const muted = "#B8B8B8";
const soft = "#F5F3F0";
const line = "rgba(245,243,240,0.12)";

// ─── Light shell tokens (new editorial templates) ─────────────────────────────
const L = {
  outer:  "#f0eee9",
  bg:     "#fafaf7",
  text:   "#0D0D0F",
  sub:    "#1f1f24",
  gray:   "#6b6b6e",
  rule:   "#e6e4df",
  accent: "#FF6A00",
  dark:   "#0D0D0F",
  white:  "#F5F3F0",
  mono:   "'Geist Mono',Menlo,Consolas,monospace",
  sans:   "'Geist',Helvetica,Arial,sans-serif",
} as const;

// ─── Light shell helpers ──────────────────────────────────────────────────────

function lightShellHidden(text: string) {
  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(text)}</div>`;
}

/**
 * Light editorial email shell — matches the SADEEM Email Templates design.
 * Light background (#fafaf7), Geist Mono masthead, orange accent.
 */
function lightShell({
  preview,
  masthead,
  body,
  footerLines,
  width = 640,
  lang = "en",
  dir = "ltr",
}: {
  preview: string;
  masthead: string;        // prebuilt masthead row HTML
  body: string;            // main content HTML
  footerLines: string;     // plain footer text (Geist Mono, small)
  width?: number;
  lang?: string;
  dir?: "ltr" | "rtl";
}) {
  const arFont = lang === "ar" ? "'IBM Plex Sans Arabic',Tahoma," : "";
  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light" />
<style>
@media only screen and (max-width:640px){
  .lw{width:100%!important;max-width:100%!important;}
  .lp{padding-left:22px!important;padding-right:22px!important;}
  .lt{font-size:30px!important;}
}
</style>
</head>
<body dir="${dir}" style="margin:0;padding:0;background:${L.outer};font-family:${arFont}${L.sans};-webkit-font-smoothing:antialiased;">
${lightShellHidden(preview)}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${L.outer};">
  <tr>
    <td align="center" style="padding:0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${width}" class="lw" dir="${dir}" style="width:${width}px;max-width:${width}px;background:${L.bg};">
        ${masthead}
        ${body}
        <tr>
          <td class="lp" style="padding:24px 40px 36px 40px;border-top:1px solid ${L.rule};">
            <div style="font-family:${L.mono};font-size:10px;letter-spacing:0.22em;color:${L.gray};text-transform:uppercase;line-height:1.8;">
              ${footerLines}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`.trim();
}

function lMasthead(left: string, right: string, brand?: EmailBranding) {
  const logoCell = brand?.logoDarkUrl
    ? `<img src="${esc(brand.logoDarkUrl)}" height="30" alt="SADEEM" style="display:block;height:30px;width:auto;max-width:160px;border:0;outline:none;text-decoration:none;" />`
    : `<span style="font-family:${L.mono};font-size:11px;letter-spacing:0.32em;color:${L.text};">${left}</span>`;
  return `
<tr>
  <td class="lp" style="padding:28px 40px 0 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="vertical-align:middle;">${logoCell}</td>
        <td align="right" style="font-family:${L.mono};font-size:10px;letter-spacing:0.22em;color:${L.gray};text-transform:uppercase;vertical-align:middle;">${right}</td>
      </tr>
    </table>
    <div style="height:1px;background:${L.rule};margin-top:22px;font-size:0;line-height:0;">&nbsp;</div>
  </td>
</tr>`;
}

function lDarkBlock(children: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${L.dark};">
  <tr><td style="padding:28px 28px 24px 28px;">${children}</td></tr>
</table>`;
}

function lCta(href: string, label: string, dark = true) {
  const bg = dark ? L.dark : L.accent;
  const color = L.white;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="background:${bg};"><a href="${esc(href)}" style="display:inline-block;padding:16px 26px;font-family:${L.mono};font-size:10.5px;letter-spacing:0.24em;color:${color};text-decoration:none;text-transform:uppercase;">${esc(label)} →</a></td></tr>
</table>`;
}

function lOutlineBtn(href: string, label: string, onDark = false) {
  const borderColor = onDark ? "rgba(245,243,240,0.25)" : L.rule;
  const color = onDark ? L.white : L.text;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="border:1px solid ${borderColor};"><a href="${esc(href)}" style="display:inline-block;padding:15px 22px;font-family:${L.mono};font-size:10.5px;letter-spacing:0.24em;color:${color};text-decoration:none;text-transform:uppercase;">${esc(label)}</a></td></tr>
</table>`;
}

function lTableRow(label: string, value: string, last = false) {
  const border = last ? "" : `border-bottom:1px solid ${L.rule};`;
  return `<tr>
  <td width="38%" valign="top" style="padding:11px 12px 11px 0;font-family:${L.mono};font-size:10.5px;letter-spacing:0.22em;color:${L.gray};text-transform:uppercase;${border}">${esc(label)}</td>
  <td valign="top" style="padding:11px 0;font-family:${L.sans};font-size:14px;color:${L.sub};line-height:1.5;${border}">${esc(value)}</td>
</tr>`;
}

export type EmailBranding = {
  logoUrl?: string | null;      // light logo — for dark backgrounds (dark shell)
  logoDarkUrl?: string | null;  // dark logo  — for light backgrounds (light shell)
  footerEmail?: string | null;
};

export async function getEmailBranding(): Promise<EmailBranding> {
  const settings = await getPublicSiteSettings();
  return {
    logoUrl: settings.logoLightUrl || settings.logoDarkUrl,
    logoDarkUrl: settings.logoDarkUrl || settings.logoLightUrl,
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

/** Light-shell variant of campaignBody — uses L.sub text color for light backgrounds. */
function campaignBodyLight(value: string) {
  if (!hasHtml(value)) return paragraphs(value, L.sub);

  return sanitizeHtml(value, {
    allowedTags: ["a", "b", "br", "em", "i", "li", "ol", "p", "strong", "u", "ul"],
    allowedAttributes: {
      a: ["href", "title"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      p: () => ({
        tagName: "p",
        attribs: { style: `margin:0 0 18px;font-family:${L.sans};color:${L.sub};font-size:15px;line-height:1.7` },
      }),
      ul: () => ({
        tagName: "ul",
        attribs: { style: `margin:0 0 18px 20px;padding:0;color:${L.sub};font-size:15px;line-height:1.7` },
      }),
      ol: () => ({
        tagName: "ol",
        attribs: { style: `margin:0 0 18px 20px;padding:0;color:${L.sub};font-size:15px;line-height:1.7` },
      }),
      li: () => ({ tagName: "li", attribs: { style: "margin:0 0 8px" } }),
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          href: attribs.href,
          title: attribs.title,
          style: `color:${L.accent};font-weight:700;text-decoration:underline`,
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
  const subject = "We received your message — SADEEM";

  const body = `
<tr>
  <td class="lp" style="padding:44px 40px 8px 40px;">
    <div style="font-family:${L.mono};font-size:10.5px;letter-spacing:0.28em;color:${L.accent};text-transform:uppercase;margin-bottom:18px;">Message received</div>
    <h1 class="lt" style="margin:0 0 20px;font-family:${L.sans};font-weight:700;font-size:32px;line-height:1.05;letter-spacing:-0.025em;color:${L.text};">
      Thanks, ${esc(name)}.
    </h1>
    <p style="margin:0;font-family:${L.sans};font-size:14.5px;line-height:1.6;color:${L.gray};max-width:46ch;">
      Your message reached us. A member of the team will come back shortly — usually within one business day.
    </p>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:32px 40px 0 40px;">
    <div style="height:1px;background:${L.rule};font-size:0;line-height:0;">&nbsp;</div>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:28px 40px 44px 40px;">
    <p style="margin:0;font-family:${L.sans};font-size:13.5px;line-height:1.65;color:${L.gray};">
      Before we speak, it helps to think through the outcome you want, the constraint slowing you down, and what would make the next 90 days valuable. We work best when the ambition is clear and the operating reality is honest.
    </p>
  </td>
</tr>`;

  const html = lightShell({
    preview: "Your message reached SADEEM — we'll be in touch.",
    masthead: lMasthead("SADEEM", "Contact", brand),
    body,
    footerLines: `SADEEM · Strategic growth advisory<br />${brand?.footerEmail ?? "hello@sadeem.agency"}`,
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

  const rows: Array<[string, string]> = [
    ["Name", name],
    ["Email", email],
    ["Phone", phone ?? "—"],
    ["Company", company ?? "—"],
    ["Source", source],
    ["Message", message ?? "—"],
  ];

  const body = `
<tr>
  <td class="lp" style="padding:40px 40px 8px 40px;">
    <div style="font-family:${L.mono};font-size:10.5px;letter-spacing:0.28em;color:${L.accent};text-transform:uppercase;margin-bottom:14px;">New lead</div>
    <h1 class="lt" style="margin:0 0 8px;font-family:${L.sans};font-weight:700;font-size:28px;line-height:1.1;letter-spacing:-0.02em;color:${L.text};">${esc(name)}</h1>
    <p style="margin:0;font-family:${L.sans};font-size:13.5px;line-height:1.6;color:${L.gray};">Submitted via ${esc(source)}.</p>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:24px 40px 40px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${L.rule};">
      ${rows.map(([label, value], i) => lTableRow(label, value, i === rows.length - 1)).join("")}
    </table>
  </td>
</tr>`;

  const html = lightShell({
    preview: `New SADEEM lead from ${name}.`,
    masthead: lMasthead("SADEEM", "Lead", brand),
    body,
    footerLines: `SADEEM · Internal notification<br />${brand?.footerEmail ?? "hello@sadeem.agency"}`,
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
  const subject = `Application received — ${jobTitle}`;

  const body = `
<tr>
  <td class="lp" style="padding:44px 40px 8px 40px;">
    <div style="font-family:${L.mono};font-size:10.5px;letter-spacing:0.28em;color:${L.accent};text-transform:uppercase;margin-bottom:18px;">Application received</div>
    <h1 class="lt" style="margin:0 0 20px;font-family:${L.sans};font-weight:700;font-size:32px;line-height:1.05;letter-spacing:-0.025em;color:${L.text};">
      Thanks, ${esc(name)}.
    </h1>
    <p style="margin:0;font-family:${L.sans};font-size:14.5px;line-height:1.6;color:${L.gray};max-width:48ch;">
      We received your application. The team will review your profile against the role, the work ahead, and the operating rhythm we need.
    </p>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:28px 40px 0 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${L.rule};">
      ${lTableRow("Role", jobTitle, true)}
    </table>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:28px 40px 44px 40px;">
    <p style="margin:0;font-family:${L.sans};font-size:13.5px;line-height:1.65;color:${L.gray};">
      If there is a strong fit, we will follow up with next steps. We appreciate your interest.
    </p>
  </td>
</tr>`;

  const html = lightShell({
    preview: `SADEEM received your application for ${jobTitle}.`,
    masthead: lMasthead("SADEEM", "Careers", brand),
    body,
    footerLines: `SADEEM · Strategic growth advisory<br />${brand?.footerEmail ?? "hello@sadeem.agency"}`,
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

  const rows: Array<[string, string]> = [
    ["Name", name],
    ["Email", email],
    ["Phone", phone ?? "—"],
    ["Role", jobTitle],
    ["Cover note", coverNote ?? "—"],
  ];

  const body = `
<tr>
  <td class="lp" style="padding:40px 40px 8px 40px;">
    <div style="font-family:${L.mono};font-size:10.5px;letter-spacing:0.28em;color:${L.accent};text-transform:uppercase;margin-bottom:14px;">New application</div>
    <h1 class="lt" style="margin:0 0 8px;font-family:${L.sans};font-weight:700;font-size:28px;line-height:1.1;letter-spacing:-0.02em;color:${L.text};">${esc(name)}</h1>
    <p style="margin:0;font-family:${L.sans};font-size:13.5px;line-height:1.6;color:${L.gray};">Applied for ${esc(jobTitle)}.</p>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:24px 40px 40px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${L.rule};">
      ${rows.map(([label, value], i) => lTableRow(label, value, i === rows.length - 1)).join("")}
    </table>
  </td>
</tr>`;

  const html = lightShell({
    preview: `New SADEEM application from ${name}.`,
    masthead: lMasthead("SADEEM", "Careers", brand),
    body,
    footerLines: `SADEEM · Internal notification<br />${brand?.footerEmail ?? "hello@sadeem.agency"}`,
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
  const subject = `Update on your SADEEM application — ${jobTitle}`;

  const body = `
<tr>
  <td class="lp" style="padding:44px 40px 8px 40px;">
    <div style="font-family:${L.mono};font-size:10.5px;letter-spacing:0.28em;color:${L.gray};text-transform:uppercase;margin-bottom:18px;">Application update</div>
    <h1 class="lt" style="margin:0 0 20px;font-family:${L.sans};font-weight:700;font-size:32px;line-height:1.05;letter-spacing:-0.025em;color:${L.text};">
      Thank you, ${esc(name)}.
    </h1>
    <p style="margin:0;font-family:${L.sans};font-size:14.5px;line-height:1.6;color:${L.gray};max-width:48ch;">
      We reviewed your application for ${esc(jobTitle)}.
    </p>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:32px 40px 0 40px;">
    <div style="height:1px;background:${L.rule};font-size:0;line-height:0;">&nbsp;</div>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:28px 40px 44px 40px;">
    <p style="margin:0 0 16px;font-family:${L.sans};font-size:14.5px;line-height:1.6;color:${L.sub};">
      We will not be moving forward with this role right now, but we appreciate the time and care you put into applying.
    </p>
    <p style="margin:0;font-family:${L.sans};font-size:13.5px;line-height:1.65;color:${L.gray};">
      We are building the team deliberately, and we hope our paths cross again.
    </p>
  </td>
</tr>`;

  const html = lightShell({
    preview: `An update on your SADEEM application for ${jobTitle}.`,
    masthead: lMasthead("SADEEM", "Careers", brand),
    body,
    footerLines: `SADEEM · Strategic growth advisory<br />${brand?.footerEmail ?? "hello@sadeem.agency"}`,
  });

  return { subject, html };
}

// ─── Application shortlisted (interview stage) ────────────────────────────────

export function applicationShortlisted({
  name,
  jobTitle,
  brand,
}: {
  name: string;
  jobTitle: string;
  brand?: EmailBranding;
}) {
  const subject = `You've been shortlisted — ${jobTitle}`;

  const body = `
<tr>
  <td class="lp" style="padding:44px 40px 8px 40px;">
    <div style="font-family:${L.mono};font-size:10.5px;letter-spacing:0.28em;color:${L.gray};text-transform:uppercase;margin-bottom:18px;">Interview invite</div>
    <h1 class="lt" style="margin:0 0 20px;font-family:${L.sans};font-weight:700;font-size:32px;line-height:1.05;letter-spacing:-0.025em;color:${L.text};">
      Great news, ${esc(name)}.
    </h1>
    <p style="margin:0;font-family:${L.sans};font-size:14.5px;line-height:1.6;color:${L.gray};max-width:48ch;">
      Your application for <strong style="color:${L.text};">${esc(jobTitle)}</strong> has been shortlisted.
    </p>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:32px 40px 0 40px;">
    <div style="height:1px;background:${L.rule};font-size:0;line-height:0;">&nbsp;</div>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:28px 40px 44px 40px;">
    <p style="margin:0 0 16px;font-family:${L.sans};font-size:14.5px;line-height:1.6;color:${L.sub};">
      We reviewed your application and would like to invite you to an interview. A member of our team will reach out shortly to coordinate a time.
    </p>
    <p style="margin:0;font-family:${L.sans};font-size:13.5px;line-height:1.65;color:${L.gray};">
      We appreciate the effort you put in and look forward to the conversation.
    </p>
  </td>
</tr>`;

  const html = lightShell({
    preview: `You've been shortlisted for ${jobTitle} — we'd like to invite you to an interview.`,
    masthead: lMasthead("SADEEM", "Careers", brand),
    body,
    footerLines: `SADEEM · Strategic growth advisory<br />${brand?.footerEmail ?? "hello@sadeem.agency"}`,
  });

  return { subject, html };
}

// ─── Application offer ────────────────────────────────────────────────────────

export function applicationOffer({
  name,
  jobTitle,
  brand,
}: {
  name: string;
  jobTitle: string;
  brand?: EmailBranding;
}) {
  const subject = `We'd like to make you an offer — ${jobTitle}`;

  const body = `
<tr>
  <td class="lp" style="padding:44px 40px 8px 40px;">
    <div style="font-family:${L.mono};font-size:10.5px;letter-spacing:0.28em;color:${L.gray};text-transform:uppercase;margin-bottom:18px;">Offer extended</div>
    <h1 class="lt" style="margin:0 0 20px;font-family:${L.sans};font-weight:700;font-size:32px;line-height:1.05;letter-spacing:-0.025em;color:${L.text};">
      Welcome aboard, ${esc(name)}.
    </h1>
    <p style="margin:0;font-family:${L.sans};font-size:14.5px;line-height:1.6;color:${L.gray};max-width:48ch;">
      We're delighted to extend an offer for the <strong style="color:${L.text};">${esc(jobTitle)}</strong> position.
    </p>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:32px 40px 0 40px;">
    <div style="height:1px;background:${L.rule};font-size:0;line-height:0;">&nbsp;</div>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:28px 40px 44px 40px;">
    <p style="margin:0 0 16px;font-family:${L.sans};font-size:14.5px;line-height:1.6;color:${L.sub};">
      A member of our team will follow up with the full details and next steps very shortly.
    </p>
    <p style="margin:0;font-family:${L.sans};font-size:13.5px;line-height:1.65;color:${L.gray};">
      We are excited to have you join the SADEEM team and can't wait to get started.
    </p>
  </td>
</tr>`;

  const html = lightShell({
    preview: `We'd like to extend an offer for ${jobTitle}.`,
    masthead: lMasthead("SADEEM", "Careers", brand),
    body,
    footerLines: `SADEEM · Strategic growth advisory<br />${brand?.footerEmail ?? "hello@sadeem.agency"}`,
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
  const subject = "Consultation booked — SADEEM";

  const detailsBlock = lDarkBlock(`
    <div style="font-family:${L.mono};font-size:10.5px;letter-spacing:0.28em;color:${L.accent};text-transform:uppercase;margin-bottom:14px;">Session details</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid rgba(245,243,240,0.12);">
      <tr>
        <td width="38%" valign="top" style="padding:12px 12px 12px 0;font-family:${L.mono};font-size:10.5px;letter-spacing:0.22em;color:rgba(245,243,240,0.5);text-transform:uppercase;">When</td>
        <td valign="top" style="padding:12px 0;font-family:${L.sans};font-size:14px;color:${L.white};line-height:1.5;">${esc(slotLabel)}</td>
      </tr>
    </table>
    ${meetLink ? `
    <div style="margin-top:20px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background:${L.accent};">
            <a href="${esc(meetLink)}" style="display:inline-block;padding:14px 22px;font-family:${L.mono};font-size:10.5px;letter-spacing:0.24em;color:${L.white};text-decoration:none;text-transform:uppercase;">Join session →</a>
          </td>
        </tr>
      </table>
    </div>` : `<p style="margin:16px 0 0;font-family:${L.sans};font-size:13.5px;line-height:1.55;color:rgba(245,243,240,0.55);">We will follow up with the meeting details shortly.</p>`}
  `);

  const body = `
<tr>
  <td class="lp" style="padding:44px 40px 8px 40px;">
    <div style="font-family:${L.mono};font-size:10.5px;letter-spacing:0.28em;color:${L.accent};text-transform:uppercase;margin-bottom:18px;">Consultation booked</div>
    <h1 class="lt" style="margin:0 0 20px;font-family:${L.sans};font-weight:700;font-size:32px;line-height:1.05;letter-spacing:-0.025em;color:${L.text};">
      You're booked,<br />${esc(name)}.
    </h1>
    <p style="margin:0;font-family:${L.sans};font-size:14.5px;line-height:1.6;color:${L.gray};max-width:46ch;">
      Your SADEEM consultation is confirmed. We look forward to the conversation.
    </p>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:28px 40px 0 40px;">
    ${detailsBlock}
  </td>
</tr>
<tr>
  <td class="lp" style="padding:28px 40px 44px 40px;">
    <p style="margin:0;font-family:${L.sans};font-size:13.5px;line-height:1.65;color:${L.gray};">
      Come prepared with a clear view of where you are, where you want to be, and what's standing between the two.
    </p>
  </td>
</tr>`;

  const html = lightShell({
    preview: `Your SADEEM consultation is booked for ${slotLabel}.`,
    masthead: lMasthead("SADEEM", "Consultation", brand),
    body,
    footerLines: `SADEEM · Strategic growth advisory<br />${brand?.footerEmail ?? "hello@sadeem.agency"}`,
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
  const footerEmail = brand?.footerEmail ?? "hello@sadeem.agency";

  const bodyHtml = `
<tr>
  <td class="lp" style="padding:44px 40px 8px 40px;">
    <div style="font-family:${L.mono};font-size:10.5px;letter-spacing:0.28em;color:${L.accent};text-transform:uppercase;margin-bottom:18px;">SADEEM Update</div>
    <h1 class="lt" style="margin:0 0 20px;font-family:${L.sans};font-weight:700;font-size:28px;line-height:1.1;letter-spacing:-0.02em;color:${L.text};">${esc(subject)}</h1>
    <p style="margin:0 0 24px;font-family:${L.sans};font-size:14.5px;line-height:1.6;color:${L.gray};">Hi ${esc(leadName)},</p>
    <div style="font-family:${L.sans};font-size:15px;line-height:1.7;color:${L.sub};">
      ${campaignBodyLight(body)}
    </div>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:0 40px 44px 40px;">
    <div style="height:1px;background:${L.rule};margin-bottom:20px;font-size:0;line-height:0;">&nbsp;</div>
    <p style="margin:0;font-family:${L.sans};font-size:12px;line-height:1.6;color:${L.gray};">
      You are receiving this because you contacted SADEEM.
      <a href="${esc(unsubscribeUrl)}" style="color:${L.gray};text-decoration:underline;">Unsubscribe</a>
    </p>
  </td>
</tr>`;

  const html = lightShell({
    preview: subject,
    masthead: lMasthead("SADEEM", "Update", brand),
    body: bodyHtml,
    footerLines: `SADEEM · Strategic growth advisory<br />${footerEmail}`,
  });

  return { subject, html };
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW LIGHT-SHELL TEMPLATES (matching SADEEM Email Templates design)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Template 03 — Brief Received (Welcome)
 * Sent to the client when they submit their guided brief.
 * Dark hero block + 3-step onboarding timeline.
 */
export function briefReceivedClient({
  clientName,
  proposalTitle,
  brand,
  locale = "en",
}: {
  clientName: string;
  proposalTitle: string;
  brand?: EmailBranding;
  locale?: string;
}) {
  const ar = locale === "ar";
  const t = ar
    ? {
        subject: `استلمنا موجزك — ${proposalTitle}`,
        badge: "تم استلام الموجز",
        thankYou: `شكراً لك، ${esc(clientName)}.`,
        h1: `الآن يبدأ<br />العمل<br /><span style="color:${L.accent};">الحقيقي.</span>`,
        intro: `وصلنا موجزك الخاص بـ <strong style="color:${L.white};">${esc(proposalTitle)}</strong>. سنراجعه ونعود إليك برد مُفصّل — بلا قوالب جاهزة ولا حشو.`,
        whatNext: "ما الذي سيحدث تالياً",
        threeSteps: "ثلاث خطوات، بلا مفاجآت.",
        s1t: "مراجعة الموجز",
        s1b: "يقرأ فريقنا موجزك بالكامل — السياق والتحدي والأولويات — قبل أن ننطق بكلمة.",
        s2t: "مكالمة تحديد النطاق",
        s2b: "نحدّد مكالمة مركّزة مدتها 45 دقيقة لاختبار الموجز وتأكيد الشكل المناسب للتعاون.",
        s3t: "العرض",
        s3b: "تستلم عرضاً محدّد النطاق ومُسعّراً. شروط واضحة — بلا مراحل خفية ولا التزامات غامضة.",
        questions: "أسئلة قبل أن نتواصل؟ رُدّ مباشرة على هذا الإيميل أو راسلنا على",
        masthead2: "بوابة الموجز",
        preview: "تم استلام الموجز — سنتواصل معك قريباً.",
        footer: "SADEEM · استشارات النمو الاستراتيجي<br />hello@sadeem.agency",
      }
    : {
        subject: `We received your brief — ${proposalTitle}`,
        badge: "Brief received",
        thankYou: `Thank you, ${esc(clientName)}.`,
        h1: `Now the<br />real work<br /><span style="color:${L.accent};">starts.</span>`,
        intro: `Your brief for <strong style="color:${L.white};">${esc(proposalTitle)}</strong> is in. We'll review it and come back with a tailored response — no boilerplate, no filler.`,
        whatNext: "What happens next",
        threeSteps: "Three steps, no surprises.",
        s1t: "Brief review",
        s1b: "Our team reads your brief in full — context, challenge, and priorities — before we say a word.",
        s2t: "Scoping call",
        s2b: "We schedule a focused 45-minute conversation to pressure-test the brief and confirm the right engagement shape.",
        s3t: "Proposal",
        s3b: "You receive a scoped, priced proposal. Straightforward terms — no hidden phases, no retainer theatre.",
        questions: "Questions before we reach out? Reply directly to this email or write to",
        masthead2: "Brief portal",
        preview: "Brief received — we'll be in touch shortly.",
        footer: "SADEEM · Strategic growth advisory<br />hello@sadeem.agency",
      };
  const subject = t.subject;

  const heroBlock = `
<tr>
  <td style="background:${L.dark};padding:0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="lp" style="padding:24px 36px 0 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="font-family:${L.mono};font-size:11px;letter-spacing:0.32em;color:${L.white};">SADEEM</td>
              <td align="right" style="font-family:${L.mono};font-size:10px;letter-spacing:0.22em;color:rgba(245,243,240,0.5);text-transform:uppercase;">${t.badge}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td class="lp" style="padding:56px 36px 52px 36px;">
          <div style="font-family:${L.mono};font-size:10.5px;letter-spacing:0.32em;color:${L.accent};text-transform:uppercase;margin-bottom:22px;">${t.thankYou}</div>
          <h1 class="lt" style="margin:0;font-family:${L.sans};font-weight:700;font-size:44px;line-height:0.98;letter-spacing:-0.035em;color:${L.white};text-transform:uppercase;">
            ${t.h1}
          </h1>
          <p style="margin:28px 0 0;font-family:${L.sans};font-size:15px;line-height:1.6;color:rgba(245,243,240,0.72);max-width:36ch;">
            ${t.intro}
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>`;

  const timelineBlock = `
<tr>
  <td class="lp" style="padding:44px 36px 12px 36px;">
    <div style="font-family:${L.mono};font-size:10.5px;letter-spacing:0.28em;color:${L.accent};text-transform:uppercase;margin-bottom:6px;">${t.whatNext}</div>
    <h2 style="margin:0 0 28px;font-family:${L.sans};font-weight:700;font-size:26px;line-height:1.05;letter-spacing:-0.02em;color:${L.text};">${t.threeSteps}</h2>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:0 36px 0 36px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${L.rule};">
      <tr>
        <td valign="top" width="80" style="padding:22px 0;font-family:${L.mono};font-size:11px;letter-spacing:0.24em;color:${L.accent};">01</td>
        <td valign="top" style="padding:22px 0;">
          <div style="font-family:${L.sans};font-weight:600;font-size:16px;letter-spacing:-0.01em;color:${L.text};margin-bottom:5px;">${t.s1t}</div>
          <div style="font-family:${L.sans};font-size:13.5px;line-height:1.55;color:${L.gray};">${t.s1b}</div>
        </td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${L.rule};">
      <tr>
        <td valign="top" width="80" style="padding:22px 0;font-family:${L.mono};font-size:11px;letter-spacing:0.24em;color:${L.accent};">02</td>
        <td valign="top" style="padding:22px 0;">
          <div style="font-family:${L.sans};font-weight:600;font-size:16px;letter-spacing:-0.01em;color:${L.text};margin-bottom:5px;">${t.s2t}</div>
          <div style="font-family:${L.sans};font-size:13.5px;line-height:1.55;color:${L.gray};">${t.s2b}</div>
        </td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${L.rule};border-bottom:1px solid ${L.rule};">
      <tr>
        <td valign="top" width="80" style="padding:22px 0;font-family:${L.mono};font-size:11px;letter-spacing:0.24em;color:${L.accent};">03</td>
        <td valign="top" style="padding:22px 0;">
          <div style="font-family:${L.sans};font-weight:600;font-size:16px;letter-spacing:-0.01em;color:${L.text};margin-bottom:5px;">${t.s3t}</div>
          <div style="font-family:${L.sans};font-size:13.5px;line-height:1.55;color:${L.gray};">${t.s3b}</div>
        </td>
      </tr>
    </table>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:36px 36px 8px 36px;">
    <p style="margin:0;font-family:${L.sans};font-size:14px;line-height:1.6;color:${L.gray};">
      ${t.questions} <a href="mailto:hello@sadeem.agency" style="color:${L.accent};text-decoration:none;border-bottom:1px solid ${L.accent};padding-bottom:1px;">hello@sadeem.agency</a>
    </p>
  </td>
</tr>`;

  const html = lightShell({
    preview: t.preview,
    masthead: lMasthead("SADEEM", t.masthead2, brand),
    body: heroBlock + timelineBlock,
    footerLines: t.footer,
    lang: ar ? "ar" : "en",
    dir: ar ? "rtl" : "ltr",
  });

  return { subject, html };
}

/**
 * Template 05 — Engagement Confirmed (Transactional)
 * Sent to the client when they digitally accept a quotation.
 */
export function quotationAcceptedClient({
  clientName,
  proposalTitle,
  quotationTitle,
  engagementRef,
  total,
  currency,
  portalUrl,
  brand,
}: {
  clientName: string;
  proposalTitle: string;
  quotationTitle: string;
  engagementRef: string;
  total: number;
  currency: string;
  portalUrl?: string;
  brand?: EmailBranding;
}) {
  const subject = `Engagement confirmed — ${quotationTitle}`;

  const fmtTotal = new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(total);

  const accessBlock = portalUrl ? lDarkBlock(`
    <div style="font-family:${L.mono};font-size:10.5px;letter-spacing:0.28em;color:${L.accent};text-transform:uppercase;margin-bottom:14px;">Next steps</div>
    <p style="margin:0 0 22px;font-family:${L.sans};font-size:14.5px;line-height:1.55;color:rgba(245,243,240,0.78);max-width:42ch;">
      We'll be in touch within one business day to schedule your kick-off session and share onboarding materials.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background:${L.accent};">
          <a href="${esc(portalUrl)}" style="display:inline-block;padding:14px 22px;font-family:${L.mono};font-size:10.5px;letter-spacing:0.24em;color:${L.white};text-decoration:none;text-transform:uppercase;">View quotation →</a>
        </td>
      </tr>
    </table>
  `) : "";

  const body = `
<tr>
  <td class="lp" style="padding:40px 36px 8px 36px;">
    <div style="font-family:${L.mono};font-size:10.5px;letter-spacing:0.28em;color:${L.accent};text-transform:uppercase;margin-bottom:14px;">● Confirmed</div>
    <h1 class="lt" style="margin:0;font-family:${L.sans};font-weight:700;font-size:32px;line-height:1.05;letter-spacing:-0.025em;color:${L.text};">
      ${esc(clientName)},<br />you're confirmed.
    </h1>
    <p style="margin:18px 0 0;font-family:${L.sans};font-size:14.5px;line-height:1.55;color:${L.gray};max-width:46ch;">
      Thank you for accepting the proposal. Your engagement is now confirmed and the team is alerted.
    </p>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:32px 36px 0 36px;">
    <div style="font-family:${L.mono};font-size:10.5px;letter-spacing:0.28em;color:${L.text};text-transform:uppercase;margin-bottom:14px;">Summary</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${L.rule};">
      ${lTableRow("Engagement", quotationTitle)}
      ${lTableRow("Brief", proposalTitle)}
      ${lTableRow("Reference", engagementRef)}
      ${lTableRow("Total", fmtTotal, true)}
    </table>
  </td>
</tr>
${accessBlock ? `<tr><td class="lp" style="padding:32px 36px 0 36px;">${accessBlock}</td></tr>` : ""}
<tr>
  <td class="lp" style="padding:32px 36px 8px 36px;">
    <p style="margin:0;font-family:${L.sans};font-size:13.5px;line-height:1.6;color:${L.gray};">
      Questions? Reply to this email or write to <a href="mailto:hello@sadeem.agency" style="color:${L.accent};text-decoration:none;border-bottom:1px solid ${L.accent};padding-bottom:1px;">hello@sadeem.agency</a>
    </p>
  </td>
</tr>`;

  const html = lightShell({
    preview: `Your engagement is confirmed — ${quotationTitle}.`,
    masthead: lMasthead(`SADEEM`, `Ref · ${engagementRef}`, brand),
    body,
    footerLines: `SADEEM · Strategic growth advisory<br />hello@sadeem.agency`,
  });

  return { subject, html };
}

/**
 * Quotation response notification for the admin/team.
 * Sent internally when a client accepts or declines a quotation.
 */
export function quotationAcceptedAdmin({
  clientName,
  clientEmail,
  quotationTitle,
  proposalTitle,
  total,
  currency,
  adminUrl,
  action = "accepted",
  declineReason,
  brand,
}: {
  clientName: string;
  clientEmail: string;
  quotationTitle: string;
  proposalTitle: string;
  total: number;
  currency: string;
  adminUrl: string;
  action?: "accepted" | "declined";
  declineReason?: string | null;
  brand?: EmailBranding;
}) {
  const accepted = action === "accepted";
  const fmtTotal = new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(total);

  const subject = accepted
    ? `Quotation accepted — ${clientName} · ${quotationTitle}`
    : `Quotation declined — ${clientName} · ${quotationTitle}`;

  const rows: Array<[string, string]> = [
    ["Client", clientName],
    ["Email", clientEmail],
    ["Brief", proposalTitle],
    ["Quotation", quotationTitle],
    ["Total", fmtTotal],
  ];
  if (declineReason) rows.push(["Reason", declineReason]);

  const kickerColor = accepted ? L.accent : L.gray;
  const kickerLabel = accepted ? "Quotation accepted" : "Quotation declined";
  const introText = accepted
    ? `${esc(clientName)} accepted the quotation for &ldquo;${esc(quotationTitle)}&rdquo;. The proposal has been marked as converted.`
    : `${esc(clientName)} declined the quotation for &ldquo;${esc(quotationTitle)}&rdquo;.`;

  const body = `
<tr>
  <td class="lp" style="padding:40px 40px 8px 40px;">
    <div style="font-family:${L.mono};font-size:10.5px;letter-spacing:0.28em;color:${kickerColor};text-transform:uppercase;margin-bottom:14px;">${kickerLabel}</div>
    <h1 class="lt" style="margin:0 0 8px;font-family:${L.sans};font-weight:700;font-size:28px;line-height:1.1;letter-spacing:-0.02em;color:${L.text};">${esc(clientName)}</h1>
    <p style="margin:0;font-family:${L.sans};font-size:13.5px;line-height:1.6;color:${L.gray};">${introText}</p>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:24px 40px 0 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${L.rule};">
      ${rows.map(([label, value], i) => lTableRow(label, value, i === rows.length - 1)).join("")}
    </table>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:28px 40px 40px 40px;">
    ${lCta(adminUrl, "Review in admin")}
  </td>
</tr>`;

  const html = lightShell({
    preview: accepted
      ? `${clientName} accepted "${quotationTitle}" — ${fmtTotal}`
      : `${clientName} declined "${quotationTitle}"`,
    masthead: lMasthead("SADEEM", "Quotation", brand),
    body,
    footerLines: `SADEEM · Internal notification<br />${brand?.footerEmail ?? "hello@sadeem.agency"}`,
  });
  return { subject, html };
}

/**
 * Brief submission notification for the admin team.
 * Sent internally when a client completes the guided brief.
 */
export function briefSubmittedAdmin({
  clientName,
  clientEmail,
  clientCompany,
  proposalTitle,
  adminUrl,
  brand,
}: {
  clientName: string;
  clientEmail: string;
  clientCompany?: string | null;
  proposalTitle: string;
  adminUrl: string;
  brand?: EmailBranding;
}) {
  const subject = `Brief received — ${clientName} · ${proposalTitle}`;

  const rows: Array<[string, string]> = [
    ["Client", clientName],
    ["Email", clientEmail],
    ["Company", clientCompany ?? "—"],
    ["Brief", proposalTitle],
  ];

  const body = `
<tr>
  <td class="lp" style="padding:40px 40px 8px 40px;">
    <div style="font-family:${L.mono};font-size:10.5px;letter-spacing:0.28em;color:${L.accent};text-transform:uppercase;margin-bottom:14px;">New brief submission</div>
    <h1 class="lt" style="margin:0 0 8px;font-family:${L.sans};font-weight:700;font-size:28px;line-height:1.1;letter-spacing:-0.02em;color:${L.text};">${esc(clientName)}</h1>
    <p style="margin:0;font-family:${L.sans};font-size:13.5px;line-height:1.6;color:${L.gray};">Submitted their guided brief for &ldquo;${esc(proposalTitle)}&rdquo;.</p>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:24px 40px 0 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${L.rule};">
      ${rows.map(([label, value], i) => lTableRow(label, value, i === rows.length - 1)).join("")}
    </table>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:28px 40px 40px 40px;">
    ${lCta(adminUrl, "Review brief in admin")}
  </td>
</tr>`;

  const html = lightShell({
    preview: `${clientName} submitted their brief — review it now.`,
    masthead: lMasthead("SADEEM", "Proposals", brand),
    body,
    footerLines: `SADEEM · Internal notification<br />${brand?.footerEmail ?? "hello@sadeem.agency"}`,
  });
  return { subject, html };
}

/**
 * Proposal invite sent to the client when the admin emails the magic link.
 * Introduces the portal and gives a clear CTA to open the brief.
 */
export function proposalInviteClient({
  clientName,
  proposalTitle,
  portalUrl,
  expiresDate,
  brand,
  locale = "en",
}: {
  clientName: string;
  proposalTitle: string;
  portalUrl: string;
  expiresDate: string;
  brand?: EmailBranding;
  locale?: string;
}) {
  const ar = locale === "ar";
  const email = brand?.footerEmail ?? "hello@sadeem.agency";
  const t = ar
    ? {
        subject: `بوابة الموجز جاهزة — ${proposalTitle}`,
        badge: "موجز خاص",
        hi: `أهلاً ${esc(clientName)}.`,
        h1: `بوابة<br />الموجز<br /><span style="color:${L.accent};">جاهزة.</span>`,
        intro: `جهّزنا لك بوابة خاصة لـ <strong style="color:${L.white};">${esc(proposalTitle)}</strong>. استخدم الرابط بالأسفل لفتحها، اقرأ الموجز، وشاركنا سياقك.`,
        openEyebrow: "افتح بوابتك",
        expiry: `الرابط خاص وينتهي في <strong style="color:${L.sub};">${esc(expiresDate)}</strong>. لا تُعِد توجيهه — أنت وحدك من ينبغي أن يصل لهذا الموجز.`,
        cta: "افتح بوابة الموجز",
        questions: "لو عندك أي أسئلة قبل ملئه، رُدّ على هذا الإيميل أو راسلنا على",
        masthead2: "بوابة الموجز",
        preview: `بوابة موجز سديم الخاصة بـ "${proposalTitle}" جاهزة.`,
        footer: `SADEEM · استشارات النمو الاستراتيجي<br />${email}<br />هذا الرابط شخصي — لا تُعِد توجيهه.`,
      }
    : {
        subject: `Your brief portal is ready — ${proposalTitle}`,
        badge: "Private brief",
        hi: `Hi, ${esc(clientName)}.`,
        h1: `Your brief<br />portal is<br /><span style="color:${L.accent};">ready.</span>`,
        intro: `We prepared a private portal for <strong style="color:${L.white};">${esc(proposalTitle)}</strong>. Use the link below to open it, read through the brief, and share your context.`,
        openEyebrow: "Open your portal",
        expiry: `The link is private and expires on <strong style="color:${L.sub};">${esc(expiresDate)}</strong>. Do not forward it — only you should access this brief.`,
        cta: "Open your brief portal",
        questions: "If you have questions before filling it in, reply to this email or write to",
        masthead2: "Brief portal",
        preview: `Your private SADEEM brief portal for "${proposalTitle}" is ready.`,
        footer: `SADEEM · Strategic growth advisory<br />${email}<br />This link is personal — do not forward.`,
      };
  const subject = t.subject;

  const heroBlock = `
<tr>
  <td style="background:${L.dark};padding:0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="lp" style="padding:24px 36px 0 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="font-family:${L.mono};font-size:11px;letter-spacing:0.32em;color:${L.white};">SADEEM</td>
              <td align="right" style="font-family:${L.mono};font-size:10px;letter-spacing:0.22em;color:rgba(245,243,240,0.5);text-transform:uppercase;">${t.badge}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td class="lp" style="padding:52px 36px 48px 36px;">
          <div style="font-family:${L.mono};font-size:10.5px;letter-spacing:0.32em;color:${L.accent};text-transform:uppercase;margin-bottom:20px;">${t.hi}</div>
          <h1 class="lt" style="margin:0;font-family:${L.sans};font-weight:700;font-size:40px;line-height:1.0;letter-spacing:-0.03em;color:${L.white};">
            ${t.h1}
          </h1>
          <p style="margin:26px 0 0;font-family:${L.sans};font-size:15px;line-height:1.6;color:rgba(245,243,240,0.72);max-width:38ch;">
            ${t.intro}
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>`;

  const body = `
${heroBlock}
<tr>
  <td class="lp" style="padding:40px 36px 0 36px;">
    <div style="font-family:${L.mono};font-size:10.5px;letter-spacing:0.28em;color:${L.accent};text-transform:uppercase;margin-bottom:16px;">${t.openEyebrow}</div>
    <p style="margin:0 0 22px;font-family:${L.sans};font-size:14.5px;line-height:1.6;color:${L.gray};max-width:46ch;">
      ${t.expiry}
    </p>
    ${lCta(portalUrl, t.cta)}
  </td>
</tr>
<tr>
  <td class="lp" style="padding:32px 36px 0 36px;">
    <div style="height:1px;background:${L.rule};font-size:0;line-height:0;">&nbsp;</div>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:28px 36px 8px 36px;">
    <p style="margin:0;font-family:${L.sans};font-size:13.5px;line-height:1.65;color:${L.gray};">
      ${t.questions} <a href="mailto:${esc(email)}" style="color:${L.accent};text-decoration:none;border-bottom:1px solid ${L.accent};padding-bottom:1px;">${esc(email)}</a>
    </p>
  </td>
</tr>`;

  const html = lightShell({
    preview: t.preview,
    masthead: lMasthead("SADEEM", t.masthead2, brand),
    body,
    footerLines: t.footer,
    lang: ar ? "ar" : "en",
    dir: ar ? "rtl" : "ltr",
  });

  return { subject, html };
}

/**
 * Quotation invite sent to the client when the admin sends the quotation link.
 * Introduces the pricing portal and gives a clear CTA to review and respond.
 */
export function quotationInviteClient({
  clientName,
  proposalTitle,
  quotationTitle,
  portalUrl,
  expiresDate,
  total,
  currency,
  brand,
}: {
  clientName: string;
  proposalTitle: string;
  quotationTitle: string;
  portalUrl: string;
  expiresDate: string;
  total: number;
  currency: string;
  brand?: EmailBranding;
}) {
  const subject = `Your quotation is ready — ${quotationTitle}`;

  const fmtTotal = new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(total);

  const heroBlock = `
<tr>
  <td style="background:${L.dark};padding:0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="lp" style="padding:24px 36px 0 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="font-family:${L.mono};font-size:11px;letter-spacing:0.32em;color:${L.white};">SADEEM</td>
              <td align="right" style="font-family:${L.mono};font-size:10px;letter-spacing:0.22em;color:rgba(245,243,240,0.5);text-transform:uppercase;">Quotation</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td class="lp" style="padding:48px 36px 44px 36px;">
          <div style="font-family:${L.mono};font-size:10.5px;letter-spacing:0.32em;color:${L.accent};text-transform:uppercase;margin-bottom:18px;">${esc(clientName)},</div>
          <h1 class="lt" style="margin:0;font-family:${L.sans};font-weight:700;font-size:38px;line-height:1.0;letter-spacing:-0.03em;color:${L.white};">
            Your<br />quotation<br /><span style="color:${L.accent};">is ready.</span>
          </h1>
          <p style="margin:22px 0 0;font-family:${L.sans};font-size:15px;line-height:1.6;color:rgba(245,243,240,0.72);max-width:40ch;">
            We prepared a scoped quotation for <strong style="color:${L.white};">${esc(proposalTitle)}</strong>. Review the detail and let us know how you would like to proceed.
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>`;

  const body = `
${heroBlock}
<tr>
  <td class="lp" style="padding:36px 36px 0 36px;">
    <div style="font-family:${L.mono};font-size:10.5px;letter-spacing:0.28em;color:${L.text};text-transform:uppercase;margin-bottom:14px;">Summary</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${L.rule};">
      ${lTableRow("Engagement", quotationTitle)}
      ${lTableRow("Brief", proposalTitle)}
      ${lTableRow("Total", fmtTotal, true)}
    </table>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:28px 36px 0 36px;">
    <p style="margin:0 0 22px;font-family:${L.sans};font-size:14.5px;line-height:1.6;color:${L.gray};max-width:46ch;">
      The link is private and expires on <strong style="color:${L.sub};">${esc(expiresDate)}</strong>. You can accept or decline directly from the portal — no separate email required.
    </p>
    ${lCta(portalUrl, "Review your quotation")}
  </td>
</tr>
<tr>
  <td class="lp" style="padding:28px 36px 0 36px;">
    <div style="height:1px;background:${L.rule};font-size:0;line-height:0;">&nbsp;</div>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:24px 36px 8px 36px;">
    <p style="margin:0;font-family:${L.sans};font-size:13.5px;line-height:1.65;color:${L.gray};">
      Questions about scope or terms? Reply to this email or write to <a href="mailto:${esc(brand?.footerEmail ?? "hello@sadeem.agency")}" style="color:${L.accent};text-decoration:none;border-bottom:1px solid ${L.accent};padding-bottom:1px;">${esc(brand?.footerEmail ?? "hello@sadeem.agency")}</a>
    </p>
  </td>
</tr>`;

  const html = lightShell({
    preview: `Your SADEEM quotation for "${quotationTitle}" is ready to review.`,
    masthead: lMasthead("SADEEM", "Quotation portal", brand),
    body,
    footerLines: `SADEEM · Strategic growth advisory<br />${brand?.footerEmail ?? "hello@sadeem.agency"}<br />This link is personal — do not forward.`,
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

  const rows: Array<[string, string]> = [
    ["Name", name],
    ["Email", email],
    ["Phone", phone ?? "—"],
    ["When", slotLabel],
    ["Meet link", meetLink ?? "—"],
    ["Topic", topic ?? "—"],
  ];

  const body = `
<tr>
  <td class="lp" style="padding:40px 40px 8px 40px;">
    <div style="font-family:${L.mono};font-size:10.5px;letter-spacing:0.28em;color:${L.accent};text-transform:uppercase;margin-bottom:14px;">New consultation</div>
    <h1 class="lt" style="margin:0 0 8px;font-family:${L.sans};font-weight:700;font-size:28px;line-height:1.1;letter-spacing:-0.02em;color:${L.text};">${esc(name)}</h1>
    <p style="margin:0;font-family:${L.sans};font-size:13.5px;line-height:1.6;color:${L.gray};">Booked through the consultation flow.</p>
  </td>
</tr>
<tr>
  <td class="lp" style="padding:24px 40px 40px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${L.rule};">
      ${rows.map(([label, value], i) => lTableRow(label, value, i === rows.length - 1)).join("")}
    </table>
  </td>
</tr>`;

  const html = lightShell({
    preview: `New SADEEM consultation booking from ${name}.`,
    masthead: lMasthead("SADEEM", "Consultation", brand),
    body,
    footerLines: `SADEEM · Internal notification<br />${brand?.footerEmail ?? "hello@sadeem.agency"}`,
  });
  return { subject, html };
}
