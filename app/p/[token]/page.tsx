import crypto from "crypto";
import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { SadeemMark } from "@/components/marks";
import { recordProposalOpenAction } from "@/app/admin/(authed)/proposals/actions";
import BriefStepper from "./BriefStepper";
import { portalDict } from "./strings";

// No layout wrapping — standalone page, no site navbar/footer.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

// ── Raw shape from Supabase embedded select ────────────────────────────────────
type PortalField = {
  id: string;
  field_key: string;
  label: string;
  type: string;
  placeholder: string | null;
  help_text: string | null;
  options: unknown;
  is_required: boolean;
  sort_order: number;
};

type PortalForm_ = {
  id: string;
  name: string;
  slug: string;
  submit_label: string;
  success_message: string | null;
  fields: PortalField[];
};

type PortalProposal = {
  id: string;
  form_id: string | null;
  title: string;
  client_name: string;
  client_email: string;
  client_company: string | null;
  status: string;
  expires_at: string;
  submitted_at: string | null;
  locale: string;
  form: PortalForm_ | PortalForm_[] | null;
};

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const proposal = await lookupProposal(token);
  if (!proposal) return { title: "Proposal — SADEEM" };
  return {
    title: `${proposal.title} — SADEEM`,
    robots: { index: false, follow: false },
  };
}

// ─── Token lookup (server-only) ───────────────────────────────────────────────

async function lookupProposal(rawToken: string): Promise<PortalProposal | null> {
  try {
    const hash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from("proposals")
      .select(
        "id, form_id, title, client_name, client_email, client_company, status, expires_at, submitted_at, locale, form:forms(id, name, slug, submit_label, success_message, fields:form_fields(id, field_key, label, type, placeholder, help_text, options, is_required, sort_order))",
      )
      .eq("token_hash", hash)
      .single();

    return (data as unknown as PortalProposal) ?? null;
  } catch {
    return null;
  }
}

// ─── Logo (best-effort, no flash) ─────────────────────────────────────────────

async function getLogo(): Promise<string | null> {
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from("site_settings")
      .select("logo_light_url")
      .eq("id", true)
      .maybeSingle();
    return data?.logo_light_url ?? null;
  } catch {
    return null;
  }
}

// ─── Helper components ────────────────────────────────────────────────────────

function PortalShell({ children, locale = "en" }: { children: React.ReactNode; locale?: string }) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <div className={`portal-page${locale === "ar" ? " portal-ar" : ""}`} dir={dir} lang={locale}>
      <div className="portal-bg" aria-hidden="true">
        <div className="portal-grid" />
        <div className="portal-vignette" />
      </div>
      {children}
    </div>
  );
}

