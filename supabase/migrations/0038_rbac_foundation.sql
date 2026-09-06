-- 0038_rbac_foundation.sql
-- Three tiers, and job roles that carry the permissions.
--
-- The old model had one enum — admin / editor / viewer — which answers "how
-- much can this person do" but never "what does this person do". A hiring
-- officer and a sales rep both need to write, so both had to be `editor`, and
-- `editor` reaches every module in the admin. The only way to keep someone out
-- of the CRM was to make them a `viewer`, which reaches nothing.
--
-- So the tier and the job are split into two columns answering two questions:
--
--   role         — standing in the hierarchy. Who may manage users and system
--                  settings. Three fixed values, checked, never user-editable.
--   job_role_id  — a template a super admin defines from the UI ("HR Officer",
--                  "Sales Rep") holding a permission set and a data scope.
--
-- with extra_perms / denied_perms as per-person adjustments on top, so one
-- person can differ from their template without needing a template of their own.
--
-- This migration is deliberately behaviour-neutral. Every existing account
-- keeps exactly the access it has today: admins become super admins (they
-- already had user management, and silently demoting them would take away
-- access they hold right now), editors and viewers become employees carrying
-- system templates seeded to their current permission sets.

set check_function_bodies = off;

-- ============================================================
-- 0. Release the policies that read profiles.role directly
-- ============================================================
-- Three policies test `role in ('admin','editor')` inside a subquery instead of
-- going through the helpers. That is a hard dependency on the column, so the
-- type change in step 1 is refused while they exist ("cannot alter type of a
-- column used in a policy definition"). They are recreated in step 7 against
-- the helpers, which is where they should have been all along — and left as
-- they were they would have matched nobody, silently locking staff out of
-- services and categories.

drop policy if exists "Admins manage services" on public.services;
drop policy if exists "Admins manage service categories" on public.service_categories;
drop policy if exists "audit_log_read" on public.audit_log;

-- ============================================================
-- 1. profiles.role: enum -> text
-- ============================================================
-- The enum cannot lose 'editor'/'viewer' — Postgres has no DROP VALUE — and
-- carrying dead values forever invites someone to assign one. Text with a
-- check constraint says the same thing and can actually be corrected later.

alter table public.profiles alter column role drop default;
alter table public.profiles alter column role type text using role::text;

-- ============================================================
-- 2. Job role templates
-- ============================================================
create table if not exists public.staff_roles (
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null,
  name_ar     text not null,
  name_en     text not null,
  description text,
  permissions text[] not null default '{}',
  -- 'all'      — sees every row in the modules the permissions open
  -- 'assigned' — sees only rows owned by them, plus rows nobody owns yet, so a
  --              new lead is not invisible to the whole floor until an admin
  --              gets around to assigning it
  data_scope  text not null default 'all' check (data_scope in ('all', 'assigned')),
  -- system templates back the legacy roles; deleting one would strand its users
  is_system   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists set_staff_roles_updated_at on public.staff_roles;
create trigger set_staff_roles_updated_at before update on public.staff_roles
  for each row execute function public.set_updated_at();

comment on column public.staff_roles.permissions is
  'Permission keys shaped "module:action" (e.g. leads:edit). The catalogue lives in lib/auth/permissions.ts — code owns it, because it is tied to routes.';

-- ============================================================
-- 3. profiles: job role, per-person adjustments, deactivation
-- ============================================================
alter table public.profiles
  add column if not exists job_role_id  uuid references public.staff_roles(id) on delete set null,
  add column if not exists extra_perms  text[]  not null default '{}',
  add column if not exists denied_perms text[]  not null default '{}',
  add column if not exists is_active    boolean not null default true;

create index if not exists profiles_job_role_idx
  on public.profiles (job_role_id) where job_role_id is not null;

comment on column public.profiles.is_active is
  'Deactivation replaces deletion: removing the auth user orphans everything they created and erases who did what. An inactive profile fails is_staff() immediately.';

-- ============================================================
-- 4. Seed the legacy-equivalent templates
-- ============================================================
-- Permission sets transcribed from the requireRole() calls as they stand:
-- ["admin","editor"] is the edit tier, ["admin","editor","viewer"] the view tier.

insert into public.staff_roles (key, name_ar, name_en, description, permissions, data_scope, is_system)
values
  (
    'legacy_editor',
    'محرر',
    'Editor',
    'Carries what the old editor role could reach: write access everywhere, no deletes, no user management.',
    array[
      'dashboard:view',
      'leads:view','leads:edit',
      'bookings:view','bookings:edit',
      'campaigns:view','campaigns:edit',
      'proposals:view','proposals:edit',
      'services:view','services:edit',
      'courses:view','courses:edit',
      'success_stories:view','success_stories:edit',
      'team:view','team:edit',
      'clients:view','clients:edit',
      'jobs:view','jobs:edit',
      'applications:view','applications:edit',
      'forms:view','forms:edit',
      'settings:view','settings:edit',
      'audit_log:view'
    ],
    'all',
    true
  ),
  (
    'legacy_viewer',
    'مشاهد',
    'Viewer',
    'Read-only across the modules the old viewer role was allowed to open.',
    array[
      'dashboard:view',
      'leads:view','bookings:view','campaigns:view','courses:view',
      'success_stories:view','team:view','clients:view','jobs:view',
      'applications:view','forms:view'
    ],
    'all',
    true
  )
on conflict (key) do update
  set permissions = excluded.permissions,
      description = excluded.description,
      is_system   = true;

-- ============================================================
-- 5. Backfill, then constrain
-- ============================================================
update public.profiles
  set job_role_id = (select id from public.staff_roles where key = 'legacy_editor')
  where role = 'editor';

update public.profiles
  set job_role_id = (select id from public.staff_roles where key = 'legacy_viewer')
  where role = 'viewer';

update public.profiles set role = 'super_admin' where role = 'admin';
update public.profiles set role = 'employee'    where role in ('editor', 'viewer');

alter table public.profiles alter column role set default 'employee';

alter table public.profiles drop constraint if exists profiles_role_chk;
alter table public.profiles add constraint profiles_role_chk
  check (role in ('super_admin', 'admin', 'employee'));

comment on column public.profiles.role is
  'Tier only: super_admin manages users, roles and system settings; admin runs operations and manages employees; employee holds nothing on its own and draws everything from job_role_id.';

-- The enum type public.user_role is now unreferenced. Left in place rather than
-- dropped, so a rollback of this migration has something to cast back to.

-- ============================================================
-- 6. Permission resolution
-- ============================================================
-- Effective = template ∪ extra − denied. Super admins short-circuit inside
-- has_permission() rather than being enumerated here, so the catalogue never
-- has to be duplicated into SQL where it would drift from the one in the code.

create or replace function public.effective_permissions(uid uuid)
returns text[]
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (
      select array_agg(distinct perm)
      from public.profiles pr
      left join public.staff_roles r on r.id = pr.job_role_id
      cross join lateral unnest(
        coalesce(r.permissions, '{}'::text[]) || coalesce(pr.extra_perms, '{}'::text[])
      ) as perm
      where pr.id = uid
        and pr.is_active
        and not (perm = any (coalesce(pr.denied_perms, '{}'::text[])))
    ),
    '{}'::text[]
  );
$$;

create or replace function public.has_permission(uid uuid, perm text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and is_active and role = 'super_admin'
  )
  or perm = any (public.effective_permissions(uid));
$$;

create or replace function public.is_super_admin(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and is_active and role = 'super_admin'
  );
$$;

-- is_admin and is_staff keep their names and their meaning, so the fifteen RLS
-- policies built on them need no edit. Only what the names resolve to changed.

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and is_active and role in ('super_admin', 'admin')
  );
