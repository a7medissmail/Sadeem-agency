-- SADEEM — initial schema (P0..P6 tables, RLS enabled everywhere).
-- Apply: paste into Supabase SQL editor, or run via Supabase CLI:
--   supabase db push   (after `supabase link`)

set check_function_bodies = off;

-- ============================================================
-- Helpers
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- Profiles  (one row per auth.users)
-- ============================================================
do $$ begin
  create type public.user_role as enum ('admin', 'editor', 'viewer');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role public.user_role not null default 'viewer',
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A profile row is auto-created whenever a new auth user is added.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role check helper (avoids RLS recursion).
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = uid and role = 'admin');
$$;

create or replace function public.is_staff(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = uid and role in ('admin', 'editor'));
$$;

-- Profiles policies: a user can read/update their own row; admins can do anything.
drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ============================================================
-- Courses / Workshops
-- ============================================================
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  body text,
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity int,
  price numeric(10, 2),
  image_url text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists set_courses_updated_at on public.courses;
create trigger set_courses_updated_at before update on public.courses
  for each row execute function public.set_updated_at();
alter table public.courses enable row level security;

drop policy if exists "courses_public_read_active" on public.courses;
create policy "courses_public_read_active" on public.courses
  for select using (is_active = true);

drop policy if exists "courses_staff_all" on public.courses;
create policy "courses_staff_all" on public.courses
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- ============================================================
-- Leads (CRM)
-- ============================================================
do $$ begin
  create type public.lead_source as enum ('homepage', 'course', 'consultation', 'other');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.lead_status as enum ('new', 'contacted', 'qualified', 'won', 'lost');
exception when duplicate_object then null; end $$;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  company text,
  message text,
  source public.lead_source not null default 'homepage',
  status public.lead_status not null default 'new',
  owner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists leads_email_idx on public.leads (email);
create index if not exists leads_status_idx on public.leads (status);
alter table public.leads enable row level security;

-- Public can INSERT (lead capture) but cannot read.
drop policy if exists "leads_public_insert" on public.leads;
create policy "leads_public_insert" on public.leads
  for insert with check (true);

drop policy if exists "leads_staff_read_write" on public.leads;
create policy "leads_staff_read_write" on public.leads
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  type text not null,
  note text,
  created_at timestamptz not null default now()
);
alter table public.lead_activities enable row level security;
drop policy if exists "lead_activities_staff_all" on public.lead_activities;
create policy "lead_activities_staff_all" on public.lead_activities
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- ============================================================
-- Bookings (consultations) + availability rules
-- ============================================================
do $$ begin
  create type public.booking_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
exception when duplicate_object then null; end $$;

create table if not exists public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  slot_minutes int not null default 30,
  buffer_minutes int not null default 0,
  active boolean not null default true
);
alter table public.availability_rules enable row level security;
drop policy if exists "availability_public_read" on public.availability_rules;
create policy "availability_public_read" on public.availability_rules
  for select using (active = true);
drop policy if exists "availability_staff_all" on public.availability_rules;
create policy "availability_staff_all" on public.availability_rules
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  topic text,
  slot_start timestamptz not null,
  slot_end timestamptz not null,
  status public.booking_status not null default 'scheduled',
  google_event_id text,
  meet_link text,
  created_at timestamptz not null default now()
);
create index if not exists bookings_slot_idx on public.bookings (slot_start);
alter table public.bookings enable row level security;

drop policy if exists "bookings_public_insert" on public.bookings;
create policy "bookings_public_insert" on public.bookings
  for insert with check (true);
drop policy if exists "bookings_staff_all" on public.bookings;
create policy "bookings_staff_all" on public.bookings
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- ============================================================
-- Team
-- ============================================================
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  bio text,
  photo_url text,
  socials jsonb,
  sort_order int not null default 0,
  is_active boolean not null default true
);
alter table public.team_members enable row level security;
drop policy if exists "team_public_read" on public.team_members;
create policy "team_public_read" on public.team_members
  for select using (is_active = true);
drop policy if exists "team_staff_all" on public.team_members;
create policy "team_staff_all" on public.team_members
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- ============================================================
-- Jobs + Applications (careers)
-- ============================================================
do $$ begin
  create type public.job_type as enum ('job', 'internship');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.application_status as enum ('new', 'review', 'interview', 'offer', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  type public.job_type not null default 'job',
  department text,
  location text,
  body text,
  requirements text,
  is_open boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists set_jobs_updated_at on public.jobs;
create trigger set_jobs_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();
alter table public.jobs enable row level security;
drop policy if exists "jobs_public_read_open" on public.jobs;
create policy "jobs_public_read_open" on public.jobs
  for select using (is_open = true);
drop policy if exists "jobs_staff_all" on public.jobs;
create policy "jobs_staff_all" on public.jobs
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  resume_url text,
  cover_note text,
  status public.application_status not null default 'new',
  created_at timestamptz not null default now()
);
alter table public.applications enable row level security;
drop policy if exists "applications_public_insert" on public.applications;
create policy "applications_public_insert" on public.applications
  for insert with check (true);
drop policy if exists "applications_staff_all" on public.applications;
create policy "applications_staff_all" on public.applications
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- ============================================================
-- Email campaigns (P6)
-- ============================================================
do $$ begin
  create type public.campaign_status as enum ('draft', 'sending', 'sent', 'failed');
exception when duplicate_object then null; end $$;

create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body text not null,
  audience jsonb not null default '{}',
  status public.campaign_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.email_campaigns enable row level security;
drop policy if exists "email_campaigns_staff_all" on public.email_campaigns;
create policy "email_campaigns_staff_all" on public.email_campaigns
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table if not exists public.email_sends (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaigns(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  status text not null default 'queued',
  error text,
  sent_at timestamptz
);
alter table public.email_sends enable row level security;
drop policy if exists "email_sends_staff_all" on public.email_sends;
create policy "email_sends_staff_all" on public.email_sends
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
