-- Stable quotation portal links: store the raw token so re-sending a quote
-- reuses the same link instead of rotating it (which broke the client's link).
-- Rotation becomes an explicit "Regenerate link" action.

alter table public.quotations
  add column if not exists token text;
