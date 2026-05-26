-- 0020_lead_notes.sql
-- Internal staff notes on CRM leads (mirrors application_notes pattern).

create table if not exists public.lead_notes (
  id         uuid        primary key default gen_random_uuid(),
  lead_id    uuid        not null references public.leads(id) on delete cascade,
  author_id  uuid        references public.profiles(id) on delete set null,
  note       text        not null check (char_length(trim(note)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists lead_notes_lead_created_idx on public.lead_notes (lead_id, created_at desc);

alter table public.lead_notes enable row level security;

drop policy if exists "lead_notes_staff_all" on public.lead_notes;
create policy "lead_notes_staff_all" on public.lead_notes
  for all
  using  (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

grant select, insert, update, delete on public.lead_notes to authenticated;
grant all privileges on public.lead_notes to service_role;
