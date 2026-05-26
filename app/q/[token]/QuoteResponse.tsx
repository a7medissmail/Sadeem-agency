"use client";

import { useState, useTransition } from "react";
import { clientRespondQuotationAction } from "@/app/admin/(authed)/proposals/quotation-actions";

type Props = {
  quotationId: string;
  initialStatus: string;
};

export default function QuoteResponse({ quotationId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    startTransition(async () => {
      const result = await clientRespondQuotationAction(quotationId, "accepted");
      if (result.ok) setStatus("accepted");
      else setError(result.error ?? "Something went wrong.");
    });
  }

  function handleDecline() {
    startTransition(async () => {
      const result = await clientRespondQuotationAction(quotationId, "declined", declineReason);
      if (result.ok) { setStatus("declined"); setShowDeclineForm(false); }
      else setError(result.error ?? "Something went wrong.");
    });
  }

  if (status === "accepted") {
    return (
      <div className="qp-response qp-response--accepted">
        <div className="qp-response-icon">✓</div>
        <h3 className="qp-response-title">Quote accepted.</h3>
        <p className="qp-response-body">
          Our team has been notified. We&apos;ll be in touch shortly with next steps.
        </p>
      </div>
    );
  }

  if (status === "declined") {
    return (
      <div className="qp-response qp-response--declined">
        <div className="qp-response-icon">✕</div>
        <h3 className="qp-response-title">Quote declined.</h3>
        <p className="qp-response-body">
          We&apos;ve received your response. If you&apos;d like to discuss alternatives, reach out at{" "}
          <a href="mailto:hello@sadeem.agency" style={{ color: "var(--accent)" }}>hello@sadeem.agency</a>.
        </p>
      </div>
    );
  }

  if (showDeclineForm) {
    return (
      <div className="qp-action-panel">
        <p className="qp-action-label">Why are you declining? (optional)</p>
        <textarea
          value={declineReason}
          onChange={(e) => setDeclineReason(e.target.value)}
          className="qp-decline-textarea"
          rows={3}
          placeholder="e.g. Budget constraints, timing not right, going with another provider..."
        />
        {error && <p className="qp-error">{error}</p>}
        <div className="qp-action-btns">
          <button type="button" onClick={() => setShowDeclineForm(false)} className="qp-btn-back" disabled={isPending}>
            Cancel
          </button>
          <button type="button" onClick={handleDecline} className="qp-btn-decline" disabled={isPending}>
            {isPending ? "Sending…" : "Confirm decline"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="qp-action-panel">
      {error && <p className="qp-error">{error}</p>}
      <div className="qp-action-btns">
        <button type="button" onClick={() => setShowDeclineForm(true)} className="qp-btn-decline-soft" disabled={isPending}>
          Decline
        </button>
        <button type="button" onClick={handleAccept} className="qp-btn-accept" disabled={isPending}>
          {isPending ? "Processing…" : "Accept quote →"}
        </button>
      </div>
      <p className="qp-action-note">
        By accepting, you confirm your intent to proceed with the outlined scope. This is not a binding contract.
      </p>
    </div>
  );
}
