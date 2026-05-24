-- 0009_booking_duplicate_guard.sql
-- Prevent the same email from holding more than one upcoming scheduled consultation.

create index if not exists bookings_scheduled_email_lookup_idx
  on public.bookings (lower(trim(email)), slot_end)
  where status = 'scheduled';

create or replace function public.prevent_duplicate_active_booking()
returns trigger
language plpgsql
as $$
declare
  normalized_email text;
  existing_booking_id uuid;
begin
  normalized_email := lower(trim(new.email));
  new.email := normalized_email;

  if new.status = 'scheduled' and new.slot_end > now() then
    perform pg_advisory_xact_lock(hashtext('bookings:' || normalized_email));

    select id
      into existing_booking_id
      from public.bookings
      where id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
        and lower(trim(email)) = normalized_email
        and status = 'scheduled'
        and slot_end > now()
      limit 1;

    if existing_booking_id is not null then
      raise exception
        using errcode = '23505',
              message = 'A scheduled booking already exists for this email.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_duplicate_active_booking_trigger on public.bookings;
create trigger prevent_duplicate_active_booking_trigger
  before insert or update of email, status, slot_start, slot_end
  on public.bookings
  for each row
  execute function public.prevent_duplicate_active_booking();
