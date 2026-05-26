import crypto from "crypto";
import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { SadeemMark } from "@/components/marks";
import { recordQuotationViewAction } from "@/app/admin/(authed)/proposals/quotation-actions";
import QuoteResponse from "./QuoteResponse";

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
  proposal: QuoteProposal | null;
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
        proposal:proposals(title, client_name, client_company)
      `)
      .eq("token_hash", hash)
      .single();

    if (!data) return null;

    // Sort items
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

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="qp-page">
      <div className="portal-bg" aria-hidden="true">
        <div className="portal-grid" />
        <div className="portal-vignette" />
      </div>
      {children}
    </div>
  );
}

function Header({ logoUrl }: { logoUrl: string | null }) {
  return (
    <header className="portal-header">
      <a href="/" aria-label="SADEEM" className="portal-logo">
        {logoUrl
          ? <img src={logoUrl} alt="SADEEM" className="brand-logo-img" style={{ height: 28 }} />
          : <SadeemMark />}
      </a>
      <span className="portal-header-badge">Quotation</span>
    </header>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function QuotationPortalPage({ params }: Props) {
  const { token } = await params;
  const [q, logoUrl] = await Promise.all([lookupQuotation(token), getLogo()]);

  // Not found
  if (!q) {
    return (
      <Shell>
        <Header logoUrl={logoUrl} />
        <main className="portal-stage">
          <div className="portal-center">
            <div className="portal-eyebrow"><span className="portal-tick" /><span>Quotation</span></div>
            <h1 className="portal-heading">Link not found.</h1>
            <p className="portal-sub">
              This link doesn&apos;t match any quotation in our system. Contact us at{" "}
              <a href="mailto:hello@sadeem.agency" style={{ color: "var(--accent)" }}>hello@sadeem.agency</a>
            </p>
          </div>
        </main>
        <footer className="portal-footer"><span>SADEEM · Strategic Growth Advisory</span></footer>
      </Shell>
    );
  }

  // Expired
  const isExpired = q.status === "expired" ||
    (q.sent_at && new Date(q.sent_at).getTime() + q.validity_days * 86400000 < Date.now());

  if (isExpired && !["accepted", "declined"].includes(q.status)) {
    return (
      <Shell>
        <Header logoUrl={logoUrl} />
        <main className="portal-stage">
          <div className="portal-center">
            <div className="portal-eyebrow"><span className="portal-tick" /><span>Quotation</span><span>·</span><span style={{ color: "var(--accent)" }}>Expired</span></div>
            <h1 className="portal-heading">This quote has expired.</h1>
            <p className="portal-sub">Reach out and we&apos;ll send a refreshed version.</p>
            <a href={`mailto:hello@sadeem.agency?subject=${encodeURIComponent(`Expired quote: ${q.title}`)}`} className="portal-cta">Contact us</a>
          </div>
        </main>
        <footer className="portal-footer"><span>SADEEM · Strategic Growth Advisory</span></footer>
      </Shell>
    );
  }

  // Record view (fire-and-forget)
  void recordQuotationViewAction(q.id);

  const proposal = Array.isArray(q.proposal) ? q.proposal[0] : q.proposal;
  const canRespond = ["sent", "viewed"].includes(q.status);
  const disc = q.discount_pct || 0;
  const tax = q.tax_pct || 0;
  const afterDiscount = q.subtotal * (1 - disc / 100);

  return (
    <Shell>
      <Header logoUrl={logoUrl} />
      <main className="qp-main">
        <div className="qp-wrap">

          {/* Cover */}
          <div className="qp-cover">
            <div className="portal-eyebrow">
              <span className="portal-tick" />
              <span>Quotation</span>
              {["accepted", "declined"].includes(q.status) && (
                <>
                  <span>·</span>
                  <span style={{ color: q.status === "accepted" ? "#34d399" : "#f87171", textTransform: "capitalize" }}>
                    {q.status}
                  </span>
                </>
              )}
            </div>
            <h1 className="qp-title">{q.title}</h1>
            {proposal && (
              <p className="qp-subtitle">
                Prepared for <strong style={{ color: "var(--white)" }}>{proposal.client_name}</strong>
                {proposal.client_company ? ` · ${proposal.client_company}` : ""}
              </p>
            )}
            {q.intro_text && <p className="qp-intro">{q.intro_text}</p>}
          </div>

          {/* Line items */}
          <div className="qp-table-wrap">
            <div className="qp-table-header">
              <span>Service</span>
              <span className="qp-col-right">Qty</span>
              <span>Unit</span>
              <span className="qp-col-right">Unit price</span>
              <span className="qp-col-right">Total</span>
            </div>
            {q.items.map((item) => (
              <div key={item.id} className="qp-table-row">
                <div className="qp-item-name-cell">
                  <span className="qp-item-name">{item.name}</span>
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
              <span>Subtotal</span>
              <span>{fmt(q.subtotal, q.currency)}</span>
            </div>
            {disc > 0 && (
              <div className="qp-total-line">
                <span>Discount ({disc}%)</span>
                <span>−{fmt(q.subtotal * disc / 100, q.currency)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="qp-total-line">
                <span>Tax ({tax}%)</span>
                <span>{fmt(afterDiscount * tax / 100, q.currency)}</span>
              </div>
            )}
            <div className="qp-total-line qp-total-line--grand">
              <span>Total</span>
              <span>{fmt(q.total, q.currency)}</span>
            </div>
          </div>

          {/* Validity */}
          {q.sent_at && (
            <p className="qp-validity">
              This quote is valid for {q.validity_days} days from{" "}
              {new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(q.sent_at))}.
            </p>
          )}

          {/* Response buttons */}
          <QuoteResponse
            quotationId={q.id}
            initialStatus={q.status}
          />

        </div>
      </main>
      <footer className="portal-footer">
        <span>SADEEM · Strategic Growth Advisory</span>
        <span style={{ color: "rgba(245,243,240,0.35)" }}>
          Questions?{" "}
          <a href="mailto:hello@sadeem.agency" style={{ color: "var(--accent)", textDecoration: "none" }}>
            hello@sadeem.agency
          </a>
        </span>
      </footer>
    </Shell>
  );
}
