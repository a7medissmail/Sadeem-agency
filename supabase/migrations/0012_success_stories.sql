-- 0012_success_stories.sql
-- Public success stories + admin CRUD.

create table if not exists public.success_stories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  client_name text,
  industry text,
  summary text,
  challenge text,
  solution text,
  results text,
  body text,
  image_url text,
  metric_value text,
  metric_label text,
  sort_order int not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_success_stories_updated_at on public.success_stories;
create trigger set_success_stories_updated_at before update on public.success_stories
  for each row execute function public.set_updated_at();

alter table public.success_stories enable row level security;

drop policy if exists "success_stories_public_read_published" on public.success_stories;
create policy "success_stories_public_read_published" on public.success_stories
  for select using (is_published = true);

drop policy if exists "success_stories_staff_all" on public.success_stories;
create policy "success_stories_staff_all" on public.success_stories
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create index if not exists success_stories_published_sort_idx
  on public.success_stories (is_published, sort_order, created_at desc);

insert into storage.buckets (id, name, public)
values ('success-story-images', 'success-story-images', true)
on conflict (id) do nothing;

drop policy if exists "success_story_images_public_read" on storage.objects;
create policy "success_story_images_public_read"
  on storage.objects for select
  using (bucket_id = 'success-story-images');

drop policy if exists "success_story_images_staff_write" on storage.objects;
create policy "success_story_images_staff_write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'success-story-images' and public.is_staff(auth.uid()));

drop policy if exists "success_story_images_staff_update" on storage.objects;
create policy "success_story_images_staff_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'success-story-images' and public.is_staff(auth.uid()));

drop policy if exists "success_story_images_staff_delete" on storage.objects;
create policy "success_story_images_staff_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'success-story-images' and public.is_staff(auth.uid()));
