-- 0033_grants_services_stories.sql
-- The Supabase project has "Automatically expose new tables" DISABLED, so tables
-- created via SQL (services, service_categories, success_stories) need an explicit
-- base GRANT before the anon/authenticated API roles can read them — even when RLS
-- policies already allow it. This is the same fix pattern as 0002_grants.sql.
-- Idempotent and safe to run multiple times.

grant usage on schema public to anon, authenticated;

-- Public (anon) read — RLS still filters to published rows / public categories
grant select on
  public.services,
  public.service_categories,
  public.success_stories
to anon, authenticated;

-- Staff (authenticated) full access — RLS narrows to admin/editor/staff
grant select, insert, update, delete on
  public.services,
  public.service_categories,
  public.success_stories
to authenticated;
