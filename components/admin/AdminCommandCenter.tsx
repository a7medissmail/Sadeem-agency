"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";

export type AdminSignal = {
  kind: string;
  title: string;
  detail: string;
  href: string;
  when: string;
  tone?: "accent" | "muted";
};

type CommandItem = {
  group: string;
  label: string;
  href: string;
  hint: string;
  shortcut?: string;
  keywords?: string;
};

const commands: CommandItem[] = [
  { group: "Command", label: "Dashboard", href: "/admin", hint: "Operational cockpit", shortcut: "G D", keywords: "overview pulse cockpit" },
  { group: "Command", label: "CRM Leads", href: "/admin/leads", hint: "Triage inbound demand", shortcut: "G L", keywords: "crm lead sales pipeline" },
  { group: "Command", label: "Consultations", href: "/admin/bookings", hint: "Bookings, links, availability", shortcut: "G C", keywords: "calendar booking consultation availability" },
  { group: "Command", label: "Email Studio", href: "/admin/campaigns", hint: "Campaigns and dispatches", shortcut: "G E", keywords: "email resend campaign newsletter" },
  { group: "Content", label: "Workshops", href: "/admin/courses", hint: "Courses and cohorts", shortcut: "G W", keywords: "courses workshops cohorts" },
  { group: "Content", label: "Success Stories", href: "/admin/success-stories", hint: "Case studies and field notes", shortcut: "G S", keywords: "stories cases success" },
  { group: "Content", label: "Team", href: "/admin/team", hint: "Public team roster", shortcut: "G T", keywords: "founders team roster" },
  { group: "Hiring", label: "Roles", href: "/admin/jobs", hint: "Open jobs and internships", shortcut: "G H", keywords: "careers jobs roles hiring" },
  { group: "Hiring", label: "Applications", href: "/admin/applications", hint: "Candidate pipeline", shortcut: "G A", keywords: "candidates applicants resumes hiring" },
  { group: "System", label: "Form Builder", href: "/admin/forms", hint: "Controlled fields and intake forms", shortcut: "G F", keywords: "forms fields proposal brief onboarding intake custom" },
  { group: "System", label: "Site Settings", href: "/admin/settings", hint: "Brand, footer, socials, favicon", shortcut: "G ,", keywords: "settings logo footer favicon social" },
  { group: "System", label: "Users & Roles", href: "/admin/users", hint: "Staff access and permissions", shortcut: "G U", keywords: "users roles permissions auth" },
  { group: "Quick action", label: "Add workshop", href: "/admin/courses/new", hint: "Create a new cohort announcement", keywords: "new course workshop" },
  { group: "Quick action", label: "Add success story", href: "/admin/success-stories/new", hint: "Draft a new case study", keywords: "new story case" },
  { group: "Quick action", label: "Add job", href: "/admin/jobs/new", hint: "Open a new hiring role", keywords: "new job role" },
  { group: "Quick action", label: "Build form", href: "/admin/forms/new", hint: "Create a reusable controlled form", keywords: "new form fields intake" },
  { group: "Quick action", label: "Write campaign", href: "/admin/campaigns", hint: "Compose a CRM dispatch", keywords: "new email campaign" },
];

function matchesCommand(item: CommandItem, query: string) {
  const haystack = `${item.group} ${item.label} ${item.hint} ${item.keywords ?? ""}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function AdminCommandCenter({
  role,
  profileLabel,
  signals,
}: {
  role: string;
  profileLabel: string;
  signals: AdminSignal[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => {
    const next = query.trim() ? commands.filter((item) => matchesCommand(item, query.trim())) : commands;
    return next.slice(0, 12);
  }, [query]);

  useEffect(() => {
    function onGlobalKey(event: KeyboardEvent) {
      const wantsPalette = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
      if (wantsPalette) {
        event.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", onGlobalKey);
    return () => window.removeEventListener("keydown", onGlobalKey);
  }, []);

  useEffect(() => {
    if (!paletteOpen) return;
    setQuery("");
    setActiveIndex(0);
    window.setTimeout(() => inputRef.current?.focus(), 20);
  }, [paletteOpen]);

  useEffect(() => {
    if (!paletteOpen) return;
    function onPaletteKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPaletteOpen(false);
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
      }
      if (event.key === "Enter") {
        const item = filtered[activeIndex];
        if (item) {
          event.preventDefault();
          router.push(item.href);
          setPaletteOpen(false);
        }
      }
    }
    window.addEventListener("keydown", onPaletteKey);
    return () => window.removeEventListener("keydown", onPaletteKey);
  }, [activeIndex, filtered, paletteOpen, router]);

  function openCommand(item: CommandItem) {
    router.push(item.href);
    setPaletteOpen(false);
  }

  let lastGroup = "";

  return (
    <div className="admin-command-center">
      <button type="button" className="admin-command-trigger" onClick={() => setPaletteOpen(true)}>
        <span className="admin-command-mark" aria-hidden="true">/_</span>
        <span className="admin-command-copy">Search pages, people, actions</span>
        <span className="admin-command-kbd">Ctrl K</span>
      </button>

      <div className="admin-topbar-actions">
        <button
          type="button"
          className={`admin-activity-button${activityOpen ? " is-active" : ""}`}
          onClick={() => setActivityOpen((open) => !open)}
          aria-expanded={activityOpen}
        >
          Pulse
          <span aria-hidden="true" />
        </button>
        <span className="admin-role-pill">{role}</span>
        <AdminThemeToggle />
      </div>

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
                <Link key={`${signal.kind}-${index}`} href={signal.href} className="admin-activity-item" onClick={() => setActivityOpen(false)}>
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

      {paletteOpen ? (
        <div className="admin-palette-backdrop" role="presentation" onMouseDown={() => setPaletteOpen(false)}>
          <div className="admin-palette" role="dialog" aria-modal="true" aria-label="Admin command palette" onMouseDown={(event) => event.stopPropagation()}>
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
                      {showGroup ? <div className="admin-palette-group">{item.group}</div> : null}
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
