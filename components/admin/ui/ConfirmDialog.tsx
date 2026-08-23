"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "./Button";
import { Input } from "./Field";

/**
 * Destructive confirmation — Sadeem Design System v1.0.
 *
 * The audit's highest-severity UX risk: Delete sits in the same row as Edit, at
 * the same weight, behind a generic confirm. On a 44 px row that is a two-pixel
 * miss from destroying a client record, and "Delete this item? This cannot be
 * undone." tells the user nothing about which item or what else it takes with
 * it.
 *
 * The rules this implements:
 *   · The title names the object — "Delete Website Strategy?", never "Delete?"
 *   · The body states the blast radius in plain numbers
 *   · The confirm button carries the verb, not "OK"
 *   · Cancel is the focused default, so Enter is always the safe key
 *   · Type-to-confirm only when the action touches other records — asking for
 *     it every time trains people to type without reading
 *
 * Built on <dialog>, so focus trapping, Escape and the backdrop come from the
 * platform rather than from us.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  /** Require the exact object name to be typed. Only when other records are touched. */
  confirmText,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [typed, setTyped] = useState("");
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      setTyped("");
      el.showModal();
      // Cancel holds focus, so Enter cancels rather than destroys.
      cancelRef.current?.focus();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  const armed = !confirmText || typed.trim() === confirmText;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => {
        // Click on the backdrop itself, not on the panel.
        if (e.target === ref.current) onCancel();
      }}
      className="w-[min(460px,calc(100vw-32px))] rounded-[var(--sdm-radius-lg)] border border-[var(--sdm-border-strong)] bg-[var(--sdm-surface-overlay)] p-0 text-[var(--admin-text)] shadow-[var(--sdm-elevation-high)] backdrop:bg-[rgba(0,0,0,0.6)]"
    >
      <div className="p-5">
        <h2 id={titleId} className="sdm-section-title">
          {title}
        </h2>
        <div id={bodyId} className="sdm-body-small mt-2 text-[var(--admin-muted)]">
          {body}
        </div>

        {confirmText ? (
          <label className="mt-4 flex flex-col gap-1.5">
            <span className="sdm-form-label text-[var(--sdm-text-secondary)]">
              Type <span className="sdm-metadata text-[var(--admin-text)]">{confirmText}</span> to confirm
            </span>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="danger" disabled={!armed} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
