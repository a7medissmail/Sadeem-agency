import crypto from "crypto";
import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { SadeemMark } from "@/components/marks";
import { recordProposalOpenAction } from "@/app/admin/(authed)/proposals/actions";
import PortalForm from "./PortalForm";

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
        "id, form_id, title, client_name, client_email, client_company, status, expires_at, submitted_at, form:forms(id, name, slug, submit_label, success_message, fields:form_fields(id, field_key, label, type, placeholder, help_text, options, is_required, sort_order))",
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

function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="portal-page">
      <div className="portal-bg" aria-hidden="true">
        <div className="portal-grid" />
        <div className="portal-vignette" />
      </div>
      {children}
    </div>
  );
}

function PortalHeader({ logoUrl }: { logoUrl: string | null }) {
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
      <span className="portal-header-badge">Private brief</span>
    </header>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProposalPortalPage({ params }: Props) {
  const { token } = await params;
  const [proposal, logoUrl] = await Promise.all([lookupProposal(token), getLogo()]);

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!proposal) {
    return (
      <PortalShell>
        <PortalHeader logoUrl={logoUrl} />
        <main className="portal-stage">
          <div className="portal-center">
            <div className="portal-eyebrow">
              <span className="portal-tick" />
              <span>Brief Portal</span>
            </div>
            <h1 className="portal-heading">Link not found.</h1>
            <p className="portal-sub">
              This link doesn&apos;t match any brief in our system.
              If you believe this is an error, contact us at{" "}
              <a href="mailto:hello@sadeem.agency" style={{ color: "var(--accent)" }}>
                hello@sadeem.agency
              </a>
            </p>
          </div>
        </main>
        <footer className="portal-footer">
          <span>SADEEM · Strategic Growth Advisory</span>
        </footer>
      </PortalShell>
    );
  }

  // ── Expired ────────────────────────────────────────────────────────────────
  const isExpired =
    proposal.status === "expired" || new Date(proposal.expires_at) < new Date();

  if (isExpired && proposal.status !== "submitted") {
    return (
      <PortalShell>
        <PortalHeader logoUrl={logoUrl} />
        <main className="portal-stage">
          <div className="portal-center">
            <div className="portal-eyebrow">
              <span className="portal-tick" />
              <span>Brief Portal</span>
              <span>·</span>
              <span style={{ color: "var(--accent)" }}>Expired</span>
            </div>
            <h1 className="portal-heading">
              Hi {proposal.client_name.split(" ")[0]},<br />
              this link has expired.
            </h1>
            <p className="portal-sub">
              Reach out to us directly and we&apos;ll send a fresh link.
            </p>
            <a
              href={`mailto:hello@sadeem.agency?subject=${encodeURIComponent(`Expired brief: ${proposal.title}`)}`}
              className="portal-cta"
            >
              Contact us
            </a>
          </div>
        </main>
        <footer className="portal-footer">
          <span>SADEEM · Strategic Growth Advisory</span>
        </footer>
      </PortalShell>
    );
  }

  // ── Already submitted ──────────────────────────────────────────────────────
  if (proposal.status === "submitted" || proposal.submitted_at) {
    return (
      <PortalShell>
        <PortalHeader logoUrl={logoUrl} />
        <main className="portal-stage">
          <div className="portal-center">
            <div className="portal-eyebrow">
              <span className="portal-tick" />
              <span>Brief Portal</span>
              <span>·</span>
              <span style={{ color: "var(--accent)" }}>Submitted</span>
            </div>
            <h1 className="portal-heading">Already received.</h1>
            <p className="portal-sub">
              We have your brief for{" "}
              <strong style={{ color: "var(--white)" }}>{proposal.title}</strong>.
              Our team will be in touch shortly.
            </p>
          </div>
        </main>
        <footer className="portal-footer">
          <span>SADEEM · Strategic Growth Advisory</span>
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

  const firstName = proposal.client_name.split(" ")[0];

  return (
    <PortalShell>
      <PortalHeader logoUrl={logoUrl} />
      <main className="portal-stage portal-stage--form">
        <div className="portal-form-wrap">
          {/* Greeting */}
          <div className="portal-greeting">
            <div className="portal-eyebrow">
              <span className="portal-tick" />
              <span>Brief Portal</span>
              <span>·</span>
              <span style={{ color: "var(--accent)" }}>Private</span>
            </div>
            <h1 className="portal-heading portal-heading--sm">
              Hi {firstName}, let&apos;s map
              <br />
              <span style={{ color: "var(--accent)" }}>{proposal.title}.</span>
            </h1>
            {proposal.client_company ? (
              <p className="portal-sub portal-sub--sm">
                This brief is prepared for {proposal.client_company}.
              </p>
            ) : null}
          </div>

          {/* Form or no-form fallback */}
          {formData && fields.length > 0 ? (
            <PortalForm
              proposalId={proposal.id}
              formId={formData.id}
              clientName={proposal.client_name}
              clientEmail={proposal.client_email}
              fields={fields}
              submitLabel={formData.submit_label ?? "Submit brief"}
              successMessage={formData.success_message}
            />
          ) : (
            <div className="portal-no-form">
              <p>
                No form has been attached to this brief yet. Please contact us at{" "}
                <a href="mailto:hello@sadeem.agency" style={{ color: "var(--accent)" }}>
                  hello@sadeem.agency
                </a>{" "}
                to proceed.
              </p>
            </div>
          )}
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
    </PortalShell>
  );
}
