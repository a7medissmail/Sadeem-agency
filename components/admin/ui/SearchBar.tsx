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
      className={`flex min-h-[44px] items-center gap-3 border border-[var(--admin-border)] bg-[var(--admin-surface-strong)] px-3 transition-opacity ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--admin-accent)]">
        Search
      </span>
      <input
        // key resets the uncontrolled input when the URL changes externally
        key={searchParams.get("q") ?? ""}
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => {
          clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => push(e.target.value), 380);
        }}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-subtle)]"
      />
      {isPending && (
        <span className="shrink-0 animate-pulse font-mono text-[10px] text-[var(--admin-subtle)]">
          …
        </span>
      )}
    </label>
  );
}
