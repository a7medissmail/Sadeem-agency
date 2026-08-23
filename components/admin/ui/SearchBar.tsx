"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";

/**
 * Debounced URL-driven search input.
 * Updates ?q= in the URL after 380 ms of inactivity, triggering a server-side
 * re-fetch of the page with the new query applied to the database query.
 *
 * Must be wrapped in <Suspense> at the call site to satisfy Next.js's
 * requirement that useSearchParams() consumers are inside a Suspense boundary.
 */
export function SearchBar({ placeholder = "Search..." }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function push(raw: string) {
    const p = new URLSearchParams(searchParams.toString());
    const trimmed = raw.trim();
    if (trimmed) p.set("q", trimmed);
    else p.delete("q");
    p.delete("page"); // always reset to first page on a new search
    startTransition(() => router.replace(`${pathname}?${p.toString()}`));
  }

  return (
    <label
      className={`flex min-h-[var(--sdm-control-lg)] items-center gap-3 rounded-[var(--sdm-radius-md)] border border-[var(--sdm-border-default)] bg-[var(--sdm-surface-base)] px-3 transition-opacity focus-within:border-[var(--sdm-border-focus)] focus-within:shadow-[shadow:var(--sdm-ring-field)] ${
        isPending ? "opacity-60" : ""
      }`}
    >
      {/* A01 — "Search" was one of the nine jobs the accent was doing. It is a
          label on a box, not the action on the page. */}
      <span className="sdm-eyebrow shrink-0 text-[var(--sdm-text-tertiary)]">Search</span>
      <input
        // key resets the uncontrolled input when the URL changes externally
        key={searchParams.get("q") ?? ""}
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => {
          clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => push(e.target.value), 380);
        }}
        placeholder={placeholder}
        className="sdm-body-small min-w-0 flex-1 bg-transparent text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-subtle)]"
      />
      {isPending && (
        <span className="sdm-metadata shrink-0 animate-pulse text-[var(--admin-subtle)]">
          …
        </span>
      )}
    </label>
  );
}
