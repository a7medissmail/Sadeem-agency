import sanitizeHtml from "sanitize-html";

const safeTextStyle = /^(?!.*(?:url|expression|javascript|@import))[-#(),.%\s\w]+$/i;
const safeLength = /^(?:0|[-+]?\d{1,3}(?:\.\d+)?(?:px|rem|em|%|vh|vw)?)$/;
const safeBox = /^(?!.*(?:url|expression|javascript|@import))(?:0|[-+]?\d{1,3}(?:\.\d+)?(?:px|rem|em|%|vh|vw)?)(?:\s+(?:0|[-+]?\d{1,3}(?:\.\d+)?(?:px|rem|em|%|vh|vw)?)){0,3}$/i;
const safeBorder = /^(?!.*(?:url|expression|javascript|@import))\d{1,2}(?:\.\d+)?px\s+(?:solid|dashed|dotted)\s+[-#(),.%\s\w]+$/i;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function plainTextToHtml(value: string) {
  return value
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export function sanitizeCourseHtml(value: string | null | undefined) {
  const input = value?.trim();
  if (!input) return "";

  const html = /<\/?[a-z][\s\S]*>/i.test(input) ? input : plainTextToHtml(input);

  return sanitizeHtml(html, {
    allowedTags: [
      "a",
      "b",
      "blockquote",
      "br",
      "code",
      "div",
      "em",
      "h2",
      "h3",
      "h4",
      "hr",
      "i",
      "img",
      "li",
      "ol",
      "p",
      "pre",
      "s",
      "span",
      "strong",
      "u",
      "ul",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel", "style"],
      img: ["src", "alt", "title", "loading", "style"],
      "*": ["style"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https"],
    },
    allowedStyles: {
      "*": {
        color: [safeTextStyle],
        "background-color": [safeTextStyle],
        "border-left": [safeBorder],
        "font-size": [safeLength],
        "font-style": [/^(?:normal|italic)$/],
        "font-weight": [/^(?:normal|bold|[1-9]00)$/],
        "letter-spacing": [safeLength],
        "line-height": [/^(?:normal|[-+]?\d{1,2}(?:\.\d+)?(?:px|rem|em|%)?)$/],
        margin: [safeBox],
        "margin-bottom": [safeLength],
        "margin-left": [safeLength],
        "margin-right": [safeLength],
        "margin-top": [safeLength],
        padding: [safeBox],
        "padding-bottom": [safeLength],
        "padding-left": [safeLength],
        "padding-right": [safeLength],
        "padding-top": [safeLength],
        "text-align": [/^(?:left|right|center|justify)$/],
        "text-decoration": [/^(?:none|underline|line-through)$/],
      },
    },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: "noopener noreferrer",
        },
      }),
      img: (tagName, attribs) => ({
        tagName,
        attribs: {
          loading: "lazy",
          ...attribs,
        },
      }),
    },
  });
}
