/**
 * lib/auth/permissions.ts
 * ───────────────────────
 * The permission catalogue. One entry per thing a person can be allowed to do.
 *
 * This lives in code rather than the database on purpose: a permission is only
 * meaningful because some route or server action checks it, so the list and the
 * checks have to move together. A DB-side catalogue would be a second copy free
 * to drift from the first. The database stores which permissions a person
 * *holds* (staff_roles.permissions, profiles.extra_perms) — never what the full
 * set of possible permissions is.
 *
 * Key shape: "module:action". The module half matches the admin section it
 * gates, so lib/admin/navigation.ts can hang one permission on each nav item
 * and the sidebar filters itself.
 */

// ─── Catalogue ────────────────────────────────────────────────────────────────
// Actions read the same way everywhere:
//   view   — open the section and read its records
//   edit   — create and update records
//   delete — remove records (destructive; kept separate so a person can run a
//            module day to day without being able to erase its history)
// Two modules break the pattern because their risk is not shaped like CRUD:
//   settings:manage — maintenance mode, which takes the public site down
//   users:manage    — invite, re-role and deactivate staff
//   roles:manage    — define the job templates themselves

const CATALOGUE = {
  dashboard:       ["view"],
  leads:           ["view", "edit", "delete"],
  bookings:        ["view", "edit", "delete"],
  campaigns:       ["view", "edit", "delete"],
  proposals:       ["view", "edit", "delete"],
  services:        ["view", "edit", "delete"],
  courses:         ["view", "edit", "delete"],
  success_stories: ["view", "edit", "delete"],
  team:            ["view", "edit", "delete"],
  clients:         ["view", "edit", "delete"],
  jobs:            ["view", "edit", "delete"],
  applications:    ["view", "edit", "delete"],
  forms:           ["view", "edit", "delete"],
  settings:        ["view", "edit", "manage"],
  users:           ["view", "manage"],
  roles:           ["manage"],
  audit_log:       ["view"],
} as const;

export type ModuleKey = keyof typeof CATALOGUE;

/** Exact keys only — `dashboard:delete` will not typecheck. */
export type PermissionKey = {
  [M in ModuleKey]: `${M}:${(typeof CATALOGUE)[M][number]}`;
}[ModuleKey];

export const ALL_PERMISSIONS: readonly PermissionKey[] = Object.entries(CATALOGUE).flatMap(
  ([module, actions]) => (actions as readonly string[]).map((a) => `${module}:${a}` as PermissionKey),
);

const PERMISSION_SET = new Set<string>(ALL_PERMISSIONS);

/** Narrows an untrusted string (a form field, a DB row) to a known permission. */
export function isPermissionKey(value: unknown): value is PermissionKey {
  return typeof value === "string" && PERMISSION_SET.has(value);
}

/** Drops anything the catalogue no longer knows — a permission removed from the
 *  code would otherwise linger in staff_roles.permissions rows forever. */
export function sanitizePermissions(values: readonly unknown[] | null | undefined): PermissionKey[] {
  if (!values) return [];
  return [...new Set(values.filter(isPermissionKey))];
}

// ─── Labels for the management UI ─────────────────────────────────────────────

export const MODULE_LABELS: Record<ModuleKey, { ar: string; en: string }> = {
  dashboard:       { ar: "لوحة التحكم",       en: "Dashboard" },
  leads:           { ar: "العملاء المحتملون",  en: "CRM Leads" },
  bookings:        { ar: "الاستشارات",         en: "Consultations" },
  campaigns:       { ar: "الحملات البريدية",   en: "Email Studio" },
  proposals:       { ar: "العروض والتسعيرات",  en: "Proposals" },
  services:        { ar: "الخدمات",            en: "Services" },
  courses:         { ar: "ورش العمل",          en: "Workshops" },
  success_stories: { ar: "قصص النجاح",         en: "Success Stories" },
  team:            { ar: "الفريق",             en: "Team" },
  clients:         { ar: "العملاء والشركاء",   en: "Clients" },
  jobs:            { ar: "الوظائف",            en: "Roles" },
  applications:    { ar: "طلبات التوظيف",      en: "Applications" },
  forms:           { ar: "منشئ النماذج",       en: "Form Builder" },
  settings:        { ar: "إعدادات الموقع",     en: "Site Settings" },
  users:           { ar: "المستخدمون",         en: "Users" },
  roles:           { ar: "الوظائف والصلاحيات", en: "Job Roles" },
  audit_log:       { ar: "سجل التدقيق",        en: "Audit Log" },
};

