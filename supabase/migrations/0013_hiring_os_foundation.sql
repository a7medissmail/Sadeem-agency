-- 0013_hiring_os_foundation.sql
-- Hiring 2.0 foundation: owner/score/profile links plus notes and
-- status history for the admin candidate dossier.

alter table public.applications
  add column if not exists owner_id uuid references public.profiles(id) on delete set null,
  add column if not exists score smallint check (score between 0 and 100),
  add column if not exists portfolio_url text,
  add column if not exists linkedin_url text,
  add column if not exists custom_answers jsonb not null default '{}'::jsonb;

create index if not exists applications_owner_id_idx on public.applications (owner_id);
create index if not exists applications_score_idx on public.applications (score);

create table if not exists public.application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  note text not null check (char_length(trim(note)) between 2 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists application_notes_application_created_idx
  on public.application_notes (application_id, created_at desc);

alter table public.application_notes enable row level security;

drop policy if exists "application_notes_staff_all" on public.application_notes;
create policy "application_notes_staff_all" on public.application_notes
  for all
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

create table if not exists public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  from_status public.application_status,
  to_status public.application_status not null,
  actor_id uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists application_status_history_application_created_idx
  on public.application_status_history (application_id, created_at desc);

alter table public.application_status_history enable row level security;

drop policy if exists "application_status_history_staff_all" on public.application_status_history;
create policy "application_status_history_staff_all" on public.application_status_history
  for all
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

grant select, insert, update, delete on
  public.application_notes,
  public.application_status_history
to authenticated;

grant all privileges on
  public.application_notes,
  public.application_status_history
to service_role;
