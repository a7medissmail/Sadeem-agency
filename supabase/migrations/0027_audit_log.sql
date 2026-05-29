-- Audit log: tracks every destructive admin action (delete + role changes).
-- Written by service_role only (no RLS insert policy).
-- Readable by admin and editor roles.

create table if not exists public.audit_log (
  id          uuid        primary key default gen_random_uuid(),
  table_name  text        not null,
  record_id   text        not null,        -- uuid as text (covers all PKs)
  action      text        not null         -- 'delete' | 'update'
                          check (action in ('delete', 'update')),
  actor_id    uuid        references public.profiles(id) on delete set null,
  actor_name  text,                        -- snapshot in case profile is later deleted
  meta        jsonb,                       -- optional context: {field, new_value, ...}
  created_at  timestamptz not null default now()
);

create index if not exists audit_log_table_idx   on public.audit_log (table_name, created_at desc);
create index if not exists audit_log_actor_idx   on public.audit_log (actor_id)    where actor_id is not null;
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);

alter table public.audit_log enable row level security;

create policy "audit_log_read" on public.audit_log
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );
