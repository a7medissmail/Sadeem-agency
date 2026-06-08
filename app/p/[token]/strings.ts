// Bilingual strings for the brief portal chrome (EN/AR).
// Slice 1 of Phase 1 — per-record locale on proposals. The BriefStepper itself
// is translated in a later slice.

export type PortalLocale = "en" | "ar";

export type PortalDict = {
  dir: "ltr" | "rtl";
  eyebrow: string;
  badge: string;
  notFound: { title: string; body: (email: string) => string };
  expired: { tag: string; hi: (first: string) => string; line2: string; body: string; cta: string; subject: (title: string) => string };
  submitted: { tag: string; title: string; body: (title: string) => string };
  greeting: { tag: string; lead: (first: string) => string; sub: (company: string) => string };
  footer: { tagline: string; questions: string };
};

const en: PortalDict = {
  dir: "ltr",
  eyebrow: "Brief Portal",
  badge: "Private brief",
  notFound: {
    title: "Link not found.",
    body: (email) => `This link doesn't match any brief in our system. If you believe this is an error, contact us at ${email}`,
  },
  expired: {
    tag: "Expired",
    hi: (first) => `Hi ${first},`,
    line2: "this link has expired.",
    body: "Reach out to us directly and we'll send a fresh link.",
    cta: "Contact us",
    subject: (title) => `Expired brief: ${title}`,
  },
  submitted: {
    tag: "Submitted",
    title: "Already received.",
    body: (title) => `We have your brief for ${title}. Our team will be in touch shortly.`,
  },
  greeting: {
    tag: "Private",
    lead: (first) => `Hi ${first}, let's map`,
    sub: (company) => `This brief is prepared for ${company}.`,
  },
  footer: {
    tagline: "SADEEM · Strategic Growth Advisory",
    questions: "Questions?",
  },
};

const ar: PortalDict = {
  dir: "rtl",
  eyebrow: "بوابة الموجز",
  badge: "موجز خاص",
  notFound: {
    title: "الرابط غير موجود.",
    body: (email) => `هذا الرابط لا يطابق أي موجز في نظامنا. إذا كنت تعتقد أن هذا خطأ، تواصل معنا على ${email}`,
  },
  expired: {
    tag: "منتهي",
    hi: (first) => `أهلاً ${first}،`,
    line2: "هذا الرابط انتهت صلاحيته.",
    body: "تواصل معنا مباشرة وسنرسل لك رابطاً جديداً.",
    cta: "تواصل معنا",
    subject: (title) => `موجز منتهي الصلاحية: ${title}`,
  },
  submitted: {
    tag: "تم الإرسال",
    title: "وصلنا بالفعل.",
    body: (title) => `استلمنا الموجز الخاص بـ ${title}. سيتواصل معك فريقنا قريباً.`,
  },
  greeting: {
    tag: "خاص",
    lead: (first) => `أهلاً ${first}، لنرسم ملامح`,
    sub: (company) => `هذا الموجز مُعدّ لـ ${company}.`,
  },
  footer: {
    tagline: "SADEEM · استشارات النمو الاستراتيجي",
    questions: "لديك أسئلة؟",
  },
};

export function portalDict(locale: string | null | undefined): PortalDict {
  return locale === "ar" ? ar : en;
}
