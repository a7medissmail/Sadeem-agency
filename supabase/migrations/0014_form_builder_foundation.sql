-- 0014_form_builder_foundation.sql
-- Controlled form builder foundation for hiring, leads, consultation intake,
-- and future private proposal/onboarding briefs.

do $$ begin
  create type public.form_purpose as enum ('lead', 'application', 'consultation', 'proposal', 'generic');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.form_field_type as enum (
    'text',
    'textarea',
    'email',
    'phone',
    'url',
    'select',
    'multiselect',
    'checkbox',
    'file',
    'date'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  purpose public.form_purpose not null default 'generic',
  description text,
  submit_label text not null default 'Submit',
  success_message text,
  is_active boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_forms_updated_at on public.forms;
create trigger set_forms_updated_at before update on public.forms
  for each row execute function public.set_updated_at();

create index if not exists forms_purpose_idx on public.forms (purpose);
create index if not exists forms_active_idx on public.forms (is_active);

alter table public.forms enable row level security;

drop policy if exists "forms_public_read_active" on public.forms;
create policy "forms_public_read_active" on public.forms
  for select using (is_active = true);

drop policy if exists "forms_staff_all" on public.forms;
create policy "forms_staff_all" on public.forms
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table if not exists public.form_fields (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  label text not null,
  field_key text not null,
  type public.form_field_type not null,
  placeholder text,
  help_text text,
  options jsonb not null default '[]'::jsonb,
  is_required boolean not null default false,
  sort_order int not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (form_id, field_key)
);

create index if not exists form_fields_form_sort_idx on public.form_fields (form_id, sort_order, created_at);

alter table public.form_fields enable row level security;

drop policy if exists "form_fields_public_read_active_forms" on public.form_fields;
create policy "form_fields_public_read_active_forms" on public.form_fields
  for select using (
    exists (
      select 1 from public.forms
      where forms.id = form_fields.form_id
        and forms.is_active = true
    )
  );

drop policy if exists "form_fields_staff_all" on public.form_fields;
create policy "form_fields_staff_all" on public.form_fields
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  respondent_name text,
  respondent_email text,
  related_type text,
  related_id uuid,
  status text not null default 'new' check (status in ('new', 'reviewed', 'converted', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists form_submissions_form_created_idx on public.form_submissions (form_id, created_at desc);
create index if not exists form_submissions_status_idx on public.form_submissions (status);
create index if not exists form_submissions_email_idx on public.form_submissions (respondent_email);

alter table public.form_submissions enable row level security;

drop policy if exists "form_submissions_public_insert_active_forms" on public.form_submissions;
create policy "form_submissions_public_insert_active_forms" on public.form_submissions
  for insert with check (
    exists (
      select 1 from public.forms
      where forms.id = form_submissions.form_id
        and forms.is_active = true
    )
  );

drop policy if exists "form_submissions_staff_all" on public.form_submissions;
create policy "form_submissions_staff_all" on public.form_submissions
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table if not exists public.form_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.form_submissions(id) on delete cascade,
  field_id uuid references public.form_fields(id) on delete set null,
  field_key text not null,
  value jsonb,
  created_at timestamptz not null default now()
);

create index if not exists form_answers_submission_idx on public.form_answers (submission_id);

alter table public.form_answers enable row level security;

drop policy if exists "form_answers_public_insert" on public.form_answers;
create policy "form_answers_public_insert" on public.form_answers
  for insert with check (true);

drop policy if exists "form_answers_staff_all" on public.form_answers;
create policy "form_answers_staff_all" on public.form_answers
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

grant select on
  public.forms,
  public.form_fields
to anon, authenticated;

grant insert on
  public.form_submissions,
  public.form_answers
to anon, authenticated;

grant select, insert, update, delete on
  public.forms,
  public.form_fields,
  public.form_submissions,
  public.form_answers
to authenticated;

grant all privileges on
  public.forms,
  public.form_fields,
  public.form_submissions,
  public.form_answers
to service_role;
