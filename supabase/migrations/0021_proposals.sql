-- 0021_proposals.sql
-- Private proposal / onboarding brief system.
-- Admins create a proposal linked to a form, which generates a magic link
-- (token).  The SHA-256 hash of the token is stored here; the raw token
-- travels only in the URL and is never persisted.

do $$ begin
  create type public.proposal_status as enum (
    'draft',
    'sent',
    'opened',
    'in_progress',
    'submitted',
    'reviewed',
    'converted',
    'expired'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.proposals (
  id             uuid                   primary key default gen_random_uuid(),
  form_id        uuid                   references public.forms(id) on delete set null,
  title          text                   not null check (char_length(trim(title)) > 0),
  client_name    text                   not null check (char_length(trim(client_name)) > 0),
  client_email   text                   not null,
  client_company text,
  token_hash     text                   not null unique,
  token_prefix   text                   not null,          -- first 8 chars, for fast lookup
  status         public.proposal_status not null default 'draft',
  expires_at     timestamptz            not null default (now() + interval '14 days'),
  sent_at        timestamptz,
  opened_at      timestamptz,
  submitted_at   timestamptz,
  reviewed_at    timestamptz,
  created_by     uuid                   references public.profiles(id) on delete set null,
  internal_notes text,
  created_at     timestamptz            not null default now(),
  updated_at     timestamptz            not null default now()
);

drop trigger if exists set_proposals_updated_at on public.proposals;
create trigger set_proposals_updated_at before update on public.proposals
  for each row execute function public.set_updated_at();

create index if not exists proposals_status_idx  on public.proposals (status);
create index if not exists proposals_email_idx   on public.proposals (client_email);
create index if not exists proposals_prefix_idx  on public.proposals (token_prefix);
create index if not exists proposals_created_idx on public.proposals (created_at desc);

alter table public.proposals enable row level security;

drop policy if exists "proposals_staff_all" on public.proposals;
create policy "proposals_staff_all" on public.proposals
  for all
  using  (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

-- No anon policy — public portal uses the service-role admin client server-side.

grant select, insert, update, delete on public.proposals to authenticated;
grant all privileges on public.proposals to service_role;
