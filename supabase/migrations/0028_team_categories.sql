-- Team tiers + credential line.
-- category drives the public Team page sections (Founders / wider Team / Advisory Network).
-- Default 'founder' keeps every existing member in the Founders section (no regression).

alter table public.team_members
  add column if not exists category text not null default 'founder'
    check (category in ('founder','team','advisor')),
  add column if not exists credential text;

create index if not exists team_members_category_idx
  on public.team_members (category, sort_order);
