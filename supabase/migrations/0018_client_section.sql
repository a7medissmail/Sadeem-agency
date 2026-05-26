-- 0018_client_section.sql
-- Admin-editable Section 08 (Clients): a singleton row for the section text +
-- a list of partners with anchor/grid roles + a public storage bucket for logos.

-- ============================================================
-- client_section : one row controls all the copy
-- ============================================================
create table if not exists public.client_section (
  id boolean primary key default true check (id = true),
  eyebrow text not null default 'TRUSTED BY AMBITIOUS OPERATORS',
  meta_accent text not null default '8 engagements',
  meta_value text not null default '2019 — 2026',
  foot text not null default 'Hover any logo for context. Most engagements run 90 days; the longest, six years.',
  nda_count int not null default 14,
  nda_label text not null default E'other operators\nunder NDA',
  updated_at timestamptz not null default now()
);

insert into public.client_section (id) values (true) on conflict (id) do nothing;

alter table public.client_section enable row level security;

drop policy if exists "client_section_public_read" on public.client_section;
create policy "client_section_public_read" on public.client_section
  for select using (true);

drop policy if exists "client_section_staff_all" on public.client_section;
create policy "client_section_staff_all" on public.client_section
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

grant select on public.client_section to anon, authenticated;

-- ============================================================
-- client_partners : ordered list, role = anchor | grid
-- ============================================================
do $$ begin
  create type public.client_partner_role as enum ('anchor', 'grid');
exception when duplicate_object then null; end $$;

create table if not exists public.client_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  caption text,
  logo_url text not null,
  role public.client_partner_role not null default 'grid',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_client_partners_updated_at on public.client_partners;
create trigger set_client_partners_updated_at before update on public.client_partners
  for each row execute function public.set_updated_at();

create index if not exists client_partners_role_sort_idx
  on public.client_partners (role, sort_order, created_at);

-- Only one active anchor at a time. Partial unique index enforces it at the DB.
create unique index if not exists client_partners_active_anchor_unique
  on public.client_partners ((true))
  where role = 'anchor' and is_active = true;

alter table public.client_partners enable row level security;

drop policy if exists "client_partners_public_read_active" on public.client_partners;
create policy "client_partners_public_read_active" on public.client_partners
  for select using (is_active = true);

drop policy if exists "client_partners_staff_all" on public.client_partners;
create policy "client_partners_staff_all" on public.client_partners
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

grant select on public.client_partners to anon, authenticated;
grant select, insert, update, delete on public.client_partners to authenticated;
grant all privileges on public.client_partners to service_role;

-- ============================================================
-- Storage bucket : public, staff-write
-- ============================================================
insert into storage.buckets (id, name, public)
values ('partner-logos', 'partner-logos', true)
on conflict (id) do nothing;

drop policy if exists "partner_logos_public_read" on storage.objects;
create policy "partner_logos_public_read"
  on storage.objects for select
  using (bucket_id = 'partner-logos');

drop policy if exists "partner_logos_staff_write" on storage.objects;
create policy "partner_logos_staff_write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'partner-logos' and public.is_staff(auth.uid()));

drop policy if exists "partner_logos_staff_update" on storage.objects;
create policy "partner_logos_staff_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'partner-logos' and public.is_staff(auth.uid()))
  with check (bucket_id = 'partner-logos' and public.is_staff(auth.uid()));

drop policy if exists "partner_logos_staff_delete" on storage.objects;
create policy "partner_logos_staff_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'partner-logos' and public.is_staff(auth.uid()));

-- ============================================================
-- Seed: pre-load the 8 logos already shipped under /public/partners
-- so the admin sees a populated section on first open. Uses external
-- /partners/*.png URLs since those files already exist in the repo.
-- ============================================================
insert into public.client_partners (name, caption, logo_url, role, sort_order)
values
  ('Vodafone', 'Telecom · enterprise growth · multi-year retainer', '/partners/vodafone.png', 'anchor', 0),
  ('Al Ahlia', null, '/partners/ahlia.png',    'grid', 10),
  ('Alfa Labs', null, '/partners/alpha.png',   'grid', 20),
  ('Roshdy', null, '/partners/roshdy.png',     'grid', 30),
  ('Shezlong', null, '/partners/shezlong.png', 'grid', 40),
  ('Sha2ty', null, '/partners/sha2ty.png',     'grid', 50),
  ('TSS', null, '/partners/tss.png',           'grid', 60),
  ('Horror House', null, '/partners/horror.png', 'grid', 70)
on conflict do nothing;
