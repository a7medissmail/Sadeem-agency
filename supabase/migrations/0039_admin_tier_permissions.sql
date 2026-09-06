-- 0039_admin_tier_permissions.sql
-- has_permission() forgot the admin tier.
--
-- 0038 short-circuited only super_admin and otherwise fell through to
-- effective_permissions(), which reports what a person's *job template* grants.
-- An admin normally carries no template — the tier is the point — so the
-- function answered false for every permission an admin holds.
--
-- Today that is only visible through the audit_log_read policy, because the
-- audit page reads with the service role and never consults it. But any policy
-- written against has_permission() later would inherit the same hole, so the
-- tier baseline belongs in the function rather than in each caller.
--
-- The catalogue itself deliberately stays out of SQL (lib/auth/permissions.ts
-- owns it, because permissions exist to gate routes). What SQL needs is not the
-- list of every permission but the rule for admins, and that rule is an
-- exclusion: an admin holds everything except the three keys that define what a
-- super admin is. Expressed as an exclusion, it needs no catalogue and cannot
-- drift when the catalogue grows.

set check_function_bodies = off;

comment on function public.effective_permissions(uuid) is
  'Permissions granted by the person''s job template plus their individual grants, minus their individual revocations. Tier baselines are NOT included — ask has_permission() for a decision.';

create or replace function public.has_permission(uid uuid, perm text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select case
    when exists (
      select 1 from public.profiles
      where id = uid and is_active and role = 'super_admin'
    ) then true
    when exists (
      select 1 from public.profiles
      where id = uid and is_active and role = 'admin'
    ) then perm not in ('settings:manage', 'roles:manage')
    else perm = any (public.effective_permissions(uid))
  end;
$$;

comment on function public.has_permission(uuid, text) is
  'The access decision. super_admin holds everything; admin holds everything but settings:manage and roles:manage; everyone else holds what effective_permissions() reports. Mirrors resolvePermissions() in lib/auth/permissions.ts.';
