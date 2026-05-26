"use client";

import { useState, useEffect, useTransition } from "react";
import { submitProposalAction } from "@/app/admin/(authed)/proposals/actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type BriefStepperProps = {
  proposalId: string;
  formId: string | null;
  clientName: string;
  clientEmail: string;
  successMessage?: string | null;
};

type StepId = "business" | "challenge" | "objective" | "market" | "investment" | "context";

type BriefData = Record<string, string | string[]>;

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS: { id: StepId; title: string; subtitle: string }[] = [
  { id: "business",   title: "The Business",   subtitle: "Tell us who you are" },
  { id: "challenge",  title: "The Challenge",   subtitle: "What needs to change" },
  { id: "objective",  title: "The Objective",   subtitle: "Where you want to go" },
  { id: "market",     title: "Your Market",     subtitle: "Who you serve and compete with" },
  { id: "investment", title: "Investment",      subtitle: "Scope, budget & timing" },
  { id: "context",    title: "Final Context",   subtitle: "Anything else we should know" },
];

// ─── Field helpers ────────────────────────────────────────────────────────────

function Label({ children, required }: { children: string; required?: boolean }) {
  return (
    <label className="brief-label">
      {children}
      {required ? <span className="brief-required">*</span> : null}
    </label>
  );
}

function Hint({ children }: { children: string }) {
  return <p className="brief-hint">{children}</p>;
}

function FieldWrap({ children }: { children: React.ReactNode }) {
  return <div className="brief-field">{children}</div>;
}