function PortalHeader({ logoUrl, badge }: { logoUrl: string | null; badge: string }) {
  return (
    <header className="portal-header">
      <a href="/" aria-label="SADEEM" className="portal-logo">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="SADEEM" className="brand-logo-img" style={{ height: 28 }} />
        ) : (
          <SadeemMark />
        )}
      </a>
      <span className="portal-header-badge">{badge}</span>
    </header>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProposalPortalPage({ params }: Props) {
  const { token } = await params;
  const [proposal, logoUrl] = await Promise.all([lookupProposal(token), getLogo()]);

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!proposal) {
    const tEn = portalDict("en");
    return (
      <PortalShell locale="en">
        <PortalHeader logoUrl={logoUrl} badge={tEn.badge} />
        <main className="portal-stage">
          <div className="portal-center">
            <div className="portal-eyebrow">
              <span className="portal-tick" />
              <span>{tEn.eyebrow}</span>
            </div>
            <h1 className="portal-heading">{tEn.notFound.title}</h1>
            <p className="portal-sub">{tEn.notFound.body("hello@sadeem.agency")}</p>
          </div>
        </main>
        <footer className="portal-footer">
          <span>{tEn.footer.tagline}</span>
        </footer>
      </PortalShell>
    );
  }

  const t = portalDict(proposal.locale);
  const firstName = proposal.client_name.split(" ")[0];

  // ── Expired ────────────────────────────────────────────────────────────────
  const isExpired =
    proposal.status === "expired" || new Date(proposal.expires_at) < new Date();

  if (isExpired && proposal.status !== "submitted") {
    return (
      <PortalShell locale={proposal.locale}>
        <PortalHeader logoUrl={logoUrl} badge={t.badge} />
        <main className="portal-stage">
          <div className="portal-center">
            <div className="portal-eyebrow">
              <span className="portal-tick" />
              <span>{t.eyebrow}</span>
              <span>·</span>
              <span style={{ color: "var(--accent)" }}>{t.expired.tag}</span>
            </div>
            <h1 className="portal-heading">
              {t.expired.hi(firstName)}<br />
              {t.expired.line2}
            </h1>
            <p className="portal-sub">{t.expired.body}</p>
            <a
              href={`mailto:hello@sadeem.agency?subject=${encodeURIComponent(t.expired.subject(proposal.title))}`}
              className="portal-cta"
            >
              {t.expired.cta}
            </a>
          </div>
        </main>
        <footer className="portal-footer">
          <span>{t.footer.tagline}</span>
        </footer>
      </PortalShell>
    );
  }

  // ── Already submitted ──────────────────────────────────────────────────────
  if (proposal.status === "submitted" || proposal.submitted_at) {
    return (
      <PortalShell locale={proposal.locale}>
        <PortalHeader logoUrl={logoUrl} badge={t.badge} />
        <main className="portal-stage">
          <div className="portal-center">
            <div className="portal-eyebrow">
              <span className="portal-tick" />
              <span>{t.eyebrow}</span>
              <span>·</span>
              <span style={{ color: "var(--accent)" }}>{t.submitted.tag}</span>
            </div>
            <h1 className="portal-heading">{t.submitted.title}</h1>
            <p className="portal-sub">{t.submitted.body(proposal.title)}</p>
          </div>
        </main>
        <footer className="portal-footer">
          <span>{t.footer.tagline}</span>
        </footer>
      </PortalShell>
    );
  }

  // ── Record open (fire-and-forget) ──────────────────────────────────────────
  void recordProposalOpenAction(proposal.id);

  // ── Parse form ────────────────────────────────────────────────────────────
  const formData: PortalForm_ | null = Array.isArray(proposal.form)
    ? (proposal.form[0] ?? null)
    : (proposal.form as PortalForm_ | null);

  const fields = formData
    ? [...(formData.fields ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))
        .map((f) => ({
          ...f,
          options: Array.isArray(f.options) ? (f.options as string[]) : [],
        }))
    : [];

  return (
    <PortalShell locale={proposal.locale}>
      <PortalHeader logoUrl={logoUrl} badge={t.badge} />
      <main className="portal-stage portal-stage--form">
        <div className="portal-form-wrap">
          {/* Greeting */}
          <div className="portal-greeting">
            <div className="portal-eyebrow">
              <span className="portal-tick" />
              <span>{t.eyebrow}</span>
              <span>·</span>
              <span style={{ color: "var(--accent)" }}>{t.greeting.tag}</span>
            </div>
            <h1 className="portal-heading portal-heading--sm">
              {t.greeting.lead(firstName)}
              <br />
              <span style={{ color: "var(--accent)" }}><bdi>{proposal.title}</bdi>.</span>
            </h1>
            {proposal.client_company ? (
              <p className="portal-sub portal-sub--sm">
                {t.greeting.sub(proposal.client_company)}
              </p>
            ) : null}
          </div>

          {/* Guided 6-step brief — always uses SADEEM's structured brief,
              regardless of which form (if any) is attached to the proposal.
              (Stepper copy is translated in a later slice; it inherits RTL here.) */}
          <BriefStepper
            proposalId={proposal.id}
            formId={formData?.id ?? null}
            clientName={proposal.client_name}
            clientEmail={proposal.client_email}
            successMessage={formData?.success_message}
            locale={proposal.locale}
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
    </PortalShell>
  );
}