export const ACTION_LABELS: Record<string, { ar: string; en: string }> = {
  view:   { ar: "عرض",   en: "View" },
  edit:   { ar: "تعديل", en: "Edit" },
  delete: { ar: "حذف",   en: "Delete" },
  manage: { ar: "إدارة", en: "Manage" },
};

/** Ordered module → actions, for rendering the permission grid. */
export function permissionGrid(): { module: ModuleKey; permissions: PermissionKey[] }[] {
  return (Object.keys(CATALOGUE) as ModuleKey[]).map((module) => ({
    module,
    permissions: (CATALOGUE[module] as readonly string[]).map(
      (a) => `${module}:${a}` as PermissionKey,
    ),
  }));
}

// ─── Tiers ────────────────────────────────────────────────────────────────────

export const TIERS = ["super_admin", "admin", "employee"] as const;
export type Tier = (typeof TIERS)[number];

export function isTier(value: unknown): value is Tier {
  return typeof value === "string" && (TIERS as readonly string[]).includes(value);
}

export const TIER_LABELS: Record<Tier, { ar: string; en: string }> = {
  super_admin: { ar: "مدير عام",  en: "Super Admin" },
  admin:       { ar: "مدير",      en: "Admin" },
  employee:    { ar: "موظف",      en: "Employee" },
};

/**
 * What each tier holds before its job role is consulted.
 *
 * super_admin is not enumerated — it bypasses the check entirely, so adding a
 * permission to the catalogue can never accidentally leave the owner locked out
 * of a section they are supposed to own.
 *
 * admin gets everything except the three keys that define what a super admin
 * *is*: taking the public site down, redefining job roles, and managing other
 * admins. Note that admin still holds `users:manage` — an admin runs the floor
 * and hires onto it — but the guard rails in the users actions stop them from
 * touching anyone at their own tier or above.
 */
const ADMIN_EXCLUDED: readonly PermissionKey[] = ["settings:manage", "roles:manage"];

export const ADMIN_DEFAULT_PERMISSIONS: readonly PermissionKey[] = ALL_PERMISSIONS.filter(
  (p) => !ADMIN_EXCLUDED.includes(p),
);

/**
 * Resolve what a person can actually do.
 * effective = tier baseline ∪ job template ∪ granted − revoked
 * (revocation loses to nothing: a super admin cannot be limited by it, which is
 * the point of the tier.)
 */
export function resolvePermissions(input: {
  role: Tier;
  isActive: boolean;
  jobRolePermissions?: readonly unknown[] | null;
  extraPerms?: readonly unknown[] | null;
  deniedPerms?: readonly unknown[] | null;
}): Set<PermissionKey> {
  if (!input.isActive) return new Set();
  if (input.role === "super_admin") return new Set(ALL_PERMISSIONS);

  const granted = new Set<PermissionKey>(
    input.role === "admin" ? ADMIN_DEFAULT_PERMISSIONS : [],
  );
  for (const p of sanitizePermissions(input.jobRolePermissions)) granted.add(p);
  for (const p of sanitizePermissions(input.extraPerms)) granted.add(p);
  for (const p of sanitizePermissions(input.deniedPerms)) granted.delete(p);
  return granted;
}

// ─── Data scope ───────────────────────────────────────────────────────────────

export const DATA_SCOPES = ["all", "assigned"] as const;
export type DataScope = (typeof DATA_SCOPES)[number];

export function isDataScope(value: unknown): value is DataScope {
  return typeof value === "string" && (DATA_SCOPES as readonly string[]).includes(value);
}

/**
 * Modules whose records belong to somebody, so `assigned` scope has a meaning.
 * Content modules are absent by design: a service page is not "assigned" to
 * anyone, and pretending otherwise would hide the whole website from an
 * employee who is merely scoped on the CRM.
 */
export const ASSIGNABLE_MODULES = [
  "leads",
  "bookings",
  "applications",
  "proposals",
] as const satisfies readonly ModuleKey[];

export type AssignableModule = (typeof ASSIGNABLE_MODULES)[number];

export function isAssignableModule(module: ModuleKey): module is AssignableModule {
  return (ASSIGNABLE_MODULES as readonly string[]).includes(module);
}
