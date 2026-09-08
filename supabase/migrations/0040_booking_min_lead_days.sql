-- 0040_booking_min_lead_days.sql
-- "No same-day, no next-day" bookings.
--
-- min_notice_hours could not express this: it is measured from *now*, so a 48h
-- notice set at 4pm also swallows the morning of the third day. A lead measured
-- in whole calendar days is what the rule actually is — the first bookable day
-- is today + min_lead_days, in the booking timezone.
--
-- Default 2 = today and tomorrow are closed. 0 restores the old behaviour, where
-- only min_notice_hours holds the line.
--
-- Adding the column with a default backfills the single existing settings row,
-- so the rule is live as soon as this is pushed.

alter table public.booking_settings
  add column if not exists min_lead_days int not null default 2
    check (min_lead_days >= 0 and min_lead_days <= 30);

comment on column public.booking_settings.min_lead_days is
  'Whole days between today and the first bookable day. 0 = same-day allowed.';
