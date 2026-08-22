-- 0035_booking_limits.sql
-- Booking capacity guardrails.
--
-- Until now the consultation calendar had no ceiling: anyone could keep taking
-- slots as long as an availability_rules window existed and Google Calendar was
-- free. The minimum notice (2h) and booking horizon (21 days) were also hardcoded
-- in lib/booking/slots.ts.
--
-- This migration adds:
--   • booking_settings   — single-row config (weekly/daily caps, notice, horizon)
--   • booking_blackouts  — date ranges where nothing is bookable (holidays, travel)
--
-- Defaults preserve today's behaviour exactly (caps = 0 = unlimited, notice = 2h,
-- horizon = 21 days) so deploying this changes nothing until an admin sets a cap.
--
-- Both tables are read server-side with the service-role key (lib/booking/slots.ts),
-- so no anon grants are needed — these are internal capacity numbers.

-- ── booking_settings ─────────────────────────────────────────────────────────
create table if not exists public.booking_settings (
  id                boolean primary key default true check (id),
  max_per_week      int  not null default 0  check (max_per_week  >= 0 and max_per_week  <= 100),
  max_per_day       int  not null default 0  check (max_per_day   >= 0 and max_per_day   <= 50),
  min_notice_hours  int  not null default 2  check (min_notice_hours >= 0 and min_notice_hours <= 720),
  max_advance_days  int  not null default 21 check (max_advance_days >= 1 and max_advance_days <= 180),
  week_starts_on    smallint not null default 0 check (week_starts_on between 0 and 6),
  updated_at        timestamptz not null default now()
);

comment on column public.booking_settings.max_per_week is '0 = unlimited';
comment on column public.booking_settings.max_per_day is '0 = unlimited';
comment on column public.booking_settings.week_starts_on is '0 = Sunday (Riyadh business week), 1 = Monday';

insert into public.booking_settings (id) values (true) on conflict (id) do nothing;

alter table public.booking_settings enable row level security;

drop policy if exists "booking_settings_staff_all" on public.booking_settings;
create policy "booking_settings_staff_all" on public.booking_settings
  for all
  to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

-- ── booking_blackouts ────────────────────────────────────────────────────────
create table if not exists public.booking_blackouts (
  id         uuid primary key default gen_random_uuid(),
  starts_on  date not null,
  ends_on    date not null,
  reason     text,
  created_at timestamptz not null default now(),
  constraint booking_blackouts_range check (ends_on >= starts_on)
);

create index if not exists booking_blackouts_range_idx
  on public.booking_blackouts (starts_on, ends_on);

alter table public.booking_blackouts enable row level security;

drop policy if exists "booking_blackouts_staff_all" on public.booking_blackouts;
create policy "booking_blackouts_staff_all" on public.booking_blackouts
  for all
  to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

grant select, insert, update, delete on
  public.booking_settings,
  public.booking_blackouts
to authenticated;
