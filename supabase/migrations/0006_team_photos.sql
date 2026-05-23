-- 0006_team_photos.sql
-- Public bucket for team member portraits.
-- The app writes through the service-role server client; policies are still
-- present for defense-in-depth and future browser-side staff uploads.

insert into storage.buckets (id, name, public)
values ('team-photos', 'team-photos', true)
on conflict (id) do nothing;

drop policy if exists "team_photos_public_read" on storage.objects;
create policy "team_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'team-photos');

drop policy if exists "team_photos_staff_write" on storage.objects;
create policy "team_photos_staff_write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'team-photos' and public.is_staff(auth.uid()));

drop policy if exists "team_photos_staff_update" on storage.objects;
create policy "team_photos_staff_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'team-photos' and public.is_staff(auth.uid()))
  with check (bucket_id = 'team-photos' and public.is_staff(auth.uid()));

drop policy if exists "team_photos_staff_delete" on storage.objects;
create policy "team_photos_staff_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'team-photos' and public.is_staff(auth.uid()));
