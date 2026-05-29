"use client";

/**
 * QuickBriefPanel
 * ───────────────
 * Inline "Send Brief" panel embedded in the Lead drawer and Booking dossier.
 * The parent passes a `createBrief` callback (a partial-applied server action)
 * so this component stays generic — no knowledge of leads vs. bookings needed.
 *
 * States:
 *   idle   → collapsed "Send Brief →" button
 *   open   → mini-panel: form picker + expiry + two action buttons
 *   busy   → loading overlay while action runs
 *   done   → shows the magic link with Copy + Send buttons
 */

import { useState, useTransition } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Select } from "@/components/admin/ui/Field";

export type BriefFormLite = { id: string; name: string };

type Props = {
  forms: BriefFormLite[];
  /** Partial-applied server action: (formId, days, emailNow) → { rawToken?, error? } */
  createBrief: (
    formId: string | null,
    days: number,
    emailNow: boolean,
  ) => Promise<{ rawToken?: string; error?: string }>;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sadeem.agency";

export function QuickBriefPanel({ forms, createBrief }: Props) {
  const [, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [formId, setFormId] = useState<string>("");
  const [days, setDays] = useState(14);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ token?: string; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setOpen(false);
    setResult(null);
    setCopied(false);
    setFormId("");
    setDays(14);
  }

  function run(emailNow: boolean) {
    setBusy(true);
    startTransition(async () => {
      try {
        const res = await createBrief(formId || null, days, emailNow);
        setResult({ token: res.rawToken, error: res.error });
      } catch (err) {
        setResult({ error: err instanceof Error ? err.message : "Unexpected error" });
      } finally {
        setBusy(false);
      }
    });
  }

  function copyLink() {
    if (!result?.token) return;
    navigator.clipboard.writeText(`${SITE_URL}/p/${result.token}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  // ── Idle state ─────────────────────────────────────────────────────────────
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex w-full justify-center border border-[var(--admin-border)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-muted)] transition-colors hover:border-[var(--admin-accent)] hover:text-[var(--admin-accent)]"
      >
        Send Brief →
      </button>
    );
  }

  // ── Done state (link ready) ────────────────────────────────────────────────
  if (result) {
    if (result.error) {
      return (
        <div className="mt-3 space-y-3 border border-red-500/30 bg-red-500/[0.06] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-red-400">Error</p>
          <p className="text-[12.5px] text-[var(--admin-muted)]">{result.error}</p>
          <button
            type="button"
            onClick={reset}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-accent)] hover:underline"
          >
            Try again
          </button>
        </div>
      );
    }

    const link = `${SITE_URL}/p/${result.token}`;

    return (
      <div className="mt-3 space-y-3 border border-[var(--admin-accent)]/30 bg-[var(--admin-accent-soft)] p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-accent)]">Brief ready</p>
        <p className="break-all font-mono text-[10px] text-[var(--admin-muted)]">{link}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="flex-1 border border-[var(--admin-accent)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-accent)] transition-colors hover:bg-[var(--admin-accent)] hover:text-[var(--admin-bg)]"
          >
            {copied ? "Copied ✓" : "Copy link"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="border border-[var(--admin-border)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-muted)] transition-colors hover:border-[var(--admin-accent)] hover:text-[var(--admin-text)]"
          >
            Done
          </button>
        </div>
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--admin-subtle)]">
          This link appears only once — save it now.
        </p>
      </div>
    );
  }

  // ── Open state (config panel) ──────────────────────────────────────────────
  return (
    <div className="mt-3 space-y-3 border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--admin-subtle)]">New Brief</p>
        <button
          type="button"
          onClick={reset}
          className="font-mono text-[10px] text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
          aria-label="Cancel"
        >
          ✕
        </button>
      </div>

      {forms.length > 0 ? (
        <Select
          value={formId}
          onChange={(e) => setFormId(e.target.value)}
          aria-label="Form template"
          className="w-full"
        >
          <option value="">No form (open brief)</option>
          {forms.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </Select>
      ) : (
        <p className="text-[11px] text-[var(--admin-subtle)]">No proposal forms yet — brief will be open-ended.</p>
      )}

      <Select
        value={String(days)}
        onChange={(e) => setDays(Number(e.target.value))}
        aria-label="Expires in"
        className="w-full"
      >
        <option value="7">Expires in 7 days</option>
        <option value="14">Expires in 14 days</option>
        <option value="30">Expires in 30 days</option>
      </Select>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          className="justify-center"
          disabled={busy}
          onClick={() => run(false)}
        >
          {busy ? "Creating…" : "Copy link"}
        </Button>
        <Button
          type="button"
          variant="primary"
          className="justify-center"
          disabled={busy}
          onClick={() => run(true)}
        >
          {busy ? "Sending…" : "Send now"}
        </Button>
      </div>

      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--admin-subtle)]">
        &ldquo;Send now&rdquo; emails the client immediately via briefs@
      </p>
    </div>
  );
}
