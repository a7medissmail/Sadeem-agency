"use client";

import { useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { Button } from "@/components/admin/ui/Button";
import { Badge } from "@/components/admin/ui/Badge";
import type { QuotationStatus } from "@/types/database";
import {
  saveQuotationAction,
  sendQuotationAction,
  deleteQuotationAction,
  type QuotationItemInput,
  type SaveQuotationState,
  type SendQuotationState,
} from "./quotation-actions";

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuotationItemRow = {
  id: string;
  sort_order: number;
  name: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number;
  total: number;
};

export type QuotationRow = {
  id: string;
  proposal_id: string | null;
  title: string;
  intro_text: string | null;
  currency: string;
  validity_days: number;
  discount_pct: number;
  tax_pct: number;
  subtotal: number;
  total: number;
  token_prefix: string | null;
  status: QuotationStatus;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  decline_reason: string | null;
  notes: string | null;
  items: QuotationItemRow[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_TONES: Record<QuotationStatus, "neutral" | "blue" | "amber" | "violet" | "green" | "red"> = {
  draft: "neutral",
  sent: "amber",
  viewed: "violet",
  accepted: "green",
  declined: "red",
  expired: "neutral",
  superseded: "neutral",
};

const STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  superseded: "Superseded",
};

const CURRENCIES = ["SAR", "USD", "EUR", "AED", "EGP", "GBP"];
const UNITS = ["flat", "month", "day", "session", "hour", "unit", "item"];

const dateFmt = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount);
}

