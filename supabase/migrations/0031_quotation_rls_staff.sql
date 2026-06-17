-- 0031_quotation_rls_staff.sql
-- Tighten quotations RLS. The original policies from 0022 used
-- auth.role() = 'authenticated', which granted ANY signed-in user (including
-- viewer-role accounts) full CRUD on quotations and quotation_items via the
-- public API — including the portal token column. Match every other table:
-- staff (admin/editor) only. The admin app and portal both use the
-- service-role client, which bypasses RLS, so nothing else changes.

drop policy if exists "staff can manage quotations" on public.quotations;
create policy "staff can manage quotations"
  on public.quotations for all
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

drop policy if exists "staff can manage quotation_items" on public.quotation_items;
create policy "staff can manage quotation_items"
  on public.quotation_items for all
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));
