/**
 * lib/admin/navigation.ts
 * ──────────────────────
 * Single source of truth for admin navigation.
 * Used by:
 *  • app/admin/(authed)/layout.tsx  — sidebar navGroups
 *  • components/admin/AdminCommandCenter.tsx — command palette + G+letter shortcuts
 */

export type NavItem = {
  href: string;
  label: string;
  hint: string;
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
      { href: "/admin",           label: "Dashboard",     hint: "Operational cockpit",                shortcut: "G D", keywords: "overview pulse cockpit" },
      { href: "/admin/leads",     label: "CRM Leads",     hint: "Triage inbound demand",              shortcut: "G L", keywords: "crm lead sales pipeline" },
      { href: "/admin/bookings",  label: "Consultations", hint: "Bookings, links, availability",      shortcut: "G C", keywords: "calendar booking consultation availability" },
      { href: "/admin/campaigns", label: "Email Studio",  hint: "Campaigns and dispatches",           shortcut: "G E", keywords: "email resend campaign newsletter" },
      { href: "/admin/proposals", label: "Proposals",     hint: "Client briefs and quotations",       shortcut: "G P", keywords: "proposals briefs quotes clients rfp" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/services",            label: "Services",        hint: "Public service pages",              shortcut: "G V", keywords: "services offerings advisory" },
      { href: "/admin/services/categories", label: "Categories",      hint: "Service category groupings",                         keywords: "categories services taxonomy" },
      { href: "/admin/courses",             label: "Workshops",        hint: "Courses and cohorts",               shortcut: "G W", keywords: "courses workshops cohorts" },
      { href: "/admin/success-stories",     label: "Success Stories",  hint: "Case studies and field notes",      shortcut: "G S", keywords: "stories cases success" },
      { href: "/admin/team",                label: "Team",             hint: "Public team roster",                shortcut: "G T", keywords: "founders team roster" },
      { href: "/admin/clients",             label: "Clients",          hint: "Partner and client logos",          shortcut: "G I", keywords: "clients partners logos brands" },
    ],
  },
  {
    label: "Hiring",
    items: [
      { href: "/admin/jobs",         label: "Roles",        hint: "Open jobs and internships", shortcut: "G H", keywords: "careers jobs roles hiring" },
      { href: "/admin/applications", label: "Applications", hint: "Candidate pipeline",        shortcut: "G A", keywords: "candidates applicants resumes hiring" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/forms",     label: "Form Builder",  hint: "Controlled fields and intake forms", shortcut: "G F", keywords: "forms fields proposal brief onboarding intake custom" },
      { href: "/admin/settings",  label: "Site Settings", hint: "Brand, footer, socials, favicon",    shortcut: "G ,", keywords: "settings logo footer favicon social" },
      { href: "/admin/users",     label: "Users & Roles", hint: "Staff access and permissions",       shortcut: "G U", keywords: "users roles permissions auth" },
      { href: "/admin/audit-log", label: "Audit Log",     hint: "Who deleted what and when",          shortcut: "G O", keywords: "audit log history changes deleted actions" },
    ],
  },
];

/** Palette-only entries — not shown in sidebar */
export const quickActions: NavItem[] = [
  { href: "/admin/leads/new",           label: "New lead",          hint: "Log an inbound lead manually",         keywords: "new lead crm add" },
  { href: "/admin/bookings/new",        label: "New booking",       hint: "Create a manual consultation slot",    keywords: "new booking consultation" },
  { href: "/admin/courses/new",         label: "Add workshop",      hint: "Create a new cohort announcement",     keywords: "new course workshop" },
  { href: "/admin/success-stories/new", label: "Add success story", hint: "Draft a new case study",              keywords: "new story case" },
  { href: "/admin/jobs/new",            label: "Add job",           hint: "Open a new hiring role",              keywords: "new job role" },
  { href: "/admin/forms/new",           label: "Build form",        hint: "Create a reusable controlled form",   keywords: "new form fields intake" },
  { href: "/admin/campaigns",           label: "Write campaign",    hint: "Compose a CRM dispatch",              keywords: "new email campaign" },
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
