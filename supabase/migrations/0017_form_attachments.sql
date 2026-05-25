-- 0017_form_attachments.sql
-- Private bucket for files uploaded through Form Builder file fields.
-- Submissions are public, but stored files are only readable by staff (via
-- service-role signed URLs, the same pattern we use for application resumes).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'form-attachments',
  'form-attachments',
  false,
  10485760, -- 10 MB
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "form_attachments_staff_read" on storage.objects;
create policy "form_attachments_staff_read"
  on storage.objects for select to authenticated
  using (bucket_id = 'form-attachments' and public.is_staff(auth.uid()));

drop policy if exists "form_attachments_staff_write" on storage.objects;
create policy "form_attachments_staff_write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'form-attachments' and public.is_staff(auth.uid()));

drop policy if exists "form_attachments_staff_update" on storage.objects;
create policy "form_attachments_staff_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'form-attachments' and public.is_staff(auth.uid()))
  with check (bucket_id = 'form-attachments' and public.is_staff(auth.uid()));

drop policy if exists "form_attachments_staff_delete" on storage.objects;
create policy "form_attachments_staff_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'form-attachments' and public.is_staff(auth.uid()));
