-- 0011_site_settings.sql
-- Website-wide editable brand/contact settings.

create table if not exists public.site_settings (
  id boolean primary key default true check (id = true),
  logo_dark_url text,
  logo_light_url text,
  favicon_url text,
  footer_description text not null default 'Strategic growth advisory — helping ambitious companies achieve measurable results.',
  footer_email text not null default 'hello@sadeem.agency',
  footer_phone text,
  footer_location text,
  social_links jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id)
values (true)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read" on public.site_settings
  for select using (true);

drop policy if exists "site_settings_staff_all" on public.site_settings;
create policy "site_settings_staff_all" on public.site_settings
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

grant select on public.site_settings to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

drop policy if exists "site_assets_public_read" on storage.objects;
create policy "site_assets_public_read"
  on storage.objects for select
  using (bucket_id = 'site-assets');

drop policy if exists "site_assets_staff_write" on storage.objects;
create policy "site_assets_staff_write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'site-assets' and public.is_staff(auth.uid()));

drop policy if exists "site_assets_staff_update" on storage.objects;
create policy "site_assets_staff_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'site-assets' and public.is_staff(auth.uid()));

drop policy if exists "site_assets_staff_delete" on storage.objects;
create policy "site_assets_staff_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'site-assets' and public.is_staff(auth.uid()));
