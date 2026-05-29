-- 0026_brief_links.sql
-- Trace every proposal back to its origin: a lead or a booking.
-- Both columns are nullable because proposals can also be created
-- directly from /admin/proposals without a source record.

alter table public.proposals
  add column if not exists lead_id    uuid references public.leads(id)    on delete set null,
  add column if not exists booking_id uuid references public.bookings(id) on delete set null;

-- Partial indexes so lookups by source are fast even in large tables
create index if not exists proposals_lead_idx
  on public.proposals (lead_id)
  where lead_id is not null;

create index if not exists proposals_booking_idx
  on public.proposals (booking_id)
  where booking_id is not null;
