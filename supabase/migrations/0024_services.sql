-- Services table
create table public.services (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  category     text not null check (category in ('strategy', 'enablement', 'execution')),
  tagline      text,
  intro        text,
  body         text,
  deliverables jsonb not null default '[]'::jsonb,
  icon_key     text,
  sort_order   integer not null default 0,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- RLS
alter table public.services enable row level security;

create policy "Public read published services"
  on public.services for select
  using (is_published = true);

create policy "Admins manage services"
  on public.services for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

-- Updated_at trigger
create trigger services_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- Seed: 11 services from the SADEEM Service Catalogue
insert into public.services (slug, title, category, tagline, intro, deliverables, icon_key, sort_order, is_published) values

-- A. STRATEGY
('market-competitive-analysis',
 'Market & Competitive Analysis',
 'strategy',
 'See clearly before you move.',
 'We assess the commercial landscape to surface the information that sharpens decisions. Before you invest in positioning, a launch, or a new segment — understand what the market looks like, how competitors are playing, and where the real opportunity sits.',
 '["Market mapping and category dynamics", "Competitor analysis and customer behaviour", "Whitespace and opportunity identification"]',
 'Globe', 1, true),

('business-growth-strategy',
 'Business & Growth Strategy',
 'strategy',
 'Define where you play and how you win.',
 'We work with leadership teams to build a clear, prioritised growth strategy — one that reflects the actual shape of your business, not a generic framework. The output is a direction the team can act on, not a slide deck that sits in a drawer.',
 '["Growth strategy development and revenue stream analysis", "Go-to-market direction and prioritisation frameworks", "Strategic decision support"]',
 'Chart', 2, true),

('positioning-value-proposition',
 'Positioning & Value Proposition',
 'strategy',
 'Make what you offer impossible to ignore.',
 'Unclear positioning is the most common reason good businesses grow slowly. We help you sharpen what makes you relevant and differentiated — then translate that into messaging your team and your market can use.',
 '["Brand and offer positioning", "Value proposition design and messaging direction", "Offer-market fit review and segment targeting"]',
 'Target', 3, true),

('go-to-market-planning',
 'Go-to-Market Planning',
 'strategy',
 'Translate strategy into a launch worth executing.',
 'A strategy without a go-to-market plan is an intention. We develop practical GTM plans for launches, market entries, and new product rollouts — built around what your team can actually execute.',
 '["GTM roadmap and channel direction", "Launch planning and execution priorities", "Sales and marketing alignment"]',
 'Trend', 4, true),

('commercial-strategy',
 'Commercial Strategy',
 'strategy',
 'Sharpen the commercial engine behind growth.',
 'Growth problems are rarely solved by marketing alone. We look at the commercial structure driving your pipeline — how leads are handled, how deals are progressed, and where the process breaks down between interest and revenue.',
 '["Sales process diagnosis and pipeline logic", "Sales kit structure and lead handling process", "Commercial journey review"]',
 'Scale', 5, true),

-- B. ENABLEMENT
('team-capability-building',
 'Team & Capability Building',
 'enablement',
 'Build the team behind the strategy.',
 'A strategy that outpaces the team executing it is a strategy that stalls. We help companies build internal clarity, define the right structure, close capability gaps, and create the operating rhythm that makes the strategy stick.',
 '["Team structure and role definition", "Capability gap assessment and hiring support", "Team training plans"]',
 'Team', 6, true),

('workshops-strategic-sessions',
 'Workshops & Strategic Sessions',
 'enablement',
 'Align the room. Move the decision.',
 'Most teams have the answers — they just need a structured environment to surface them. We run focused working sessions that challenge assumptions, resolve misalignment, and produce decisions that hold.',
 '["Leadership, GTM, and positioning workshops", "Cross-functional alignment sessions", "Planning and review sessions"]',
 'Users', 7, true),

('operating-systems-frameworks',
 'Operating Systems & Decision Frameworks',
 'enablement',
 'Replace chaos with systems that compound.',
 'Unclear planning processes, inconsistent reporting, and ad-hoc decision-making slow every business down. We design simple internal systems that reduce friction, improve consistency, and give leadership the visibility they need.',
 '["Planning frameworks and reporting structures", "KPI architecture and decision-making systems", "Internal workflow design"]',
 'Ops', 8, true),

-- C. EXECUTION
('marketing-management-support',
 'Marketing Management Support',
 'execution',
 'Strategic oversight over execution.',
 'Many businesses have the marketing activity — but not the strategic layer above it. We provide direction, supervision, and performance oversight that connects execution back to the growth strategy.',
 '["Marketing direction, supervision, and campaign review", "Performance monitoring and team guidance", "Agency and freelancer coordination"]',
 'Growth', 9, true),

('sales-enablement-support',
 'Sales Enablement Support',
 'execution',
 'Strategy the team can actually use.',
 'Strategy that doesn''t translate into commercial tools the sales team can use is strategy that stops at the whiteboard. We build the materials — decks, credentials, proposals, and messaging — that close the gap.',
 '["Sales presentations and company credentials", "Product and service decks and proposal structure", "Messaging support"]',
 'Merge', 10, true),

('growth-execution-advisory',
 'Growth Execution Advisory',
 'execution',
 'From plan to disciplined action.',
 'Execution breaks down without accountability, coordination, and the discipline to review what''s working and what isn''t. We stay close to the work — tracking priorities, solving problems, and keeping the growth plan moving.',
 '["Execution follow-up and priority tracking", "Cross-functional coordination", "Strategic reviews and problem-solving"]',
 'Transform', 11, true);
