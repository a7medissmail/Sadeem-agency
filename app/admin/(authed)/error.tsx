"use client";

/**
 * Error boundary for the authenticated admin area.
 * The admin layout (sidebar, CSS tokens) is still present.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--admin-accent)] mb-4">
          ERR / Unhandled exception
        </p>
        <h1 className="text-[34px] font-semibold tracking-tight text-[var(--admin-text)] leading-[1.02] mb-3">
          Something broke.
        </h1>
        <p className="text-[14.5px] leading-relaxed text-[var(--admin-muted)] max-w-[52ch]">
          An unexpected error occurred in this section. No data has been lost.
          {error.digest && (
            <span className="block mt-2 font-mono text-[11px] text-[var(--admin-subtle)]">
              Digest: {error.digest}
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap justify-center">
        <button
          type="button"
          onClick={reset}
          className="border border-[var(--admin-accent)] text-[var(--admin-accent)] hover:bg-[var(--admin-accent-soft)] px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors"
        >
          Try again
        </button>
        <a
          href="/admin"
          className="border border-[var(--admin-border)] text-[var(--admin-muted)] hover:border-[var(--admin-accent)] hover:text-[var(--admin-text)] px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors"
        >
          ← Dashboard
        </a>
      </div>
    </div>
  );
}
