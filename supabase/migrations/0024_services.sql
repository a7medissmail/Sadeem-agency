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

-- ─── Seed: 11 services from the SADEEM Service Catalogue ────────────────────
insert into public.services
  (slug, title, category, tagline, intro, body, deliverables, icon_key, sort_order, is_published)
values

-- ── A. STRATEGY ─────────────────────────────────────────────────────────────

('market-competitive-analysis',
 'Market & Competitive Analysis',
 'strategy',
 'See clearly before you move.',
 'Before you invest in repositioning, a new market, or a significant go-to-market push, you need a clear view of the landscape. Most companies act on assumptions that feel solid but haven''t been tested. We replace those assumptions with structured market intelligence.',
 '<p>Our market and competitive analysis work covers the full commercial picture — category dynamics, competitor positioning, customer decision drivers, and the whitespace where real differentiation is possible.</p>
<p>The output is a clear, actionable read of the market. Not a library of data, but a focused brief that tells you where you stand, who you''re really competing with, and where the opportunity to win is most real. Built to inform your next significant move, not to sit in a folder.</p>',
 '["Market mapping and category dynamics", "Competitor positioning and messaging audit", "Customer behaviour and decision-driver analysis", "Whitespace and opportunity identification", "Strategic implications and recommended priorities"]',
 'Globe', 1, true),

('business-growth-strategy',
 'Business & Growth Strategy',
 'strategy',
 'Define where you play and how you win.',
 'Growth strategy without honest diagnosis is just ambition. We start with where the business actually is — not where leadership assumes it is — then work from that baseline to define the strategic priorities that will move the needle.',
 '<p>We work with leadership teams to build a clear, prioritised growth strategy — one that reflects the real shape of your business, your market, and your team''s capacity to execute. The result isn''t a presentation. It''s a direction with enough specificity to act on.</p>
<p>The output of a growth strategy engagement is a clear, prioritised roadmap: which markets and segments to focus on, where to invest, what to de-prioritise, and what the growth engine should look like 12–24 months out. Simple enough to communicate, specific enough to act on.</p>',
 '["Current-state diagnostic and growth gap analysis", "Market and segment prioritisation", "Revenue stream review and opportunity sizing", "Strategic roadmap with 12–24 month priorities", "Executive alignment and communication framework"]',
 'Chart', 2, true),

('positioning-value-proposition',
 'Positioning & Value Proposition',
 'strategy',
 'Make what you offer impossible to ignore.',
 'Unclear positioning is the single most common reason good businesses grow slowly. Prospects don''t understand what makes you different. Sales teams can''t articulate the value. And marketing pushes volume into a message that doesn''t land.',
 '<p>We help you define what makes you genuinely different and relevant to the people who matter most — then build the language and frameworks to express it consistently across every touchpoint.</p>
<p>Strong positioning doesn''t just improve marketing. It sharpens product decisions, focuses sales conversations, and gives leadership a clearer basis for making trade-offs. It is foundational work that multiplies the impact of everything downstream.</p>',
 '["Brand and offer positioning framework", "Value proposition design for key segments", "Messaging hierarchy and language guide", "Offer-market fit review", "Competitive differentiation map"]',
 'Target', 3, true),

('go-to-market-planning',
 'Go-to-Market Planning',
 'strategy',
 'Translate strategy into a launch worth executing.',
 'A strategy without a go-to-market plan is an intention. Most businesses have a direction — they''re missing the structured plan that connects that direction to the sales and marketing activity that will actually generate revenue.',
 '<p>We develop practical GTM plans for product launches, market entries, and new segment pushes. Built around what your team can actually execute, not an idealised version of what a plan should look like.</p>
<p>The work covers channel selection, sequencing, sales motion design, and the performance indicators that will tell you whether the launch is working — before it''s too late to adjust.</p>',
 '["GTM framework and channel prioritisation", "Launch sequencing and milestone map", "Sales motion and lead handling design", "Marketing and sales alignment plan", "Early performance indicators and review cadence"]',
 'Trend', 4, true),

('commercial-strategy',
 'Commercial Strategy',
 'strategy',
 'Sharpen the commercial engine behind growth.',
 'Growth problems are rarely solved by marketing alone. In most businesses, the real constraint is in the commercial structure — how opportunities are identified, qualified, handled, and converted. We look at the full commercial picture, not just the top of the funnel.',
 '<p>We audit the end-to-end commercial journey — from how leads are generated and qualified to how proposals are structured and deals are closed. We identify the specific points of breakdown and design the fixes that make the biggest difference.</p>
<p>This isn''t theoretical consulting. We work through the actual mechanics of your pipeline, your team, and your conversion data to find what''s limiting growth and build a more effective commercial system around it.</p>',
 '["Commercial journey audit and conversion analysis", "Pipeline logic and lead qualification design", "Sales process and handoff optimisation", "Proposal and presentation structure", "Commercial performance metrics framework"]',
 'Scale', 5, true),

-- ── B. ENABLEMENT ────────────────────────────────────────────────────────────

