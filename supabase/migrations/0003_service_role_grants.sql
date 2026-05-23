-- 0003_service_role_grants.sql
-- Supabase's `service_role` normally has ALL privileges on public.* via
-- the project's default setup, but disabling "Automatically expose new
-- tables" at project creation suppresses those defaults for tables you
-- create afterwards (like ours). Without explicit GRANTs, even the
-- service-role client returns 42501 "permission denied".
--
-- Apply: paste into the Supabase SQL Editor and run.

grant all privileges on
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
to service_role;

grant usage on schema public to service_role;

-- Anything we add later should auto-grant for service_role too.
alter default privileges in schema public
  grant all privileges on tables to service_role;
