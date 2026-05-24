-- 0010_email_center_foundation.sql
-- P6 email center: CRM campaign opt-out + richer send logs.

alter table public.leads
  add column if not exists marketing_unsubscribed_at timestamptz;

create index if not exists leads_marketing_eligible_idx
  on public.leads (status, source, created_at)
  where marketing_unsubscribed_at is null;

alter table public.email_sends
  add column if not exists recipient_email text,
  add column if not exists resend_id text,
  add column if not exists created_at timestamptz not null default now();

create index if not exists email_sends_campaign_idx
  on public.email_sends (campaign_id, created_at desc);

create index if not exists email_sends_recipient_idx
  on public.email_sends (lower(recipient_email));
