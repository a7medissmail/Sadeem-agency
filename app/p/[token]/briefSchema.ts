// Bilingual schema for the 6-step brief. Slice 2 of Phase 1.
// Decision: translate AND store — for an Arabic client the displayed option is
// also the stored answer (so the brief reads natively in the admin).

export type BriefLocale = "en" | "ar";
export type Bi = { en: string; ar: string };
export type BriefFieldType = "select" | "textarea" | "input" | "multichip";

export type BriefField = {
  name: string;
  type: BriefFieldType;
  label: Bi;
  required?: boolean;
  minLength?: number;
  hint?: Bi;
  placeholder?: Bi;
  options?: Bi[];
  rows?: number;
  showIf?: (data: Record<string, string | string[]>) => boolean;
};

export type BriefStep = { id: string; title: Bi; subtitle: Bi; fields: BriefField[] };

const opt = (en: string, ar: string): Bi => ({ en, ar });

export const BRIEF_STEPS: BriefStep[] = [
  {
    id: "business",
    title: { en: "The Business", ar: "النشاط" },
    subtitle: { en: "Tell us who you are", ar: "عرّفنا بنشاطك" },
    fields: [
      {
        name: "industry", type: "select", required: true,
        label: { en: "Industry / Sector", ar: "المجال / القطاع" },
        placeholder: { en: "Select your industry", ar: "اختر مجالك" },
        options: [
          opt("Technology / SaaS", "التقنية / SaaS"),
          opt("Retail / E-commerce", "التجزئة / التجارة الإلكترونية"),
          opt("F&B / Hospitality", "الأغذية والمشروبات / الضيافة"),
          opt("Real Estate", "العقارات"),
          opt("Healthcare / MedTech", "الرعاية الصحية / التقنية الطبية"),
          opt("Professional Services", "الخدمات المهنية"),
          opt("Manufacturing / Industrial", "التصنيع / الصناعة"),
          opt("Education / EdTech", "التعليم / تقنية التعليم"),
          opt("Media / Entertainment", "الإعلام / الترفيه"),
          opt("Financial Services", "الخدمات المالية"),
          opt("Other", "أخرى"),
        ],
      },
      {
        name: "company_size", type: "select", required: true,
        label: { en: "Company size", ar: "حجم الشركة" },
        placeholder: { en: "Number of employees", ar: "عدد الموظفين" },
        options: [opt("1–10", "1–10"), opt("11–50", "11–50"), opt("51–200", "51–200"), opt("201–500", "201–500"), opt("500+", "500+")],
      },
      {
        name: "revenue_stage", type: "select", required: true,
        label: { en: "Revenue stage", ar: "مرحلة الإيرادات" },
        placeholder: { en: "Annual revenue range", ar: "نطاق الإيرادات السنوية" },
        options: [
          opt("Pre-revenue", "ما قبل الإيرادات"),
          opt("Under 1M SAR", "أقل من مليون ريال"),
          opt("1M–10M SAR", "1–10 مليون ريال"),
          opt("10M–50M SAR", "10–50 مليون ريال"),
          opt("50M–200M SAR", "50–200 مليون ريال"),
          opt("200M+ SAR", "أكثر من 200 مليون ريال"),
        ],
      },
      {
        name: "years_operating", type: "select", required: true,
        label: { en: "Years in operation", ar: "سنوات التشغيل" },
        placeholder: { en: "How long have you been operating?", ar: "منذ متى وأنت تعمل؟" },
        options: [
          opt("Less than 1 year", "أقل من سنة"),
          opt("1–3 years", "1–3 سنوات"),
          opt("3–7 years", "3–7 سنوات"),
          opt("7–15 years", "7–15 سنة"),
          opt("15+ years", "أكثر من 15 سنة"),
        ],
      },
    ],
  },
  {
    id: "challenge",
    title: { en: "The Challenge", ar: "التحدّي" },
    subtitle: { en: "What needs to change", ar: "ما الذي يحتاج إلى تغيير" },
    fields: [
      {
        name: "core_challenge", type: "textarea", required: true, minLength: 20, rows: 5,
        label: { en: "Primary challenge", ar: "التحدّي الأساسي" },
        hint: { en: "In your own words — what's the core problem you need help solving?", ar: "بكلماتك — ما المشكلة الجوهرية التي تحتاج المساعدة في حلّها؟" },
        placeholder: {
          en: "e.g. Our sales team is strong but we can't convert pipeline to closed deals. Revenue has plateaued at 8M SAR for two years...",
          ar: "مثال: فريق المبيعات قوي لكننا لا نحوّل الفرص إلى صفقات مغلقة. الإيرادات متوقفة عند 8 مليون ريال منذ سنتين...",
        },
      },
      {
        name: "challenge_duration", type: "select",
        label: { en: "How long has this been an issue?", ar: "منذ متى وهذه المشكلة قائمة؟" },
        placeholder: { en: "Select timeframe", ar: "اختر المدة" },
        options: [
          opt("Just emerged", "ظهرت حديثاً"),
          opt("3–6 months", "3–6 أشهر"),
          opt("6–12 months", "6–12 شهراً"),
          opt("1–2 years", "1–2 سنة"),
          opt("Over 2 years", "أكثر من سنتين"),
        ],
      },
      {
        name: "tried_before", type: "textarea", rows: 4,
        label: { en: "What have you already tried?", ar: "ما الذي جرّبته بالفعل؟" },
        hint: { en: "What worked, what didn't — be candid, it helps us avoid wasting your time.", ar: "ما الذي نجح وما الذي لم ينجح — كن صريحاً، هذا يساعدنا على عدم إضاعة وقتك." },
        placeholder: {
          en: "e.g. Hired a marketing agency in 2024, ran ads — got impressions but no qualified leads. Tried restructuring the sales team...",
          ar: "مثال: تعاقدنا مع وكالة تسويق في 2024، وأطلقنا إعلانات — حصلنا على مشاهدات لكن بلا عملاء مؤهلين. حاولنا إعادة هيكلة فريق المبيعات...",
        },
      },
    ],
  },
  {
    id: "objective",
    title: { en: "The Objective", ar: "الهدف" },
    subtitle: { en: "Where you want to go", ar: "إلى أين تريد الوصول" },
    fields: [
      {
        name: "success_90_days", type: "textarea", required: true, minLength: 15, rows: 4,
        label: { en: "Success in 90 days", ar: "النجاح خلال 90 يوماً" },
        hint: { en: "If we started today, what would “working” look like in three months?", ar: "لو بدأنا اليوم، كيف يبدو “النجاح” بعد ثلاثة أشهر؟" },
        placeholder: {
          en: "e.g. A clear go-to-market plan for the Saudi market, 3 pilot customers signed, weekly operational rhythm established...",
          ar: "مثال: خطة واضحة لدخول السوق السعودي، توقيع 3 عملاء تجريبيين، وإيقاع تشغيلي أسبوعي ثابت...",
        },
      },
      {
        name: "success_12_months", type: "textarea", required: true, minLength: 15, rows: 4,
        label: { en: "Success in 12 months", ar: "النجاح خلال 12 شهراً" },
        hint: { en: "Longer horizon — where does the business need to be?", ar: "أفق أبعد — أين يجب أن يكون النشاط؟" },
        placeholder: {
          en: "e.g. 30M SAR ARR, operating in 3 GCC markets, team scaled to 80 people with proper management structure...",
          ar: "مثال: 30 مليون ريال إيراد سنوي متكرر، والعمل في 3 أسواق خليجية، وتوسيع الفريق إلى 80 شخصاً بهيكل إداري سليم...",
        },
      },
      {
        name: "top_priorities", type: "multichip",
        label: { en: "Top priorities right now", ar: "أهم الأولويات حالياً" },
        hint: { en: "Select all that apply.", ar: "اختر كل ما ينطبق." },
        options: [
          opt("Revenue growth", "نمو الإيرادات"),
          opt("Operational efficiency", "الكفاءة التشغيلية"),
          opt("Market expansion", "التوسّع في السوق"),
          opt("Brand positioning", "تموضع العلامة"),
          opt("Team building", "بناء الفريق"),
          opt("Fundraising / investor relations", "جمع التمويل / علاقات المستثمرين"),
          opt("Customer retention", "الاحتفاظ بالعملاء"),
          opt("Digital transformation", "التحوّل الرقمي"),
          opt("Cost reduction", "خفض التكاليف"),
          opt("Product / service development", "تطوير المنتج / الخدمة"),
        ],
      },
      {
        name: "key_metric", type: "input",
        label: { en: "The one metric you most want to move", ar: "المؤشر الأهم الذي تريد تحريكه" },
        placeholder: {
          en: "e.g. Monthly recurring revenue, customer acquisition cost, gross margin...",
          ar: "مثال: الإيراد الشهري المتكرر، تكلفة اكتساب العميل، هامش الربح الإجمالي...",
        },
      },
    ],
  },
  {
    id: "market",
    title: { en: "Your Market", ar: "السوق" },
    subtitle: { en: "Who you serve and compete with", ar: "من تخدم ومن تنافس" },
    fields: [
      {
        name: "target_market", type: "textarea", required: true, minLength: 15, rows: 4,
        label: { en: "Target customer", ar: "العميل المستهدف" },
        hint: { en: "Who is your ideal customer and what problem do you solve for them?", ar: "من هو عميلك المثالي وما المشكلة التي تحلّها له؟" },
        placeholder: {
          en: "e.g. Mid-market Saudi businesses (50–300 employees) in manufacturing that struggle with supply chain visibility...",
          ar: "مثال: شركات سعودية متوسطة (50–300 موظف) في التصنيع تعاني من ضعف وضوح سلسلة الإمداد...",
        },
      },
      {
        name: "geographies", type: "multichip",
        label: { en: "Geographies you operate or plan to enter", ar: "المناطق التي تعمل بها أو تخطط لدخولها" },
        options: [
          opt("Saudi Arabia", "السعودية"),
          opt("UAE", "الإمارات"),
          opt("Kuwait", "الكويت"),
          opt("Bahrain", "البحرين"),
          opt("Qatar", "قطر"),
          opt("Oman", "عُمان"),
          opt("Egypt", "مصر"),
          opt("Jordan", "الأردن"),
          opt("MENA broadly", "الشرق الأوسط وشمال أفريقيا عموماً"),
          opt("Global", "عالمياً"),
        ],
      },
      {
        name: "main_competitor", type: "input",
        label: { en: "Your most direct competitor", ar: "أقرب منافس مباشر لك" },
        placeholder: { en: "Name one company clients compare you to", ar: "اذكر شركة يقارنك بها العملاء" },
      },
      {
        name: "competitive_advantage", type: "textarea", rows: 3,
        label: { en: "Your competitive advantage", ar: "ميزتك التنافسية" },
        hint: { en: "Why do customers choose you over the alternative?", ar: "لماذا يختارك العملاء بدلاً من البديل؟" },
        placeholder: {
          en: "e.g. 20 years of Gulf-specific operational experience, proprietary data on regional consumer behaviour...",
          ar: "مثال: 20 عاماً من الخبرة التشغيلية الخليجية، وبيانات حصرية عن سلوك المستهلك الإقليمي...",
        },
      },
    ],
  },
  {
    id: "investment",
    title: { en: "Investment", ar: "الاستثمار" },
    subtitle: { en: "Scope, budget & timing", ar: "النطاق والميزانية والتوقيت" },
    fields: [
      {
        name: "budget_range", type: "select", required: true,
        label: { en: "Budget range for this engagement", ar: "نطاق الميزانية لهذا التعاون" },
        hint: { en: "This helps us scope the right depth of work. All ranges are treated confidentially.", ar: "هذا يساعدنا على تحديد العمق المناسب للعمل. كل النطاقات تُعامَل بسرّية." },
        placeholder: { en: "Select a range", ar: "اختر نطاقاً" },
        options: [
          opt("Under 50K SAR", "أقل من 50 ألف ريال"),
          opt("50K–150K SAR", "50–150 ألف ريال"),
          opt("150K–500K SAR", "150–500 ألف ريال"),
          opt("500K–1M SAR", "500 ألف – مليون ريال"),
          opt("Above 1M SAR", "أكثر من مليون ريال"),
          opt("Prefer not to say", "أفضّل عدم الإفصاح"),
        ],
      },
      {
        name: "engagement_type", type: "select", required: true,
        label: { en: "Preferred engagement type", ar: "نوع التعاون المفضّل" },
        placeholder: { en: "How do you want to work together?", ar: "كيف تريد أن نعمل معاً؟" },
        options: [
          opt("One-time sprint / project", "مشروع / سبرنت لمرة واحدة"),
          opt("Short engagement (1–3 months)", "تعاون قصير (1–3 أشهر)"),
          opt("Medium engagement (3–6 months)", "تعاون متوسط (3–6 أشهر)"),
          opt("Ongoing advisory (6+ months)", "استشارة مستمرة (6 أشهر+)"),
          opt("Not sure yet — need your recommendation", "غير متأكد بعد — أحتاج توصيتكم"),
        ],
      },
      {
        name: "urgency", type: "select", required: true,
        label: { en: "Urgency", ar: "مدى الإلحاح" },
        placeholder: { en: "When do you need to start?", ar: "متى تحتاج البدء؟" },
        options: [
          opt("Immediately — this is critical", "فوراً — الأمر حرج"),
          opt("Within 1 month", "خلال شهر"),
          opt("1–3 months", "1–3 أشهر"),
          opt("Flexible — planning ahead", "مرن — أخطّط مسبقاً"),
        ],
      },
      {
        name: "decision_process", type: "select",
        label: { en: "Decision-making process", ar: "آلية اتخاذ القرار" },
        hint: { en: "Who needs to sign off on bringing us in?", ar: "من يجب أن يوافق على التعاقد معنا؟" },
        placeholder: { en: "How decisions get made", ar: "كيف تُتخذ القرارات" },
        options: [
          opt("I decide alone", "أقرّر بمفردي"),
          opt("Small leadership team (2–4 people)", "فريق قيادي صغير (2–4 أشخاص)"),
          opt("Board or investor approval required", "يتطلب موافقة المجلس أو المستثمرين"),
          opt("Procurement / RFP process", "عملية مشتريات / طرح عروض"),
        ],
      },
    ],
  },
  {
    id: "context",
    title: { en: "Final Context", ar: "سياق أخير" },
    subtitle: { en: "Anything else we should know", ar: "أي شيء آخر يجب أن نعرفه" },
    fields: [
      {
        name: "additional_context", type: "textarea", rows: 5,
        label: { en: "Anything else we should know?", ar: "أي شيء آخر يجب أن نعرفه؟" },
        hint: { en: "Constraints, sensitivities, internal dynamics, or context that shapes the engagement.", ar: "قيود، حساسيات، ديناميكيات داخلية، أو سياق يؤثر على التعاون." },
        placeholder: {
          en: "e.g. We have a board meeting in October and need findings before then. The CEO and COO have different views on the priority...",
          ar: "مثال: لدينا اجتماع مجلس في أكتوبر ونحتاج النتائج قبله. الرئيس التنفيذي ومدير العمليات لديهما رأيان مختلفان حول الأولوية...",
        },
      },
      {
        name: "previous_consultancy", type: "select",
        label: { en: "Have you worked with a consultancy or advisory firm before?", ar: "هل سبق وتعاملت مع شركة استشارية من قبل؟" },
        placeholder: { en: "Select", ar: "اختر" },
        options: [opt("Yes", "نعم"), opt("No", "لا")],
      },
      {
        name: "consultancy_experience", type: "textarea", rows: 3,
        showIf: (data) => data.previous_consultancy === "Yes" || data.previous_consultancy === "نعم",
        label: { en: "What was the outcome?", ar: "ما كانت النتيجة؟" },
        hint: { en: "Candid is best — what worked, what didn't, what would you do differently?", ar: "الصراحة أفضل — ما الذي نجح، وما الذي لم ينجح، وما الذي ستفعله بشكل مختلف؟" },
        placeholder: {
          en: "e.g. Strategy deck was great but no execution support. We didn't implement 80% of the recommendations...",
          ar: "مثال: عرض الاستراتيجية كان ممتازاً لكن بلا دعم تنفيذي. لم ننفّذ 80% من التوصيات...",
        },
      },
      {
        name: "heard_about_sadeem", type: "select",
        label: { en: "How did you hear about SADEEM?", ar: "كيف سمعت عن سديم؟" },
        placeholder: { en: "Select", ar: "اختر" },
        options: [
          opt("Referral from someone I know", "ترشيح من شخص أعرفه"),
          opt("LinkedIn", "لينكدإن"),
          opt("Search / Google", "بحث / جوجل"),
          opt("Social media", "وسائل التواصل"),
          opt("Event or conference", "فعالية أو مؤتمر"),
          opt("Previous client", "عميل سابق"),
          opt("Other", "أخرى"),
        ],
      },
    ],
  },
];

