-- 0002_grants.sql
-- The Supabase project was created with "Automatically expose new tables"
-- DISABLED, so the public-API roles (anon, authenticated) have no default
-- privileges on tables created later via SQL. RLS policies still gate WHAT
-- a role can read/write, but Postgres also requires a base GRANT — without
-- one, even a policy that allows everything will fail.
--
-- Apply: paste this whole file into the Supabase SQL Editor and run it.

-- Schema usage
grant usage on schema public to anon, authenticated;

-- Public can submit (RLS allows insert with check (true); below grants the privilege)
grant insert on public.leads, public.bookings, public.applications to anon, authenticated;

-- Public can read rows that policies expose (RLS filters by is_active/is_open)
grant select on
  public.courses,
  public.team_members,
  public.jobs,
  public.availability_rules
to anon, authenticated;

-- Authenticated staff need full table access (RLS narrows to is_staff)
grant select, insert, update, delete on
  public.profiles,
  public.courses,
  public.leads,
  public.lead_activities,
  public.bookings,
  public.availability_rules,
  public.team_members,
  public.jobs,
  public.applications,
  public.email_campaigns,
  public.email_sends
to authenticated;

-- Future tables created in `public` should also be granted by default so
-- we don't hit this again. RLS still enforces row-level access.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select on tables to anon;
