-- 0036_home_sections.sql
-- Makes the homepage composition editable.
--
-- Before this, app/(marketing)/page.tsx hardcoded 11 sections and every section
-- component carried its own `n="0X"` label and `data-section="0X"`. Those numbers
-- had already drifted out of sync — 07 was used by both "Who It's For" and
-- "Success Stories", and 09 by both "FAQ" and "Final CTA" — because nothing
-- derived them from the actual order.
--
-- This table stores ONLY visibility and order. The section list, labels, tone,
-- and anchors stay in lib/site/homeSections.ts (the registry), and the editorial
-- number is computed from position among enabled sections at render time, so it
-- can never drift again.
--
-- Public pages read this with the service-role key via getHomeSectionLayout(),
-- so no anon grant is needed.

create table if not exists public.home_sections (
  key        text primary key,
  enabled    boolean not null default true,
  sort_order int     not null default 0,
  updated_at timestamptz not null default now()
);

comment on table public.home_sections is
  'Visibility + order for homepage sections. Keys must exist in lib/site/homeSections.ts; unknown keys are ignored by the app.';

-- Seed the current published order. `on conflict do nothing` keeps this
-- idempotent and never clobbers an admin''s later edits.
insert into public.home_sections (key, enabled, sort_order) values
  ('hero',      true,  10),
  ('about',     true,  20),
  ('problem',   true,  30),
  ('approach',  true,  40),
  ('services',  true,  50),
  ('why',       true,  60),
  ('fit',       true,  70),
  ('faq',       true,  80),
  ('cases',     true,  90),
  ('clients',   true, 100),
  ('final-cta', true, 110),
  ('contact',   true, 120)
on conflict (key) do nothing;

alter table public.home_sections enable row level security;

drop policy if exists "home_sections_staff_all" on public.home_sections;
create policy "home_sections_staff_all" on public.home_sections
  for all
  to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

grant select, insert, update, delete on public.home_sections to authenticated;