$$;

-- Previously "admin or editor", i.e. anyone who may write. An employee only
-- qualifies once they actually hold a write permission — without this test,
-- every read-only employee would silently gain write access to fifteen tables
-- the moment the old viewer role folded into `employee`.
create or replace function public.is_staff(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_admin(uid)
      or exists (
        select 1
        from unnest(public.effective_permissions(uid)) as perm
        where perm like '%:edit' or perm like '%:delete' or perm like '%:manage'
      );
$$;

-- ============================================================
-- 7. Rebuild the policies dropped in step 0, on the helpers
-- ============================================================

create policy "Admins manage services"
  on public.services for all
  to authenticated
  using      (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

create policy "Admins manage service categories"
  on public.service_categories for all
  to authenticated
  using      (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

create policy "audit_log_read"
  on public.audit_log for select
  using (public.has_permission(auth.uid(), 'audit_log:view'));

-- ============================================================
-- 8. staff_roles access
-- ============================================================
alter table public.staff_roles enable row level security;

-- Everyone signed in needs to read their own template to resolve permissions;
-- only super admins may shape them.
drop policy if exists "staff_roles_read" on public.staff_roles;
create policy "staff_roles_read" on public.staff_roles
  for select to authenticated using (true);

drop policy if exists "staff_roles_super_admin_write" on public.staff_roles;
create policy "staff_roles_super_admin_write" on public.staff_roles
  for all to authenticated
  using      (public.is_super_admin(auth.uid()))
  with check (public.is_super_admin(auth.uid()));

grant select, insert, update, delete on public.staff_roles to authenticated;
grant all privileges on public.staff_roles to service_role;
