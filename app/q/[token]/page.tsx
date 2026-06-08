import crypto from "crypto";
import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { SadeemMark } from "@/components/marks";
import { recordQuotationViewAction } from "@/app/admin/(authed)/proposals/quotation-actions";
import QuoteResponse from "./QuoteResponse";
import { quoteDict } from "./strings";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

// ── Types ─────────────────────────────────────────────────────────────────────

type QuoteItem = {
  id: string;
  sort_order: number;
  name: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number;
  total: number;
};

type QuoteProposal = {
  title: string;
  client_name: string;
  client_company: string | null;
  locale: string;
};

type QuoteData = {
  id: string;
  title: string;
  intro_text: string | null;
  currency: string;
  validity_days: number;
  discount_pct: number;
  tax_pct: number;
  subtotal: number;
  total: number;
  status: string;
  sent_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  notes: string | null;
  items: QuoteItem[];
  proposal: QuoteProposal | QuoteProposal[] | null;
};

// ── Lookup ────────────────────────────────────────────────────────────────────

async function lookupQuotation(rawToken: string): Promise<QuoteData | null> {
  try {
    const hash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from("quotations")
      .select(`
        id, title, intro_text, currency, validity_days,
        discount_pct, tax_pct, subtotal, total,
        status, sent_at, accepted_at, declined_at, notes,
        items:quotation_items(id, sort_order, name, description, quantity, unit, unit_price, total),
        proposal:proposals(title, client_name, client_company, locale)
      `)
      .eq("token_hash", hash)
      .single();

    if (!data) return null;

    const raw = data as unknown as QuoteData;
    raw.items = [...(raw.items ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    return raw;
  } catch {
    return null;
  }
}

async function getLogo(): Promise<string | null> {
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin.from("site_settings").select("logo_light_url").eq("id", true).maybeSingle();
    return data?.logo_light_url ?? null;
  } catch { return null; }
}

function proposalOf(q: QuoteData): QuoteProposal | null {
  return Array.isArray(q.proposal) ? (q.proposal[0] ?? null) : q.proposal;
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const q = await lookupQuotation(token);
  return {
    title: q ? `${q.title} — SADEEM` : "Quotation — SADEEM",
    robots: { index: false, follow: false },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency", currency,
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function Shell({ children, locale = "en" }: { children: React.ReactNode; locale?: string }) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <div className={`qp-page${locale === "ar" ? " qp-ar portal-ar" : ""}`} dir={dir} lang={locale}>
      <div className="portal-bg" aria-hidden="true">
        <div className="portal-grid" />
        <div className="portal-vignette" />
      </div>
      {children}
    </div>
  );
}

function Header({ logoUrl, badge }: { logoUrl: string | null; badge: string }) {
  return (
    <header className="portal-header">
      <a href="/" aria-label="SADEEM" className="portal-logo">
        {logoUrl
          ? <img src={logoUrl} alt="SADEEM" className="brand-logo-img" style={{ height: 28 }} />
          : <SadeemMark />}
      </a>
      <span className="portal-header-badge">{badge}</span>
    </header>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function QuotationPortalPage({ params }: Props) {
  const { token } = await params;
  const [q, logoUrl] = await Promise.all([lookupQuotation(token), getLogo()]);

  // Not found
  if (!q) {
    const t = quoteDict("en");
    return (
      <Shell locale="en">
        <Header logoUrl={logoUrl} badge={t.badge} />
        <main className="portal-stage">
          <div className="portal-center">
            <div className="portal-eyebrow"><span className="portal-tick" /><span>{t.badge}</span></div>
            <h1 className="portal-heading">{t.notFound.title}</h1>
            <p className="portal-sub">{t.notFound.body("hello@sadeem.agency")}</p>
          </div>
        </main>
        <footer className="portal-footer"><span>{t.footer.tagline}</span></footer>
      </Shell>
    );
  }

  const proposal = proposalOf(q);
  const locale = proposal?.locale === "ar" ? "ar" : "en";
  const t = quoteDict(locale);

  // Expired
  const isExpired = q.status === "expired" ||
    (q.sent_at && new Date(q.sent_at).getTime() + q.validity_days * 86400000 < Date.now());

  if (isExpired && !["accepted", "declined"].includes(q.status)) {
    return (
      <Shell locale={locale}>
        <Header logoUrl={logoUrl} badge={t.badge} />
        <main className="portal-stage">
          <div className="portal-center">
            <div className="portal-eyebrow"><span className="portal-tick" /><span>{t.badge}</span><span>·</span><span style={{ color: "var(--accent)" }}>{t.expired.tag}</span></div>
            <h1 className="portal-heading">{t.expired.title}</h1>
            <p className="portal-sub">{t.expired.body}</p>
            <a href={`mailto:hello@sadeem.agency?subject=${encodeURIComponent(t.expired.subject(q.title))}`} className="portal-cta">{t.expired.cta}</a>
          </div>
        </main>
        <footer className="portal-footer"><span>{t.footer.tagline}</span></footer>
      </Shell>
    );
  }

  // Record view (fire-and-forget)
  void recordQuotationViewAction(q.id);

  const disc = q.discount_pct || 0;
  const tax = q.tax_pct || 0;
  const afterDiscount = q.subtotal * (1 - disc / 100);
  const statusLabel = q.status === "accepted" ? t.status.accepted : t.status.declined;

  return (
    <Shell locale={locale}>
      <Header logoUrl={logoUrl} badge={t.badge} />
      <main className="qp-main">
        <div className="qp-wrap">

          {/* Cover */}
          <div className="qp-cover">
            <div className="portal-eyebrow">
              <span className="portal-tick" />
              <span>{t.badge}</span>
              {["accepted", "declined"].includes(q.status) && (
                <>
                  <span>·</span>
                  <span style={{ color: q.status === "accepted" ? "#34d399" : "#f87171" }}>
                    {statusLabel}
                  </span>
                </>
              )}
            </div>
            <h1 className="qp-title"><bdi>{q.title}</bdi></h1>
            {proposal && (
              <p className="qp-subtitle">
                {t.preparedFor} <strong style={{ color: "var(--white)" }}><bdi>{proposal.client_name}</bdi></strong>
                {proposal.client_company ? <> · <bdi>{proposal.client_company}</bdi></> : ""}
              </p>
            )}
            {q.intro_text && <p className="qp-intro">{q.intro_text}</p>}
          </div>

          {/* Line items */}
          <div className="qp-table-wrap">
            <div className="qp-table-header">
              <span>{t.table.service}</span>
              <span className="qp-col-right">{t.table.qty}</span>
              <span>{t.table.unit}</span>
              <span className="qp-col-right">{t.table.unitPrice}</span>
              <span className="qp-col-right">{t.table.total}</span>
            </div>
            {q.items.map((item) => (
              <div key={item.id} className="qp-table-row">
                <div className="qp-item-name-cell">
                  <span className="qp-item-name"><bdi>{item.name}</bdi></span>
                  {item.description && <span className="qp-item-desc">{item.description}</span>}
                </div>
                <span className="qp-col-right qp-item-num">{item.quantity}</span>
                <span className="qp-item-unit">{item.unit ?? "—"}</span>
                <span className="qp-col-right qp-item-num">{fmt(item.unit_price, q.currency)}</span>
                <span className="qp-col-right qp-item-total">{fmt(item.total, q.currency)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="qp-totals">
            <div className="qp-total-line">
              <span>{t.totals.subtotal}</span>
              <span>{fmt(q.subtotal, q.currency)}</span>
            </div>
            {disc > 0 && (
              <div className="qp-total-line">
                <span>{t.totals.discount} ({disc}%)</span>
                <span>−{fmt(q.subtotal * disc / 100, q.currency)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="qp-total-line">
                <span>{t.totals.tax} ({tax}%)</span>
                <span>{fmt(afterDiscount * tax / 100, q.currency)}</span>
              </div>
            )}
            <div className="qp-total-line qp-total-line--grand">
              <span>{t.totals.grand}</span>
              <span>{fmt(q.total, q.currency)}</span>
            </div>
          </div>

          {/* Validity */}
          {q.sent_at && (
            <p className="qp-validity">
              {t.validity(
                q.validity_days,
                new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", { dateStyle: "long" }).format(new Date(q.sent_at)),
              )}
            </p>
          )}

          {/* Response buttons */}
          <QuoteResponse
            quotationId={q.id}
            initialStatus={q.status}
            locale={locale}
          />

        </div>
      </main>
      <footer className="portal-footer">
        <span>{t.footer.tagline}</span>
        <span style={{ color: "rgba(245,243,240,0.35)" }}>
          {t.footer.questions}{" "}
          <a href="mailto:hello@sadeem.agency" style={{ color: "var(--accent)", textDecoration: "none" }}>
            hello@sadeem.agency
          </a>
        </span>
      </footer>
    </Shell>
  );
}
