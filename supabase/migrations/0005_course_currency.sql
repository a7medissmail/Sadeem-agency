-- Add selectable course pricing currency.

alter table public.courses
  add column if not exists currency text not null default 'SAR';

alter table public.courses
  drop constraint if exists courses_currency_check;

alter table public.courses
  add constraint courses_currency_check
  check (currency in ('SAR', 'USD', 'EUR', 'AED', 'EGP', 'GBP'));
