-- Service categories — dynamic, admin-managed
create table public.service_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  label       text not null,
  tagline     text,
  description text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.service_categories enable row level security;

create policy "Public read service categories"
  on public.service_categories for select using (true);

create policy "Admins manage service categories"
  on public.service_categories for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

create trigger service_categories_updated_at
  before update on public.service_categories
  for each row execute function public.set_updated_at();

-- Seed with the 3 existing categories
insert into public.service_categories (slug, label, tagline, description, sort_order) values
('strategy',   'Strategy',         'Clarity before action',        'The decisions you make before you act determine everything that follows. We bring clarity to the questions that matter most — which markets to pursue, where you are genuinely differentiated, and what a growth strategy the whole team can execute actually looks like.', 1),
('enablement', 'Enablement',       'Capability that compounds',    'Strategy only works when the people, systems, and tools behind it are ready to execute. We build the internal capability — structure, skills, frameworks, and operating rhythm — that makes your direction stick beyond the planning room.', 2),
('execution',  'Execution Support','Discipline that delivers',     'Most growth plans stall not from poor strategy, but from execution that loses focus. We stay close to the work — providing strategic oversight, commercial tools, and the coordination discipline that keeps the plan moving and measurable.', 3);

-- Remove old hardcoded check constraint on services.category
alter table public.services drop constraint if exists services_category_check;
