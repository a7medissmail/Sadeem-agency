"use client";

import { useState, useTransition } from "react";
import { clientRespondQuotationAction } from "@/app/admin/(authed)/proposals/quotation-actions";
import { quoteDict } from "./strings";

type Props = {
  quotationId: string;
  initialStatus: string;
  locale?: string;
};

const CONTACT_EMAIL = "hello@sadeem.agency";

export default function QuoteResponse({ quotationId, initialStatus, locale }: Props) {
  const t = quoteDict(locale).resp;
  const [status, setStatus] = useState(initialStatus);
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    startTransition(async () => {
      const result = await clientRespondQuotationAction(quotationId, "accepted");
      if (result.ok) setStatus("accepted");
      else setError(result.error ?? t.genericError);
    });
  }

  function handleDecline() {
    startTransition(async () => {
      const result = await clientRespondQuotationAction(quotationId, "declined", declineReason);
      if (result.ok) { setStatus("declined"); setShowDeclineForm(false); }
      else setError(result.error ?? t.genericError);
    });
  }

  if (status === "accepted") {
    return (
      <div className="qp-response qp-response--accepted">
        <div className="qp-response-icon">✓</div>
        <h3 className="qp-response-title">{t.acceptedTitle}</h3>
        <p className="qp-response-body">{t.acceptedBody}</p>
      </div>
    );
  }

  if (status === "declined") {
    return (
      <div className="qp-response qp-response--declined">
        <div className="qp-response-icon">✕</div>
        <h3 className="qp-response-title">{t.declinedTitle}</h3>
        <p className="qp-response-body">
          {t.declinedBody(CONTACT_EMAIL)}
        </p>
      </div>
    );
  }

  if (showDeclineForm) {
    return (
      <div className="qp-action-panel">
        <p className="qp-action-label">{t.declineLabel}</p>
        <textarea
          value={declineReason}
          onChange={(e) => setDeclineReason(e.target.value)}
          className="qp-decline-textarea"
          rows={3}
          placeholder={t.declinePlaceholder}
        />
        {error && <p className="qp-error">{error}</p>}
        <div className="qp-action-btns">
          <button type="button" onClick={() => setShowDeclineForm(false)} className="qp-btn-back" disabled={isPending}>
            {t.cancel}
          </button>
          <button type="button" onClick={handleDecline} className="qp-btn-decline" disabled={isPending}>
            {isPending ? t.sending : t.confirmDecline}
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
          {t.decline}
        </button>
        <button type="button" onClick={handleAccept} className="qp-btn-accept" disabled={isPending}>
          {isPending ? t.processing : t.accept}
        </button>
      </div>
      <p className="qp-action-note">{t.note}</p>
    </div>
  );
}
