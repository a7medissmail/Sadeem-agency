-- 0004_storage.sql
-- Storage buckets for course images (and reusable for future media).
-- Bucket is PUBLIC-read so <Image> can render covers without signed URLs.
-- Writes are restricted via storage.objects policies + the app uses the
-- service-role client for uploads anyway.

insert into storage.buckets (id, name, public)
values ('course-images', 'course-images', true)
on conflict (id) do nothing;

-- Public can read all objects in the course-images bucket
drop policy if exists "course_images_public_read" on storage.objects;
create policy "course_images_public_read"
  on storage.objects for select
  using (bucket_id = 'course-images');

-- Staff (admin/editor) can write/update/delete via the service-role server
-- client (which bypasses RLS), but we add policies for completeness in case
-- a signed-in admin user ever uploads from the browser via the anon client.
drop policy if exists "course_images_staff_write" on storage.objects;
create policy "course_images_staff_write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'course-images' and public.is_staff(auth.uid()));

drop policy if exists "course_images_staff_update" on storage.objects;
create policy "course_images_staff_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'course-images' and public.is_staff(auth.uid()));

drop policy if exists "course_images_staff_delete" on storage.objects;
create policy "course_images_staff_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'course-images' and public.is_staff(auth.uid()));