export const briefUi = {
  stepCount: { en: "Step", ar: "الخطوة" },
  of: { en: "of", ar: "من" },
  back: { en: "← Back", ar: "رجوع" },
  continue: { en: "Continue →", ar: "متابعة" },
  submit: { en: "Submit brief →", ar: "إرسال الموجز" },
  submitting: { en: "Submitting…", ar: "جارٍ الإرسال…" },
  draftNote: {
    en: "Draft saved automatically — you can close and return anytime.",
    ar: "يُحفظ تلقائياً — يمكنك الإغلاق والعودة في أي وقت.",
  },
  successTitle: { en: "Brief received.", ar: "تم استلام الموجز." },
  successBody: {
    en: "Thank you. Our team will review your brief and come back with a clear recommendation — usually within two business days.",
    ar: "شكراً لك. سيراجع فريقنا الموجز ويعود إليك بتوصية واضحة — عادة خلال يومَي عمل.",
  },
  errRequired: { en: "Please complete this field.", ar: "من فضلك أكمل هذا الحقل." },
  errMore: { en: "Please add a little more detail.", ar: "من فضلك أضف مزيداً من التفاصيل." },
  errExpired: { en: "This brief link has expired. Please contact us for a new one.", ar: "انتهت صلاحية رابط الموجز. من فضلك تواصل معنا للحصول على رابط جديد." },
  errGeneric: { en: "Something went wrong. Please try again.", ar: "حدث خطأ ما. من فضلك حاول مرة أخرى." },
} as const;

export function tb(bi: Bi, locale: BriefLocale): string {
  return bi[locale];
}
