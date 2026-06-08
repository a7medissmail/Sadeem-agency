// Bilingual strings for the quotation portal (EN/AR). Locale inherited from the
// linked proposal (a quote is for the same client).

export type QuoteLocale = "en" | "ar";

export type QuoteDict = {
  dir: "ltr" | "rtl";
  badge: string;
  notFound: { title: string; body: (email: string) => string };
  expired: { tag: string; title: string; body: string; cta: string; subject: (title: string) => string };
  status: { accepted: string; declined: string };
  preparedFor: string;
  table: { service: string; qty: string; unit: string; unitPrice: string; total: string };
  totals: { subtotal: string; discount: string; tax: string; grand: string };
  validity: (days: number, date: string) => string;
  footer: { tagline: string; questions: string };
  resp: {
    acceptedTitle: string; acceptedBody: string;
    declinedTitle: string; declinedBody: (email: string) => string;
    declineLabel: string; declinePlaceholder: string;
    cancel: string; confirmDecline: string; sending: string;
    decline: string; accept: string; processing: string;
    note: string; genericError: string;
  };
};

const en: QuoteDict = {
  dir: "ltr",
  badge: "Quotation",
  notFound: {
    title: "Link not found.",
    body: (email) => `This link doesn't match any quotation in our system. Contact us at ${email}`,
  },
  expired: {
    tag: "Expired",
    title: "This quote has expired.",
    body: "Reach out and we'll send a refreshed version.",
    cta: "Contact us",
    subject: (title) => `Expired quote: ${title}`,
  },
  status: { accepted: "Accepted", declined: "Declined" },
  preparedFor: "Prepared for",
  table: { service: "Service", qty: "Qty", unit: "Unit", unitPrice: "Unit price", total: "Total" },
  totals: { subtotal: "Subtotal", discount: "Discount", tax: "Tax", grand: "Total" },
  validity: (days, date) => `This quote is valid for ${days} days from ${date}.`,
  footer: { tagline: "SADEEM · Strategic Growth Advisory", questions: "Questions?" },
  resp: {
    acceptedTitle: "Quote accepted.",
    acceptedBody: "Our team has been notified. We'll be in touch shortly with next steps.",
    declinedTitle: "Quote declined.",
    declinedBody: (email) => `We've received your response. If you'd like to discuss alternatives, reach out at ${email}.`,
    declineLabel: "Why are you declining? (optional)",
    declinePlaceholder: "e.g. Budget constraints, timing not right, going with another provider...",
    cancel: "Cancel",
    confirmDecline: "Confirm decline",
    sending: "Sending…",
    decline: "Decline",
    accept: "Accept quote →",
    processing: "Processing…",
    note: "By accepting, you confirm your intent to proceed with the outlined scope. This is not a binding contract.",
    genericError: "Something went wrong.",
  },
};

const ar: QuoteDict = {
  dir: "rtl",
  badge: "عرض سعر",
  notFound: {
    title: "الرابط غير موجود.",
    body: (email) => `هذا الرابط لا يطابق أي عرض سعر في نظامنا. تواصل معنا على ${email}`,
  },
  expired: {
    tag: "منتهي",
    title: "انتهت صلاحية هذا العرض.",
    body: "تواصل معنا وسنرسل لك نسخة محدّثة.",
    cta: "تواصل معنا",
    subject: (title) => `عرض سعر منتهي: ${title}`,
  },
  status: { accepted: "مقبول", declined: "مرفوض" },
  preparedFor: "مُعدّ لـ",
  table: { service: "البند", qty: "الكمية", unit: "الوحدة", unitPrice: "سعر الوحدة", total: "الإجمالي" },
  totals: { subtotal: "الإجمالي الفرعي", discount: "خصم", tax: "ضريبة", grand: "الإجمالي" },
  validity: (days, date) => `هذا العرض صالح لمدة ${days} يوماً من ${date}.`,
  footer: { tagline: "SADEEM · استشارات النمو الاستراتيجي", questions: "لديك أسئلة؟" },
  resp: {
    acceptedTitle: "تم قبول العرض.",
    acceptedBody: "تم إخطار فريقنا. سنتواصل معك قريباً بالخطوات التالية.",
    declinedTitle: "تم رفض العرض.",
    declinedBody: (email) => `استلمنا ردّك. لو حابب تناقش بدائل، تواصل معنا على ${email}.`,
    declineLabel: "لماذا ترفض؟ (اختياري)",
    declinePlaceholder: "مثال: قيود الميزانية، التوقيت غير مناسب، اخترنا مزوّداً آخر...",
    cancel: "إلغاء",
    confirmDecline: "تأكيد الرفض",
    sending: "جارٍ الإرسال…",
    decline: "رفض",
    accept: "قبول العرض",
    processing: "جارٍ المعالجة…",
    note: "بقبولك، تؤكّد رغبتك في المضي قدماً بالنطاق الموضّح. هذا ليس عقداً ملزماً.",
    genericError: "حدث خطأ ما.",
  },
};

export function quoteDict(locale: string | null | undefined): QuoteDict {
  return locale === "ar" ? ar : en;
}