('team-capability-building',
 'Team & Capability Building',
 'enablement',
 'Build the team behind the strategy.',
 'A strategy that outpaces the team executing it is a strategy that stalls. The most common failure mode we see isn''t poor planning — it''s a gap between what the plan demands and what the organisation can deliver. We close that gap.',
 '<p>We help companies define the right team structure for the next phase of growth, assess where capability gaps are limiting execution, and build the plans — for hiring, training, and role clarity — that make the strategy executable.</p>
<p>This isn''t an HR exercise. It''s a commercial decision. The right team structure, with the right skills and clear ownership, is what converts a strategy into consistent, measurable results.</p>',
 '["Team structure design and role definition", "Capability gap assessment against strategy", "Hiring priorities and candidate profile development", "Onboarding and development plans", "Performance management framework"]',
 'Team', 6, true),

('workshops-strategic-sessions',
 'Workshops & Strategic Sessions',
 'enablement',
 'Align the room. Move the decision.',
 'Most leadership teams have more information and insight than they give themselves credit for. What they lack is a structured environment to surface it, challenge it, and convert it into a decision the whole team will act on.',
 '<p>We design and facilitate working sessions that cut through the noise and produce real output. Not another brainstorm. A focused, structured process with a clear brief, the right participants, and a deliberate methodology.</p>
<p>We run sessions for leadership alignment, go-to-market planning, positioning work, and quarterly reviews. Each one is designed from scratch around what the team actually needs to resolve — not a template recycled from a previous engagement.</p>',
 '["Pre-session diagnostic and brief development", "Leadership alignment and strategic planning sessions", "Go-to-market and positioning workshops", "Cross-functional team alignment sessions", "Session documentation and decision register"]',
 'Users', 7, true),

('operating-systems-frameworks',
 'Operating Systems & Decision Frameworks',
 'enablement',
 'Replace chaos with systems that compound.',
 'Unclear planning processes, inconsistent reporting, and ad-hoc decision-making are symptoms of businesses that have grown faster than their operating infrastructure. The result is wasted effort, missed signals, and a leadership team that spends too much time managing rather than deciding.',
 '<p>We design the internal operating systems that remove friction and create the conditions for consistent execution. Planning rhythms, reporting structures, decision-making frameworks, and KPI architectures that give teams clarity and leadership the visibility they need.</p>
<p>Simple enough that people actually use them. Rigorous enough that they hold under pressure. Designed around how your business actually operates — not imposed from a generic playbook.</p>',
 '["Operating rhythm and planning cycle design", "Reporting structure and dashboard framework", "KPI architecture and performance indicators", "Decision-making process and escalation framework", "Internal workflow and cross-team coordination design"]',
 'Ops', 8, true),

-- ── C. EXECUTION SUPPORT ─────────────────────────────────────────────────────

('marketing-management-support',
 'Marketing Management Support',
 'execution',
 'Strategic oversight over execution.',
 'Many businesses have the marketing activity — agencies, freelancers, campaigns, content — but not the strategic layer above it that connects execution back to the growth plan. The result is activity that''s hard to evaluate and even harder to redirect.',
 '<p>We provide the strategic oversight layer that most growing businesses are missing. Not a replacement for your marketing team, but the direction, performance framework, and accountability structure that makes their work more effective.</p>
<p>We work with your marketing function on a retained basis — setting priorities, reviewing performance, directing agencies, and ensuring that the marketing effort is producing the commercial outcomes the business actually needs.</p>',
 '["Marketing strategy direction and priority-setting", "Campaign review and performance management", "Agency and freelancer briefing and coordination", "Monthly performance review and reporting", "Marketing-to-sales alignment and lead handoff design"]',
 'Growth', 9, true),

('sales-enablement-support',
 'Sales Enablement Support',
 'execution',
 'Strategy the sales team can actually use.',
 'Strategy that doesn''t translate into tools the sales team can use is strategy that stops at the whiteboard. We build the materials — decks, credentials, proposals, and messaging guides — that close the gap between the positioning work and the actual sales conversation.',
 '<p>Most sales teams are undersupported. They''re in front of clients with materials that don''t reflect the company''s actual positioning, pitching with slides that were built two years ago, or writing proposals from scratch every time.</p>
<p>We audit the full sales toolkit, identify the gaps, and build what''s missing. The output is a set of commercial materials that make the sales conversation easier to have and the close more likely.</p>',
 '["Sales presentation and pitch deck development", "Company credentials and case study materials", "Proposal structure and template development", "Product and service one-pagers", "Messaging guide for sales conversations"]',
 'Merge', 10, true),

('growth-execution-advisory',
 'Growth Execution Advisory',
 'execution',
 'From plan to disciplined action.',
 'Execution breaks down without accountability, clear priorities, and the discipline to review what''s working before it''s too late to adjust. We stay close to the work — not as observers, but as a partner in keeping the growth plan moving.',
 '<p>Growth Execution Advisory is our most embedded engagement model. We work alongside your leadership team on a sustained basis — tracking priorities, facilitating reviews, solving the problems that block momentum, and keeping commercial strategy connected to day-to-day decisions.</p>
<p>The value isn''t a deliverable. It''s the discipline of execution that most businesses struggle to maintain beyond the first 90 days of a new strategy. We provide the external accountability and strategic support that makes the difference between a plan that''s referenced and one that''s actually driving results.</p>',
 '["Weekly or bi-weekly execution reviews", "Priority tracking and accountability framework", "Cross-functional coordination support", "Blocker identification and problem-solving", "Quarterly strategic review and plan recalibration"]',
 'Transform', 11, true);