function BriefSelect({
  name,
  value,
  onChange,
  options,
  placeholder,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <select
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="brief-select"
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function BriefTextarea({
  name,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="brief-textarea"
    />
  );
}

function BriefInput({
  name,
  value,
  onChange,
  placeholder,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="brief-input"
    />
  );
}

function MultiChip({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string[];
  onChange: (v: string[]) => void;
  options: string[];
}) {
  const toggle = (opt: string) =>
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  return (
    <div className="brief-chips">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`brief-chip${value.includes(opt) ? " brief-chip--on" : ""}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Step content ─────────────────────────────────────────────────────────────

function StepBusiness({ data, set }: { data: BriefData; set: (k: string, v: string | string[]) => void }) {
  return (
    <div className="brief-fields">
      <FieldWrap>
        <Label required>Industry / Sector</Label>
        <BriefSelect
          name="industry"
          value={(data.industry as string) || ""}
          onChange={(v) => set("industry", v)}
          placeholder="Select your industry"
          options={[
            "Technology / SaaS", "Retail / E-commerce", "F&B / Hospitality",
            "Real Estate", "Healthcare / MedTech", "Professional Services",
            "Manufacturing / Industrial", "Education / EdTech",
            "Media / Entertainment", "Financial Services", "Other",
          ]}
        />
      </FieldWrap>

      <FieldWrap>
        <Label required>Company size</Label>
        <BriefSelect
          name="company_size"
          value={(data.company_size as string) || ""}
          onChange={(v) => set("company_size", v)}
          placeholder="Number of employees"
          options={["1–10", "11–50", "51–200", "201–500", "500+"]}
        />
      </FieldWrap>

      <FieldWrap>
        <Label required>Revenue stage</Label>
        <BriefSelect
          name="revenue_stage"
          value={(data.revenue_stage as string) || ""}
          onChange={(v) => set("revenue_stage", v)}
          placeholder="Annual revenue range"
          options={[
            "Pre-revenue", "Under 1M SAR", "1M–10M SAR",
            "10M–50M SAR", "50M–200M SAR", "200M+ SAR",
          ]}
        />
      </FieldWrap>

      <FieldWrap>
        <Label required>Years in operation</Label>
        <BriefSelect
          name="years_operating"
          value={(data.years_operating as string) || ""}
          onChange={(v) => set("years_operating", v)}
          placeholder="How long have you been operating?"
          options={["Less than 1 year", "1–3 years", "3–7 years", "7–15 years", "15+ years"]}
        />
      </FieldWrap>
    </div>
  );
}

function StepChallenge({ data, set }: { data: BriefData; set: (k: string, v: string | string[]) => void }) {
  return (
    <div className="brief-fields">
      <FieldWrap>
        <Label required>Primary challenge</Label>
        <Hint>In your own words — what&apos;s the core problem you need help solving?</Hint>
        <BriefTextarea
          name="core_challenge"
          value={(data.core_challenge as string) || ""}
          onChange={(v) => set("core_challenge", v)}
          placeholder="e.g. Our sales team is strong but we can't convert pipeline to closed deals. Revenue has plateaued at 8M SAR for two years..."
          rows={5}
        />
      </FieldWrap>

      <FieldWrap>
        <Label>How long has this been an issue?</Label>
        <BriefSelect
          name="challenge_duration"
          value={(data.challenge_duration as string) || ""}
          onChange={(v) => set("challenge_duration", v)}
          placeholder="Select timeframe"
          options={["Just emerged", "3–6 months", "6–12 months", "1–2 years", "Over 2 years"]}
        />
      </FieldWrap>

      <FieldWrap>
        <Label>What have you already tried?</Label>
        <Hint>What worked, what didn&apos;t — be candid, it helps us avoid wasting your time.</Hint>
        <BriefTextarea
          name="tried_before"
          value={(data.tried_before as string) || ""}
          onChange={(v) => set("tried_before", v)}
          placeholder="e.g. Hired a marketing agency in 2024, ran ads — got impressions but no qualified leads. Tried restructuring the sales team..."
          rows={4}
        />
      </FieldWrap>
    </div>
  );
}

function StepObjective({ data, set }: { data: BriefData; set: (k: string, v: string | string[]) => void }) {
  return (
    <div className="brief-fields">
      <FieldWrap>
        <Label required>Success in 90 days</Label>
        <Hint>If we started today, what would &ldquo;working&rdquo; look like in three months?</Hint>
        <BriefTextarea
          name="success_90_days"
          value={(data.success_90_days as string) || ""}
          onChange={(v) => set("success_90_days", v)}
          placeholder="e.g. A clear go-to-market plan for the Saudi market, 3 pilot customers signed, weekly operational rhythm established..."
          rows={4}
        />
      </FieldWrap>

      <FieldWrap>
        <Label required>Success in 12 months</Label>
        <Hint>Longer horizon — where does the business need to be?</Hint>
        <BriefTextarea
          name="success_12_months"
          value={(data.success_12_months as string) || ""}
          onChange={(v) => set("success_12_months", v)}
          placeholder="e.g. 30M SAR ARR, operating in 3 GCC markets, team scaled to 80 people with proper management structure..."
          rows={4}
        />
      </FieldWrap>

      <FieldWrap>
        <Label>Top priorities right now</Label>
        <Hint>Select all that apply.</Hint>
        <MultiChip
          name="top_priorities"
          value={(data.top_priorities as string[]) || []}
          onChange={(v) => set("top_priorities", v)}
          options={[
            "Revenue growth", "Operational efficiency", "Market expansion",
            "Brand positioning", "Team building", "Fundraising / investor relations",
            "Customer retention", "Digital transformation", "Cost reduction",
            "Product / service development",
          ]}
        />
      </FieldWrap>

      <FieldWrap>
        <Label>The one metric you most want to move</Label>
        <BriefInput
          name="key_metric"
          value={(data.key_metric as string) || ""}
          onChange={(v) => set("key_metric", v)}
          placeholder="e.g. Monthly recurring revenue, customer acquisition cost, gross margin..."
        />
      </FieldWrap>
    </div>
  );
}

function StepMarket({ data, set }: { data: BriefData; set: (k: string, v: string | string[]) => void }) {
  return (
    <div className="brief-fields">
      <FieldWrap>
        <Label required>Target customer</Label>
        <Hint>Who is your ideal customer and what problem do you solve for them?</Hint>
        <BriefTextarea
          name="target_market"
          value={(data.target_market as string) || ""}
          onChange={(v) => set("target_market", v)}
          placeholder="e.g. Mid-market Saudi businesses (50–300 employees) in manufacturing that struggle with supply chain visibility..."
          rows={4}
        />
      </FieldWrap>

      <FieldWrap>
        <Label>Geographies you operate or plan to enter</Label>
        <MultiChip
          name="geographies"
          value={(data.geographies as string[]) || []}
          onChange={(v) => set("geographies", v)}
          options={[
            "Saudi Arabia", "UAE", "Kuwait", "Bahrain",
            "Qatar", "Oman", "Egypt", "Jordan", "MENA broadly", "Global",
          ]}
        />
      </FieldWrap>

      <FieldWrap>
        <Label>Your most direct competitor</Label>
        <BriefInput
          name="main_competitor"
          value={(data.main_competitor as string) || ""}
          onChange={(v) => set("main_competitor", v)}
          placeholder="Name one company clients compare you to"
        />
      </FieldWrap>

      <FieldWrap>
        <Label>Your competitive advantage</Label>
        <Hint>Why do customers choose you over the alternative?</Hint>
        <BriefTextarea
          name="competitive_advantage"
          value={(data.competitive_advantage as string) || ""}
          onChange={(v) => set("competitive_advantage", v)}
          placeholder="e.g. 20 years of Gulf-specific operational experience, proprietary data on regional consumer behaviour..."
          rows={3}
        />
      </FieldWrap>
    </div>
  );
}

function StepInvestment({ data, set }: { data: BriefData; set: (k: string, v: string | string[]) => void }) {
  return (
    <div className="brief-fields">
      <FieldWrap>
        <Label required>Budget range for this engagement</Label>
        <Hint>This helps us scope the right depth of work. All ranges are treated confidentially.</Hint>
        <BriefSelect
          name="budget_range"
          value={(data.budget_range as string) || ""}
          onChange={(v) => set("budget_range", v)}
          placeholder="Select a range"
          options={[
            "Under 50K SAR", "50K–150K SAR", "150K–500K SAR",
            "500K–1M SAR", "Above 1M SAR", "Prefer not to say",
          ]}
        />
      </FieldWrap>

      <FieldWrap>
        <Label required>Preferred engagement type</Label>
        <BriefSelect
          name="engagement_type"
          value={(data.engagement_type as string) || ""}
          onChange={(v) => set("engagement_type", v)}
          placeholder="How do you want to work together?"
          options={[
            "One-time sprint / project",
            "Short engagement (1–3 months)",
            "Medium engagement (3–6 months)",
            "Ongoing advisory (6+ months)",
            "Not sure yet — need your recommendation",
          ]}
        />
      </FieldWrap>

      <FieldWrap>
        <Label required>Urgency</Label>
        <BriefSelect
          name="urgency"
          value={(data.urgency as string) || ""}
          onChange={(v) => set("urgency", v)}
          placeholder="When do you need to start?"
          options={[
            "Immediately — this is critical",
            "Within 1 month",
            "1–3 months",
            "Flexible — planning ahead",
          ]}
        />
      </FieldWrap>

      <FieldWrap>
        <Label>Decision-making process</Label>
        <Hint>Who needs to sign off on bringing us in?</Hint>
        <BriefSelect
          name="decision_process"
          value={(data.decision_process as string) || ""}
          onChange={(v) => set("decision_process", v)}
          placeholder="How decisions get made"
          options={[
            "I decide alone",
            "Small leadership team (2–4 people)",
            "Board or investor approval required",
            "Procurement / RFP process",
          ]}
        />
      </FieldWrap>
    </div>
  );
}

function StepContext({ data, set }: { data: BriefData; set: (k: string, v: string | string[]) => void }) {
  const hasPrevious = (data.previous_consultancy as string) === "Yes";
  return (
    <div className="brief-fields">
      <FieldWrap>
        <Label>Anything else we should know?</Label>
        <Hint>Constraints, sensitivities, internal dynamics, or context that shapes the engagement.</Hint>
        <BriefTextarea
          name="additional_context"
          value={(data.additional_context as string) || ""}
          onChange={(v) => set("additional_context", v)}
          placeholder="e.g. We have a board meeting in October and need findings before then. The CEO and COO have different views on the priority..."
          rows={5}
        />
      </FieldWrap>

      <FieldWrap>
        <Label>Have you worked with a consultancy or advisory firm before?</Label>
        <BriefSelect
          name="previous_consultancy"
          value={(data.previous_consultancy as string) || ""}
          onChange={(v) => set("previous_consultancy", v)}
          placeholder="Select"
          options={["Yes", "No"]}
        />
      </FieldWrap>

      {hasPrevious ? (
        <FieldWrap>
          <Label>What was the outcome?</Label>
          <Hint>Candid is best — what worked, what didn&apos;t, what would you do differently?</Hint>
          <BriefTextarea
            name="consultancy_experience"
            value={(data.consultancy_experience as string) || ""}
            onChange={(v) => set("consultancy_experience", v)}
            placeholder="e.g. Strategy deck was great but no execution support. We didn't implement 80% of the recommendations..."
            rows={3}
          />
        </FieldWrap>
      ) : null}

      <FieldWrap>
        <Label>How did you hear about SADEEM?</Label>
        <BriefSelect
          name="heard_about_sadeem"
          value={(data.heard_about_sadeem as string) || ""}
          onChange={(v) => set("heard_about_sadeem", v)}
          placeholder="Select"
          options={[
            "Referral from someone I know",
            "LinkedIn",
            "Search / Google",
            "Social media",
            "Event or conference",
            "Previous client",
            "Other",
          ]}
        />
      </FieldWrap>
    </div>
  );
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateStep(stepId: StepId, data: BriefData): string | null {
  if (stepId === "business") {
    if (!data.industry) return "Please select your industry.";
    if (!data.company_size) return "Please select your company size.";
    if (!data.revenue_stage) return "Please select your revenue stage.";
    if (!data.years_operating) return "Please select how long you've been operating.";
  }
  if (stepId === "challenge") {
    if (!data.core_challenge || String(data.core_challenge).trim().length < 20)
      return "Please describe your primary challenge in at least a few sentences.";
  }
  if (stepId === "objective") {
    if (!data.success_90_days || String(data.success_90_days).trim().length < 15)
      return "Please describe what success in 90 days looks like.";
    if (!data.success_12_months || String(data.success_12_months).trim().length < 15)
      return "Please describe what success in 12 months looks like.";
  }
  if (stepId === "market") {
    if (!data.target_market || String(data.target_market).trim().length < 15)
      return "Please describe your target customer.";
  }
  if (stepId === "investment") {
    if (!data.budget_range) return "Please select a budget range.";
    if (!data.engagement_type) return "Please select a preferred engagement type.";
    if (!data.urgency) return "Please select your urgency.";
  }
  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────

const STORAGE_KEY_PREFIX = "sadeem_brief_draft_";

export default function BriefStepper({
  proposalId,
  formId,
  clientName,
  clientEmail,
  successMessage,
}: BriefStepperProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<BriefData>({});
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const storageKey = `${STORAGE_KEY_PREFIX}${proposalId}`;
  const currentStep = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setData(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, [storageKey]);

  // Auto-save draft on every change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [data, storageKey]);

  function setField(key: string, value: string | string[]) {
    setData((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function handleNext() {
    const err = validateStep(currentStep.id, data);
    if (err) { setError(err); return; }
    setError(null);
    setStepIndex((i) => i + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    setError(null);
    setStepIndex((i) => i - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSubmit() {
    const err = validateStep(currentStep.id, data);
    if (err) { setError(err); return; }

    // Flatten multiselect arrays to comma-separated strings for the existing action
    const answers: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      answers[key] = Array.isArray(value) ? value.join(", ") : String(value);
    }
    answers["_brief_version"] = "2"; // flag for admin to know it's the structured brief

    startTransition(async () => {
      const result = await submitProposalAction(proposalId, formId, clientName, clientEmail, answers);
      if (result.ok) {
        // Clear draft
        try { localStorage.removeItem(storageKey); } catch { /* ok */ }
        setSubmitted(true);
      } else if (result.error === "already_submitted") {
        setSubmitted(true);
      } else if (result.error === "expired") {
        setError("This brief link has expired. Please contact us for a new one.");
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  if (submitted) {
    return (
      <div className="brief-success">
        <div className="brief-success-icon" aria-hidden="true">✓</div>
        <h2 className="brief-success-title">Brief received.</h2>
        <p className="brief-success-body">
          {successMessage ||
            "Thank you. Our team will review your brief and come back with a clear recommendation — usually within two business days."}
        </p>
      </div>
    );
  }

  const stepComponents: Record<StepId, React.ReactNode> = {
    business:   <StepBusiness   data={data} set={setField} />,
    challenge:  <StepChallenge  data={data} set={setField} />,
    objective:  <StepObjective  data={data} set={setField} />,
    market:     <StepMarket     data={data} set={setField} />,
    investment: <StepInvestment data={data} set={setField} />,
    context:    <StepContext     data={data} set={setField} />,
  };

  return (
    <div className="brief-stepper">
      {/* Progress bar */}
      <div className="brief-progress" aria-hidden="true">
        <div
          className="brief-progress-fill"
          style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Step nav dots */}
      <div className="brief-steps-nav" role="list" aria-label="Brief steps">
        {STEPS.map((step, i) => (
          <div
            key={step.id}
            role="listitem"
            className={`brief-step-dot ${i < stepIndex ? "brief-step-dot--done" : ""} ${i === stepIndex ? "brief-step-dot--active" : ""}`}
            aria-current={i === stepIndex ? "step" : undefined}
          >
            <span className="brief-step-num">{i < stepIndex ? "✓" : i + 1}</span>
            <span className="brief-step-label">{step.title}</span>
          </div>
        ))}
      </div>

      {/* Step header */}
      <div className="brief-step-header">
        <p className="brief-step-count">
          Step {stepIndex + 1} of {STEPS.length}
        </p>
        <h2 className="brief-step-title">{currentStep.title}</h2>
        <p className="brief-step-subtitle">{currentStep.subtitle}</p>
      </div>

      {/* Step content */}
      <div className="brief-step-body">
        {stepComponents[currentStep.id]}
      </div>

      {/* Error */}
      {error ? (
        <p className="brief-error" role="alert">{error}</p>
      ) : null}

      {/* Navigation */}
      <div className="brief-nav">
        {!isFirst ? (
          <button type="button" onClick={handleBack} className="brief-btn-back" disabled={isPending}>
            ← Back
          </button>
        ) : <span />}

        {!isLast ? (
          <button type="button" onClick={handleNext} className="brief-btn-next" disabled={isPending}>
            Continue →
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} className="brief-btn-submit" disabled={isPending}>
            {isPending ? "Submitting…" : "Submit brief →"}
          </button>
        )}
      </div>

      {/* Draft saved notice */}
      <p className="brief-draft-note">
        Draft saved automatically — you can close and return anytime.
      </p>
    </div>
  );
}
