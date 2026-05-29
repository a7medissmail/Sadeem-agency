"use client";

/**
 * AdminCommandCenter
 * ──────────────────
 * Topbar search palette + activity feed + notification badge.
 *
 * Keyboard shortcuts
 * ─────────────────
 *  Ctrl+K / ⌘K   Open/close command palette
 *  Escape         Close palette or activity panel
 *  G then D       Go to Dashboard     (and other G+letter chords — see commands list)
 *  ↑ / ↓          Navigate palette items
 *  Enter          Open selected item
 *
 * Activity feed
 * ─────────────
 *  • Polled every 30 s via GET /api/admin/signals (paused when tab is hidden)
 *  • Unread count stored in localStorage — clears when you open the feed
 *  • Badge shows exact count (max 99+)
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";
import type { AdminSignal } from "@/lib/admin/signals";

export type { AdminSignal };

type CommandItem = {
  group: string;
  label: string;
  href: string;
  hint: string;
  shortcut?: string;
  keywords?: string;
};

const commands: CommandItem[] = [
  { group: "Command", label: "Dashboard",      href: "/admin",               hint: "Operational cockpit",                shortcut: "G D", keywords: "overview pulse cockpit" },
  { group: "Command", label: "CRM Leads",      href: "/admin/leads",         hint: "Triage inbound demand",              shortcut: "G L", keywords: "crm lead sales pipeline" },
  { group: "Command", label: "Consultations",  href: "/admin/bookings",      hint: "Bookings, links, availability",      shortcut: "G C", keywords: "calendar booking consultation availability" },
  { group: "Command", label: "Email Studio",   href: "/admin/campaigns",     hint: "Campaigns and dispatches",           shortcut: "G E", keywords: "email resend campaign newsletter" },
  { group: "Command", label: "Proposals",      href: "/admin/proposals",     hint: "Client briefs and quotations",       shortcut: "G P", keywords: "proposals briefs quotes clients rfp" },
  { group: "Content", label: "Services",       href: "/admin/services",      hint: "Public service pages",               shortcut: "G V", keywords: "services offerings advisory" },
  { group: "Content", label: "Workshops",      href: "/admin/courses",       hint: "Courses and cohorts",                shortcut: "G W", keywords: "courses workshops cohorts" },
  { group: "Content", label: "Success Stories",href: "/admin/success-stories",hint: "Case studies and field notes",      shortcut: "G S", keywords: "stories cases success" },
  { group: "Content", label: "Team",           href: "/admin/team",          hint: "Public team roster",                 shortcut: "G T", keywords: "founders team roster" },
  { group: "Content", label: "Clients",        href: "/admin/clients",       hint: "Partner and client logos",           shortcut: "G I", keywords: "clients partners logos brands" },
  { group: "Hiring",  label: "Roles",          href: "/admin/jobs",          hint: "Open jobs and internships",          shortcut: "G H", keywords: "careers jobs roles hiring" },
  { group: "Hiring",  label: "Applications",   href: "/admin/applications",  hint: "Candidate pipeline",                 shortcut: "G A", keywords: "candidates applicants resumes hiring" },
  { group: "System",  label: "Form Builder",   href: "/admin/forms",         hint: "Controlled fields and intake forms", shortcut: "G F", keywords: "forms fields proposal brief onboarding intake custom" },
  { group: "System",  label: "Site Settings",  href: "/admin/settings",      hint: "Brand, footer, socials, favicon",    shortcut: "G ,", keywords: "settings logo footer favicon social" },
  { group: "System",  label: "Users & Roles",  href: "/admin/users",         hint: "Staff access and permissions",       shortcut: "G U", keywords: "users roles permissions auth" },
  { group: "Quick action", label: "New lead",          href: "/admin/leads/new",          hint: "Log an inbound lead manually",           keywords: "new lead crm add" },
  { group: "Quick action", label: "New booking",       href: "/admin/bookings/new",       hint: "Create a manual consultation slot",       keywords: "new booking consultation" },
  { group: "Quick action", label: "Add workshop",      href: "/admin/courses/new",        hint: "Create a new cohort announcement",        keywords: "new course workshop" },
  { group: "Quick action", label: "Add success story", href: "/admin/success-stories/new",hint: "Draft a new case study",                  keywords: "new story case" },
  { group: "Quick action", label: "Add job",           href: "/admin/jobs/new",           hint: "Open a new hiring role",                  keywords: "new job role" },
  { group: "Quick action", label: "Build form",        href: "/admin/forms/new",          hint: "Create a reusable controlled form",        keywords: "new form fields intake" },
  { group: "Quick action", label: "Write campaign",    href: "/admin/campaigns",          hint: "Compose a CRM dispatch",                  keywords: "new email campaign" },
];

// Build a shortcut lookup: "D" → "/admin", "L" → "/admin/leads" etc.
const chordMap: Record<string, string> = {};
for (const cmd of commands) {
  if (!cmd.shortcut) continue;
  const parts = cmd.shortcut.split(" ");
  if (parts[0] === "G" && parts[1]) {
    chordMap[parts[1].toLowerCase()] = cmd.href;
  }
}

function matchesCommand(item: CommandItem, query: string) {
  const haystack = `${item.group} ${item.label} ${item.hint} ${item.keywords ?? ""}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

const LAST_SEEN_KEY = "admin_signals_last_seen_v2";
const POLL_INTERVAL_MS = 30_000;

export function AdminCommandCenter({
  role,
  profileLabel,
  initialSignals,
}: {
  role: string;
  profileLabel: string;
  initialSignals: AdminSignal[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Palette state ────────────────────────────────────────────────────────────
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  // ── Activity state ───────────────────────────────────────────────────────────
  const [activityOpen, setActivityOpen] = useState(false);
  const [signals, setSignals] = useState<AdminSignal[]>(initialSignals);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);

  // Refs for event handlers (avoid stale closures)
  const paletteOpenRef = useRef(false);
  const pendingGRef = useRef(false);
  const chordTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Init: read lastSeenAt from localStorage ───────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem(LAST_SEEN_KEY);
    setLastSeenAt(stored);
  }, []);

  // ── Keep paletteOpenRef in sync ──────────────────────────────────────────
  useEffect(() => {
    paletteOpenRef.current = paletteOpen;
  }, [paletteOpen]);

  // ── Polling: refresh signals every 30 s (skip when tab is hidden) ────────
  useEffect(() => {
    async function poll() {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/admin/signals", { cache: "no-store" });
        if (res.ok) {
          const fresh: AdminSignal[] = await res.json();
          setSignals(fresh);
        }
      } catch {
        /* silent — stale data is fine */
      }
    }
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // ── Unread count ──────────────────────────────────────────────────────────
  const unreadCount = useMemo(() => {
    if (!lastSeenAt) return signals.length;
    return signals.filter((s) => s.at > lastSeenAt).length;
  }, [signals, lastSeenAt]);

  // ── Filtered palette items ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const next = query.trim()
      ? commands.filter((item) => matchesCommand(item, query.trim()))
      : commands;
    return next.slice(0, 12);
  }, [query]);

  // ── Global keyboard handler (capture phase so Ctrl+K beats Chrome) ────────
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      // ① Ctrl+K / ⌘K — toggle palette
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        event.stopPropagation();
        setPaletteOpen((prev) => !prev);
        return;
      }

      // ② G+letter chord navigation — skip if palette is open or focus is in a field
      if (paletteOpenRef.current) return;
      const target = event.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (target.isContentEditable) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (pendingGRef.current) {
        // Second key of chord
        clearTimeout(chordTimerRef.current);
        pendingGRef.current = false;
        const pressedKey = event.key.toLowerCase();
        const dest = chordMap[pressedKey];
        if (dest) {
          event.preventDefault();
          router.push(dest);
        }
        return;
      }

      // First key: must be 'g'
      if (event.key === "g" || event.key === "G") {
        pendingGRef.current = true;
        chordTimerRef.current = setTimeout(() => {
          pendingGRef.current = false;
        }, 1500);
      }
    }

    window.addEventListener("keydown", onKey, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKey, { capture: true });
      clearTimeout(chordTimerRef.current);
    };
  }, [router]);

  // ── Palette-specific keyboard handler (Escape / Arrow / Enter) ───────────
  useEffect(() => {
    if (!paletteOpen) return;
    function onPaletteKey(event: KeyboardEvent) {
      if (event.key === "Escape") { setPaletteOpen(false); return; }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (event.key === "Enter") {
        const item = filtered[activeIndex];
        if (item) { event.preventDefault(); openCommand(item); }
      }
    }
    window.addEventListener("keydown", onPaletteKey);
    return () => window.removeEventListener("keydown", onPaletteKey);
  }, [paletteOpen, filtered, activeIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Focus palette input when it opens ────────────────────────────────────
  useEffect(() => {
    if (!paletteOpen) return;
    setQuery("");
    setActiveIndex(0);
    window.setTimeout(() => inputRef.current?.focus(), 20);
  }, [paletteOpen]);

  // ── Escape closes activity panel ─────────────────────────────────────────
  useEffect(() => {
    if (!activityOpen) return;
    function onEsc(event: KeyboardEvent) {
      if (event.key === "Escape") setActivityOpen(false);
    }
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [activityOpen]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function openCommand(item: CommandItem) {
    router.push(item.href);
    setPaletteOpen(false);
  }

  function openActivity() {
    setActivityOpen(true);
    const now = new Date().toISOString();
    setLastSeenAt(now);
    try { localStorage.setItem(LAST_SEEN_KEY, now); } catch { /* SSR guard */ }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  let lastGroup = "";

  return (
    <div className="admin-command-center">
      {/* Search trigger */}
      <button type="button" className="admin-command-trigger" onClick={() => setPaletteOpen(true)}>
        <span className="admin-command-mark" aria-hidden="true">/_</span>
        <span className="admin-command-copy">Search pages, people, actions</span>
        <span className="admin-command-kbd">Ctrl K</span>
      </button>

      {/* Topbar actions */}
      <div className="admin-topbar-actions">
        <button
          type="button"
          className={`admin-activity-button${activityOpen ? " is-active" : ""}`}
          onClick={activityOpen ? () => setActivityOpen(false) : openActivity}
          aria-expanded={activityOpen}
          aria-label={`Activity feed${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        >
          Pulse
          {unreadCount > 0 ? (
            <span className="admin-activity-badge" aria-hidden="true">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : (
            <span aria-hidden="true" />
          )}
        </button>
        <span className="admin-role-pill">{role}</span>
        <AdminThemeToggle />
      </div>

      {/* Activity popover */}
      {activityOpen ? (
        <aside className="admin-activity-popover" aria-label="Admin activity feed">
          <div className="admin-activity-head">
            <div>
              <p>Today on the floor</p>
              <span>{profileLabel}</span>
            </div>
            <button type="button" onClick={() => setActivityOpen(false)}>Close</button>
          </div>
          <div className="admin-activity-feed">
            {signals.length ? (
              signals.map((signal, index) => (
                <Link
                  key={`${signal.kind}-${index}`}
                  href={signal.href}
                  className="admin-activity-item"
                  onClick={() => setActivityOpen(false)}
                >
                  <div>
                    <span className={signal.tone === "muted" ? "is-muted" : ""}>{signal.kind}</span>
                    <time>{signal.when}</time>
                  </div>
                  <p>{signal.title}</p>
                  <small>{signal.detail}</small>
                </Link>
              ))
            ) : (
              <p className="admin-activity-empty">No fresh activity yet.</p>
            )}
          </div>
        </aside>
      ) : null}

      {/* Command palette */}
      {paletteOpen ? (
        <div
          className="admin-palette-backdrop"
          role="presentation"
          onMouseDown={() => setPaletteOpen(false)}
        >
          <div
            className="admin-palette"
            role="dialog"
            aria-modal="true"
            aria-label="Admin command palette"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-palette-input-row">
              <span aria-hidden="true">/_</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                placeholder="Jump to a page or action"
                aria-label="Search admin commands"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd>Esc</kbd>
            </div>
            <div className="admin-palette-list">
              {filtered.length ? (
                filtered.map((item, index) => {
                  const showGroup = item.group !== lastGroup;
                  lastGroup = item.group;
                  return (
                    <div key={item.href}>
                      {showGroup ? (
                        <div className="admin-palette-group">{item.group}</div>
                      ) : null}
                      <button
                        type="button"
                        className={`admin-palette-item${index === activeIndex ? " is-active" : ""}`}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => openCommand(item)}
                      >
                        <span>
                          <strong>{item.label}</strong>
                          <small>{item.hint}</small>
                        </span>
                        {item.shortcut ? <kbd>{item.shortcut}</kbd> : <em>Open</em>}
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="admin-palette-empty">No command found.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
