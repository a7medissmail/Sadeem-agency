// Outline, geometric, single-stroke icon system — part of the visual identity.
export const Icon = {
  Arrow: ({ s = 16 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="square" />
    </svg>
  ),
  Trophy: ({ s = 32 }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M10 6h12v6a6 6 0 0 1-12 0V6Z" />
      <path d="M10 9H6v2a4 4 0 0 0 4 4M22 9h4v2a4 4 0 0 1-4 4" />
      <path d="M13 20v3h6v-3M11 26h10" />
    </svg>
  ),
  Users: ({ s = 32 }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="12" cy="12" r="4" />
      <circle cx="22" cy="13" r="3" />
      <path d="M5 24c0-4 3-6 7-6s7 2 7 6M19 24c0-3 2-5 5-5s5 2 5 5" />
    </svg>
  ),
  Globe: ({ s = 32 }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="16" cy="16" r="11" />
      <path d="M5 16h22M16 5c4 4 4 18 0 22M16 5c-4 4-4 18 0 22" />
    </svg>
  ),
  Question: ({ s = 28 }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.45">
      <circle cx="16" cy="16" r="10.5" />
      <path d="M12.4 13.2a3.9 3.9 0 1 1 6.1 3.2c-1.2.8-2.1 1.5-2.1 3" strokeLinecap="round" />
      <circle cx="16" cy="23" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  ),
  Gap: ({ s = 28 }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.45">
      <circle cx="10" cy="22" r="3.2" />
      <circle cx="23" cy="9" r="3.2" />
      <path d="M12.4 19.6L20.6 11.4" strokeLinecap="round" strokeDasharray="2.2 4.2" />
    </svg>
  ),
  Scale: ({ s = 28 }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.45">
      <rect x="7" y="9" width="16" height="16" rx="2.2" />
      <path d="M18 7h7v7M25 7l-9 9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 20h5M12 16h3" strokeLinecap="round" opacity="0.72" />
    </svg>
  ),
  Pressure: ({ s = 28 }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.45">
      <circle cx="16" cy="16" r="10" />
      <circle cx="16" cy="16" r="3.6" />
      <circle cx="16" cy="16" r="1" fill="currentColor" stroke="none" />
      <path d="M16 4.5v4M16 23.5v4M4.5 16h4M23.5 16h4" strokeLinecap="round" />
    </svg>
  ),
  Target: ({ s = 28 }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="16" cy="16" r="11" />
      <circle cx="16" cy="16" r="6" />
      <circle cx="16" cy="16" r="1.6" fill="currentColor" />
    </svg>
  ),
  Chart: ({ s = 28 }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M5 26h22" />
      <rect x="8" y="16" width="3" height="8" />
      <rect x="15" y="11" width="3" height="13" />
      <rect x="22" y="6" width="3" height="18" />
    </svg>
  ),
  Team: ({ s = 28 }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="11" cy="13" r="3" />
      <circle cx="21" cy="13" r="3" />
      <path d="M5 24c1-3 3-5 6-5s5 2 6 5M16 24c1-3 3-5 6-5s5 2 6 5" />
    </svg>
  ),
  Trend: ({ s = 28 }) => (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M5 22l7-7 4 4 10-10" />
      <path d="M19 9h7v7" />
    </svg>
  ),
  Strategy: ({ s = 22 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M3 12l4-4 5 5 9-9" />
      <path d="M16 4h5v5" />
      <circle cx="7" cy="20" r="1.5" />
      <circle cx="14" cy="20" r="1.5" />
      <circle cx="21" cy="20" r="1.5" />
    </svg>
  ),
  Growth: ({ s = 22 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M3 21V9M9 21V5M15 21v-9M21 21V3" />
    </svg>
  ),
  Ops: ({ s = 22 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
    </svg>
  ),
  Transform: ({ s = 22 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M3 7h14M3 7l4-4M3 7l4 4M21 17H7M21 17l-4-4M21 17l-4 4" />
    </svg>
  ),
  Merge: ({ s = 22 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="12" cy="18" r="2.5" />
      <path d="M7 8l4 8M17 8l-4 8" />
    </svg>
  ),
};
