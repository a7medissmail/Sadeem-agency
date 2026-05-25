-- 0016_rate_limit.sql
-- Lightweight Postgres-backed rate limiter for public submission server actions.
-- Each row records one submission attempt; the helper function counts recent
-- rows for an (action, key) pair and the action can refuse to proceed.
--
-- We deliberately use a single table (not Upstash / Redis) so the project keeps
-- its single-vendor profile and works on the Supabase free tier.

create table if not exists public.submission_attempts (
  id bigint generated always as identity primary key,
  action text not null,
  key text not null,
  created_at timestamptz not null default now()
);

create index if not exists submission_attempts_lookup_idx
  on public.submission_attempts (action, key, created_at desc);

alter table public.submission_attempts enable row level security;

-- No public read/write. Server actions use the service-role client, which
-- bypasses RLS, so we don't need a policy here. Staff (debugging) can read.
drop policy if exists "submission_attempts_staff_read" on public.submission_attempts;
create policy "submission_attempts_staff_read"
  on public.submission_attempts for select to authenticated
  using (public.is_staff(auth.uid()));

-- Garbage collection: prune attempts older than 24 hours. We expose it as a
-- function so a future scheduled task / cron can call it; manual `select
-- public.prune_submission_attempts()` works in the SQL editor too.
create or replace function public.prune_submission_attempts()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.submission_attempts
  where created_at < now() - interval '24 hours';
$$;
