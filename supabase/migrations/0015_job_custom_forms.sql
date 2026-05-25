-- 0015_job_custom_forms.sql
-- Allow each hiring role to use a custom Form Builder application form.

alter table public.jobs
  add column if not exists application_form_id uuid references public.forms(id) on delete set null;

create index if not exists jobs_application_form_id_idx on public.jobs (application_form_id);

grant select on public.jobs to anon, authenticated;
grant select, insert, update, delete on public.jobs to authenticated;
grant all privileges on public.jobs to service_role;