function getPortalUrl(rawToken: string) {
  return typeof window !== "undefined" ? `${window.location.origin}/q/${rawToken}` : `/q/${rawToken}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })}
      className="border border-[var(--admin-accent)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-accent)] hover:bg-[var(--admin-accent-soft)] transition-colors"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}

// ─── Line item editor row ─────────────────────────────────────────────────────

type DraftItem = {
  _key: string;
  name: string;
  description: string;
  quantity: string;
  unit: string;
  unit_price: string;
};

function newDraftItem(): DraftItem {
  return { _key: Math.random().toString(36).slice(2), name: "", description: "", quantity: "1", unit: "flat", unit_price: "" };
}

function ItemRow({
  item,
  currency,
  onChange,
  onRemove,
  canRemove,
}: {
  item: DraftItem;
  currency: string;
  onChange: (key: string, field: keyof DraftItem, value: string) => void;
  onRemove: (key: string) => void;
  canRemove: boolean;
}) {
  const qty = parseFloat(item.quantity) || 0;
  const price = parseFloat(item.unit_price) || 0;
  const line = qty * price;

  return (
    <div className="qb-item-row">
      {/* Name + description */}
      <div className="qb-item-main">
        <input
          type="text"
          value={item.name}
          onChange={(e) => onChange(item._key, "name", e.target.value)}
          placeholder="Service name *"
          className="qb-input qb-item-name"
        />
        <input
          type="text"
          value={item.description}
          onChange={(e) => onChange(item._key, "description", e.target.value)}
          placeholder="Short description (optional)"
          className="qb-input qb-item-desc"
        />
      </div>

      {/* Qty × unit × price */}
      <div className="qb-item-nums">
        <input
          type="number"
          value={item.quantity}
          onChange={(e) => onChange(item._key, "quantity", e.target.value)}
          min="0"
          step="any"
          placeholder="Qty"
          className="qb-input qb-item-qty"
        />
        <select
          value={item.unit}
          onChange={(e) => onChange(item._key, "unit", e.target.value)}
          className="qb-input qb-item-unit"
        >
          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <input
          type="number"
          value={item.unit_price}
          onChange={(e) => onChange(item._key, "unit_price", e.target.value)}
          min="0"
          step="any"
          placeholder="Unit price"
          className="qb-input qb-item-price"
        />
        <div className="qb-item-total">{line > 0 ? fmt(line, currency) : "—"}</div>
        {canRemove ? (
          <button type="button" onClick={() => onRemove(item._key)} className="qb-item-remove" aria-label="Remove">×</button>
        ) : <span />}
      </div>
    </div>
  );
}

// ─── QuotationBuilder ─────────────────────────────────────────────────────────

export function QuotationBuilder({
  proposalId,
  existingQuotation,
  onTokenReady,
}: {
  proposalId: string;
  existingQuotation?: QuotationRow | null;
  onTokenReady?: (token: string) => void;
}) {
  const q = existingQuotation;
  const isEditing = !!q;

  // Form state
  const [title, setTitle] = useState(q?.title ?? "Service Proposal");
  const [introText, setIntroText] = useState(q?.intro_text ?? "");
  const [currency, setCurrency] = useState(q?.currency ?? "SAR");
  const [validityDays, setValidityDays] = useState(String(q?.validity_days ?? 30));
  const [discountPct, setDiscountPct] = useState(String(q?.discount_pct ?? 0));
  const [taxPct, setTaxPct] = useState(String(q?.tax_pct ?? 15)); // 15% VAT default
  const [notes, setNotes] = useState(q?.notes ?? "");

  const [items, setItems] = useState<DraftItem[]>(
    q?.items.length
      ? q.items.map((it) => ({
          _key: it.id,
          name: it.name,
          description: it.description ?? "",
          quantity: String(it.quantity),
          unit: it.unit ?? "flat",
          unit_price: String(it.unit_price),
        }))
      : [newDraftItem()],
  );

  const [rawToken, setRawToken] = useState<string | null>(null);
  const [saveState, saveAction] = useFormState<SaveQuotationState, FormData>(saveQuotationAction, {});
  const [sendState, sendAction] = useFormState<SendQuotationState, FormData>(sendQuotationAction, {});
  const [isDeleting, startDelete] = useTransition();

  // Computed totals
  const parsedItems: QuotationItemInput[] = items.map((item, i) => ({
    sort_order: i,
    name: item.name,
    description: item.description || undefined,
    quantity: parseFloat(item.quantity) || 0,
    unit: item.unit || undefined,
    unit_price: parseFloat(item.unit_price) || 0,
  }));
  const subtotal = parsedItems.reduce((s, it) => s + it.quantity * it.unit_price, 0);
  const disc = parseFloat(discountPct) || 0;
  const tax = parseFloat(taxPct) || 0;
  const afterDiscount = subtotal * (1 - disc / 100);
  const total = afterDiscount * (1 + tax / 100);

  function itemChange(key: string, field: keyof DraftItem, value: string) {
    setItems((prev) => prev.map((it) => it._key === key ? { ...it, [field]: value } : it));
  }
  function addItem() { setItems((prev) => [...prev, newDraftItem()]); }
  function removeItem(key: string) { setItems((prev) => prev.filter((it) => it._key !== key)); }

  function buildFormData(base: Record<string, string>): FormData {
    const fd = new FormData();
    for (const [k, v] of Object.entries(base)) fd.set(k, v);
    fd.set("items", JSON.stringify(parsedItems));
    return fd;
  }

  // Read token from sendState
  const effectiveToken = rawToken ?? (sendState.ok && sendState.rawToken ? sendState.rawToken : null);
  if (sendState.ok && sendState.rawToken && !rawToken) setRawToken(sendState.rawToken);

  const quotationId = saveState.quotationId ?? q?.id;

  // Status
  const status = q?.status ?? "draft";
  const canSend = !!quotationId && status === "draft";
  const canEdit = status === "draft";

  return (
    <div className="qb-wrap">
      {/* Header */}
      <div className="qb-header">
        <div>
          <p className="qb-eyebrow">Quotation</p>
          {isEditing && (
            <div className="flex items-center gap-2 mt-1">
              <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>
              {q?.token_prefix && (
                <span className="font-mono text-[10px] text-[var(--admin-subtle)]">#{q.token_prefix}</span>
              )}
            </div>
          )}
        </div>
        {isEditing && (
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => {
              if (!confirm("Delete this quotation? This cannot be undone.")) return;
              const fd = new FormData();
              fd.set("id", q.id);
              startDelete(() => deleteQuotationAction(fd));
            }}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-red-400 hover:text-red-300 transition-colors"
          >
            Delete
          </button>
        )}
      </div>

      {/* Status timeline (sent/viewed/accepted/declined) */}
      {isEditing && status !== "draft" && (
        <div className="qb-timeline">
          {[
            { label: "Sent", ts: q?.sent_at },
            { label: "Viewed", ts: q?.viewed_at },
            { label: "Accepted", ts: q?.accepted_at },
            { label: "Declined", ts: q?.declined_at },
          ].filter((e) => e.ts).map((event) => (
            <div key={event.label} className="qb-timeline-item">
              <span className="qb-timeline-dot" />
              <span className="font-mono text-[10px] text-[var(--admin-muted)]">
                {event.label} · {dateFmt.format(new Date(event.ts!))}
              </span>
            </div>
          ))}
          {q?.status === "declined" && q.decline_reason && (
            <div className="mt-3 rounded border border-[var(--admin-border)] bg-[var(--admin-surface-strong)] px-3 py-2">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-[var(--admin-subtle)] mb-1">Decline reason</p>
              <p className="text-[12.5px] leading-relaxed text-[var(--admin-muted)]">{q.decline_reason}</p>
            </div>
          )}
        </div>
      )}

      {/* Token banner — after sending */}
      {effectiveToken && (
        <div className="qb-token-banner">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300 mb-2">Quote link ready — copy before closing</p>
          <code className="block break-all text-[12px] text-emerald-200 mb-3 select-all">
            {getPortalUrl(effectiveToken)}
          </code>
          <CopyButton text={getPortalUrl(effectiveToken)} />
        </div>
      )}

      {/* Save form */}
      <form
        action={(fd) => {
          const merged = buildFormData({
            ...(quotationId ? { id: quotationId } : {}),
            proposal_id: proposalId,
            title,
            intro_text: introText,
            currency,
            validity_days: validityDays,
            discount_pct: discountPct,
            tax_pct: taxPct,
            notes,
          });
          saveAction(merged);
        }}
        className="qb-form"
      >
        {/* Title + intro */}
        <div className="qb-section">
          <div className="qb-field">
            <label className="qb-label">Quote title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="qb-input"
              placeholder="e.g. Growth Advisory — Q3 2026"
              disabled={!canEdit}
            />
          </div>
          <div className="qb-field">
            <label className="qb-label">Opening statement</label>
            <p className="qb-hint">Appears above line items — set the context for this engagement.</p>
            <textarea
              value={introText}
              onChange={(e) => setIntroText(e.target.value)}
              className="qb-input qb-textarea"
              rows={3}
              placeholder="e.g. Based on your brief, we propose a 3-month strategy and execution engagement focused on…"
              disabled={!canEdit}
            />
          </div>
        </div>

        {/* Line items */}
        <div className="qb-section">
          <div className="qb-section-head">
            <h4 className="qb-section-title">Service Lines</h4>
            {canEdit && (
              <button type="button" onClick={addItem} className="qb-add-item">+ Add line</button>
            )}
          </div>

          <div className="qb-items-header">
            <span>Service</span>
            <span>Qty</span>
            <span>Unit</span>
            <span>Price</span>
            <span>Total</span>
            <span />
          </div>

          {items.map((item) => (
            <ItemRow
              key={item._key}
              item={item}
              currency={currency}
              onChange={itemChange}
              onRemove={removeItem}
              canRemove={canEdit && items.length > 1}
            />
          ))}

          {/* Totals */}
          <div className="qb-totals">
            <div className="qb-total-row">
              <span>Subtotal</span>
              <span>{fmt(subtotal, currency)}</span>
            </div>
            {disc > 0 && (
              <div className="qb-total-row">
                <span>Discount ({disc}%)</span>
                <span>−{fmt(subtotal * disc / 100, currency)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="qb-total-row">
                <span>Tax ({tax}%)</span>
                <span>{fmt(afterDiscount * tax / 100, currency)}</span>
              </div>
            )}
            <div className="qb-total-row qb-total-row--grand">
              <span>Total</span>
              <span>{fmt(total, currency)}</span>
            </div>
          </div>
        </div>

        {/* Settings row */}
        <div className="qb-section qb-settings-row">
          <div className="qb-field">
            <label className="qb-label">Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="qb-input qb-select" disabled={!canEdit}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="qb-field">
            <label className="qb-label">Valid for (days)</label>
            <input type="number" value={validityDays} onChange={(e) => setValidityDays(e.target.value)} className="qb-input" min="1" max="365" disabled={!canEdit} />
          </div>
          <div className="qb-field">
            <label className="qb-label">Discount %</label>
            <input type="number" value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} className="qb-input" min="0" max="100" step="0.5" disabled={!canEdit} />
          </div>
          <div className="qb-field">
            <label className="qb-label">Tax %</label>
            <input type="number" value={taxPct} onChange={(e) => setTaxPct(e.target.value)} className="qb-input" min="0" max="100" step="0.5" disabled={!canEdit} />
          </div>
        </div>

        {/* Internal notes */}
        <div className="qb-section">
          <div className="qb-field">
            <label className="qb-label">Internal notes</label>
            <p className="qb-hint">Not visible to client.</p>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="qb-input qb-textarea" rows={2} placeholder="Pricing rationale, negotiation notes, special terms..." />
          </div>
        </div>

        {/* Errors */}
        {saveState.error && (
          <p className="qb-error">{saveState.error}</p>
        )}

        {/* Save button */}
        {canEdit && (
          <Button type="submit" size="sm">
            {isEditing ? "Save changes" : "Save quote"}
          </Button>
        )}
        {saveState.ok && !saveState.error && (
          <p className="font-mono text-[10px] text-emerald-400 mt-1">Saved.</p>
        )}
      </form>

      {/* Send form */}
      {canSend && (
        <form
          action={(fd) => {
            const merged = new FormData();
            merged.set("id", quotationId!);
            sendAction(merged);
          }}
          onSubmit={(e) => {
            if (!window.confirm("Send this quotation to the client?\n\nThis will email the portal link and regenerate the access token. Any previously shared link will stop working.")) {
              e.preventDefault();
            }
          }}
          className="qb-send-section"
        >
          {sendState.error && <p className="qb-error">{sendState.error}</p>}
          <Button type="submit" variant="outline" size="sm">
            Send quote to client →
          </Button>
          <p className="qb-hint mt-1">Emails the client a private portal link. The token is also shown above to copy manually.</p>
        </form>
      )}
    </div>
  );
}
