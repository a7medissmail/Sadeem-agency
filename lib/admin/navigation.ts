/**
 * lib/admin/navigation.ts
 * ──────────────────────
 * Single source of truth for admin navigation.
 * Used by:
 *  • app/admin/(authed)/layout.tsx  — sidebar navGroups
 *  • components/admin/AdminCommandCenter.tsx — command palette + G+letter shortcuts
 *
 * Every entry carries the permission that opens it. That is what lets the
 * sidebar and the palette filter themselves: the alternative is a second list
 * of "who sees what" kept in sync by hand, which drifts the first time somebody
 * adds a page and forgets. The permission here must match the one the page's
 * own requirePermission() call checks — the filter decides what is *shown*, the
 * page decides what is *allowed*, and a link that leads to /admin/no-access is
 * a bug in this file.
 */

import type { PermissionKey } from "@/lib/auth/permissions";

export type NavItem = {
  href: string;
  label: string;
  hint: string;
  permission: PermissionKey;
  shortcut?: string;
  keywords?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Command",
    items: [
      { href: "/admin",           label: "Dashboard",     hint: "Operational cockpit",                permission: "dashboard:view", shortcut: "G D", keywords: "overview pulse cockpit" },
      { href: "/admin/leads",     label: "CRM Leads",     hint: "Triage inbound demand",              permission: "leads:view",     shortcut: "G L", keywords: "crm lead sales pipeline" },
      { href: "/admin/bookings",  label: "Consultations", hint: "Bookings, links, availability",      permission: "bookings:view",  shortcut: "G C", keywords: "calendar booking consultation availability" },
      { href: "/admin/campaigns", label: "Email Studio",  hint: "Campaigns and dispatches",           permission: "campaigns:view", shortcut: "G E", keywords: "email resend campaign newsletter" },
      { href: "/admin/proposals", label: "Proposals",     hint: "Client briefs and quotations",       permission: "proposals:view", shortcut: "G P", keywords: "proposals briefs quotes clients rfp" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/services",            label: "Services",        hint: "Public service pages",         permission: "services:view",        shortcut: "G V", keywords: "services offerings advisory" },
      { href: "/admin/services/categories", label: "Categories",      hint: "Service category groupings",   permission: "services:view",                         keywords: "categories services taxonomy" },
      { href: "/admin/courses",             label: "Workshops",       hint: "Courses and cohorts",          permission: "courses:view",         shortcut: "G W", keywords: "courses workshops cohorts" },
      { href: "/admin/success-stories",     label: "Success Stories", hint: "Case studies and field notes", permission: "success_stories:view", shortcut: "G S", keywords: "stories cases success" },
      { href: "/admin/team",                label: "Team",            hint: "Public team roster",           permission: "team:view",            shortcut: "G T", keywords: "founders team roster" },
      { href: "/admin/clients",             label: "Clients",         hint: "Partner and client logos",     permission: "clients:view",         shortcut: "G I", keywords: "clients partners logos brands" },
    ],
  },
  {
    label: "Hiring",
    items: [
      { href: "/admin/jobs",         label: "Roles",        hint: "Open jobs and internships", permission: "jobs:view",         shortcut: "G H", keywords: "careers jobs roles hiring" },
      { href: "/admin/applications", label: "Applications", hint: "Candidate pipeline",        permission: "applications:view", shortcut: "G A", keywords: "candidates applicants resumes hiring" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/forms",     label: "Form Builder",  hint: "Controlled fields and intake forms", permission: "forms:view",     shortcut: "G F", keywords: "forms fields proposal brief onboarding intake custom" },
      { href: "/admin/settings",  label: "Site Settings", hint: "Brand, footer, socials, favicon",    permission: "settings:view",  shortcut: "G ,", keywords: "settings logo footer favicon social" },
      { href: "/admin/users",     label: "Users & Roles", hint: "Staff access and permissions",       permission: "users:view",     shortcut: "G U", keywords: "users roles permissions auth" },
      { href: "/admin/audit-log", label: "Audit Log",     hint: "Who deleted what and when",          permission: "audit_log:view", shortcut: "G O", keywords: "audit log history changes deleted actions" },
    ],
  },
];

/** Palette-only entries — not shown in sidebar */
export const quickActions: NavItem[] = [
  { href: "/admin/leads/new",           label: "New lead",          hint: "Log an inbound lead manually",      permission: "leads:edit",           keywords: "new lead crm add" },
  { href: "/admin/bookings/new",        label: "New booking",       hint: "Create a manual consultation slot", permission: "bookings:edit",        keywords: "new booking consultation" },
  { href: "/admin/courses/new",         label: "Add workshop",      hint: "Create a new cohort announcement",  permission: "courses:edit",         keywords: "new course workshop" },
  { href: "/admin/success-stories/new", label: "Add success story", hint: "Draft a new case study",            permission: "success_stories:edit", keywords: "new story case" },
  { href: "/admin/jobs/new",            label: "Add job",           hint: "Open a new hiring role",            permission: "jobs:edit",            keywords: "new job role" },
  { href: "/admin/forms/new",           label: "Build form",        hint: "Create a reusable controlled form", permission: "forms:edit",           keywords: "new form fields intake" },
  { href: "/admin/campaigns",           label: "Write campaign",    hint: "Compose a CRM dispatch",            permission: "campaigns:edit",       keywords: "new email campaign" },
];

/** Flat command list consumed by AdminCommandCenter */
export type PaletteCommand = NavItem & { group: string };

export function buildPaletteCommands(): PaletteCommand[] {
  const nav = navGroups.flatMap((g) =>
    g.items.map((item) => ({ ...item, group: g.label }))
  );
  const quick = quickActions.map((item) => ({ ...item, group: "Quick action" }));
  return [...nav, ...quick];
}

/**
 * Narrow the sidebar to what this person can actually open, dropping any group
 * left with nothing in it — an empty "Hiring" heading is worse than no heading.
 */
export function visibleNavGroups(permissions: readonly string[]): NavGroup[] {
  const held = new Set(permissions);
  return navGroups
    .map((group) => ({ ...group, items: group.items.filter((i) => held.has(i.permission)) }))
    .filter((group) => group.items.length > 0);
}

export function visiblePaletteCommands(permissions: readonly string[]): PaletteCommand[] {
  const held = new Set(permissions);
  return buildPaletteCommands().filter((c) => held.has(c.permission));
}
