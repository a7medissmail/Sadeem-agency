"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

type Options = {
  /** Debounce delay for text-like inputs. Default 800ms. */
  debounceMs?: number;
  /**
   * After a successful file-upload save, call router.refresh() so the
   * server component re-renders with the new stored URL. Default true.
   */
  refreshOnFileUpload?: boolean;
};

/**
 * Drop-in auto-save hook for admin edit forms.
 *
 * Usage:
 *   const { formRef, status, errorMsg, onFormChange } = useAutoSave(updateFooAction, {});
 *
 *   <form ref={formRef} onChange={onFormChange} encType="multipart/form-data"
 *         onSubmit={(e) => e.preventDefault()}>
 *     ...fields...
 *     <SaveStatus status={status} error={errorMsg} />
 *   </form>
 *
 * Rules:
 *   - checkbox / radio / select / file  → saves immediately
 *   - everything else (text, url, textarea, number, datetime…) → debounced
 *   - file change → also calls router.refresh() on success so hidden URL
 *     inputs (photo_url, image_url) are updated from the server
 */
export function useAutoSave<TState extends { ok?: boolean; error?: string }>(
  action: (prev: TState, formData: FormData) => Promise<TState>,
  initialState: TState,
  options: Options = {},
) {
  const { debounceMs = 800, refreshOnFileUpload = true } = options;
  const router = useRouter();

  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const stateRef = useRef<TState>(initialState);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const runSave = useCallback(
    (isFileUpload: boolean) => {
      if (!formRef.current) return;
      const formData = new FormData(formRef.current);

      setStatus("saving");
      setErrorMsg(null);

      startTransition(async () => {
        const next = await action(stateRef.current, formData);
        stateRef.current = next;

        if (next.error) {
          setStatus("error");
          setErrorMsg(next.error);
        } else {
          setStatus("saved");
          if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
          savedTimerRef.current = setTimeout(() => {
            setStatus((s) => (s === "saved" ? "idle" : s));
          }, 2500);

          if (isFileUpload && refreshOnFileUpload) {
            router.refresh();
          }
        }
      });
    },
    [action, refreshOnFileUpload, router],
  );

  const onFormChange = useCallback(
    (e: React.ChangeEvent<HTMLFormElement>) => {
      const target = e.target as unknown as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      const tag = target.tagName.toLowerCase();
      const type = "type" in target ? (target as HTMLInputElement).type.toLowerCase() : "";

      const isFile = type === "file";
      const isImmediate = isFile || type === "checkbox" || type === "radio" || tag === "select";

      if (isImmediate) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        runSave(isFile);
      } else {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => runSave(false), debounceMs);
      }
    },
    [runSave, debounceMs],
  );

  return { formRef, status, errorMsg, onFormChange };
}
