-- 0008_booking_foundation.sql
-- Booking reliability + default public availability.

create unique index if not exists bookings_slot_start_scheduled_idx
  on public.bookings (slot_start)
  where status = 'scheduled';

drop policy if exists "bookings_public_insert" on public.bookings;
drop policy if exists "bookings_public_no_direct_insert" on public.bookings;
create policy "bookings_public_no_direct_insert" on public.bookings
  for insert to anon, authenticated
  with check (false);

insert into public.availability_rules (weekday, start_time, end_time, slot_minutes, buffer_minutes, active)
select weekday, '10:00'::time, '16:00'::time, 45, 15, true
from (values (1), (2), (3), (4)) as defaults(weekday)
where not exists (select 1 from public.availability_rules);
