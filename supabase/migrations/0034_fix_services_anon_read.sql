-- 0034_fix_services_anon_read.sql
-- BUG: the public Services page was empty because the "Admins manage" policies on
-- services / service_categories were created `FOR ALL` with NO role target, and their
-- USING clause runs `select 1 from public.profiles`. Postgres therefore evaluated that
-- subquery even for the anon role during a public SELECT — and anon has no privilege on
-- `profiles`, so the whole query failed with "42501: permission denied for table profiles",
-- which the app swallowed and rendered as "Services coming soon".
--
-- FIX: scope the staff/admin management policies to the `authenticated` role, so the anon
-- role never evaluates the profiles subquery. Public read stays open (published rows only).
-- We do NOT grant anon access to profiles (that would expose user data).
-- Idempotent and safe to re-run.

-- ── services ─────────────────────────────────────────────────────────────────
drop policy if exists "Admins manage services" on public.services;
create policy "Admins manage services"
  on public.services for all
  to authenticated
  using      (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor')));

-- keep public read explicit and scoped to anon + authenticated
drop policy if exists "Public read published services" on public.services;
create policy "Public read published services"
  on public.services for select
  to anon, authenticated
  using (is_published = true);

-- ── service_categories ───────────────────────────────────────────────────────
drop policy if exists "Admins manage service categories" on public.service_categories;
create policy "Admins manage service categories"
  on public.service_categories for all
  to authenticated
  using      (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor')));

drop policy if exists "Public read service categories" on public.service_categories;
create policy "Public read service categories"
  on public.service_categories for select
  to anon, authenticated
  using (true);

-- ── success_stories (uses SECURITY DEFINER is_staff, but scope it too for consistency) ──
drop policy if exists "success_stories_staff_all" on public.success_stories;
create policy "success_stories_staff_all"
  on public.success_stories for all
  to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

drop policy if exists "success_stories_public_read_published" on public.success_stories;
create policy "success_stories_public_read_published"
  on public.success_stories for select
  to anon, authenticated
  using (is_published = true);
