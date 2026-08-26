-- 0037_footer_contact.sql
-- Two offices and a WhatsApp line, each in its own column.
--
-- The footer had one phone field and one location field, so a second office
-- and a WhatsApp number could only be crammed into the same string behind a
-- separator. That renders as one unbroken line and, worse, leaves nothing the
-- footer can turn into a link: a number the visitor cannot tap is a number
-- most of them will not dial.
--
-- Separate columns instead, so each contact line knows what it is and the
-- footer can give it the right href — tel: for the landline, wa.me for
-- WhatsApp, plain text for the addresses.

alter table public.site_settings
  add column if not exists footer_whatsapp           text,
  add column if not exists footer_location_secondary text;

comment on column public.site_settings.footer_phone is
  'Primary phone, shown as a tel: link. Store it as you want it read: "+20 2 2414 4266".';
comment on column public.site_settings.footer_whatsapp is
  'WhatsApp number, shown as a wa.me link. Digits are extracted for the href, so formatting is free.';
comment on column public.site_settings.footer_location is
  'Primary office line, e.g. "Riyadh · King Abdul Aziz Rd, Al Sahafah 13321".';
comment on column public.site_settings.footer_location_secondary is
  'Second office line. Left empty, the footer simply omits it.';
