-- Per-record language for the client-facing brief portal + emails.
-- Additive + opt-in: every existing proposal defaults to 'en' (current behavior).
-- Only proposals explicitly set to 'ar' render in Arabic / RTL.

alter table public.proposals
  add column if not exists locale text not null default 'en'
    check (locale in ('en', 'ar'));
