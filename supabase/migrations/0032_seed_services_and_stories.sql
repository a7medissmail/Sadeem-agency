-- 0032_seed_services_and_stories.sql
-- One-shot, idempotent launch seed: fully populates the public Services page and
-- Success Stories so the site is publishable in one paste. Safe to run multiple
-- times. Self-contained: creates the tables/policies if a prior migration
-- (0012 / 0024 / 0025) was never applied to this database, then upserts content.
--
-- NOTE: case-study numbers are illustrative launch placeholders — replace with
-- real figures from the actual engagements when available. Stories are anonymized.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Tables (defensive — no-ops if they already exist)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.service_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  label       text not null,
  tagline     text,
  description text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.services (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  category     text not null,
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

create table if not exists public.success_stories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  client_name text,
  industry text,
  summary text,
  challenge text,
  solution text,
  results text,
  body text,
  image_url text,
  metric_value text,
  metric_label text,
  sort_order int not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RLS + policies (idempotent)
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.service_categories enable row level security;
alter table public.services           enable row level security;
alter table public.success_stories    enable row level security;

drop policy if exists "Public read service categories" on public.service_categories;
create policy "Public read service categories"
  on public.service_categories for select using (true);

drop policy if exists "Admins manage service categories" on public.service_categories;
create policy "Admins manage service categories"
  on public.service_categories for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor')));

drop policy if exists "Public read published services" on public.services;
create policy "Public read published services"
  on public.services for select using (is_published = true);

drop policy if exists "Admins manage services" on public.services;
create policy "Admins manage services"
  on public.services for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor')));

drop policy if exists "success_stories_public_read_published" on public.success_stories;
create policy "success_stories_public_read_published"
  on public.success_stories for select using (is_published = true);

drop policy if exists "success_stories_staff_all" on public.success_stories;
create policy "success_stories_staff_all"
  on public.success_stories for all
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- updated_at triggers (idempotent)
drop trigger if exists service_categories_updated_at on public.service_categories;
create trigger service_categories_updated_at
  before update on public.service_categories
  for each row execute function public.set_updated_at();

drop trigger if exists services_updated_at on public.services;
create trigger services_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

drop trigger if exists set_success_stories_updated_at on public.success_stories;
create trigger set_success_stories_updated_at
  before update on public.success_stories
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Categories (3 pillars)
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.service_categories (slug, label, tagline, description, sort_order) values
('strategy',   'Strategy',          'Clarity before action',
 'The decisions you make before you act determine everything that follows. We bring clarity to the questions that matter most — which markets to pursue, where you are genuinely differentiated, and what a growth strategy the whole team can execute actually looks like.', 1),
('enablement', 'Enablement',        'Capability that compounds',
 'Strategy only works when the people, systems, and tools behind it are ready to execute. We build the internal capability — structure, skills, frameworks, and operating rhythm — that makes your direction stick beyond the planning room.', 2),
('execution',  'Execution Support', 'Discipline that delivers',
 'Most growth plans stall not from poor strategy, but from execution that loses focus. We stay close to the work — providing strategic oversight, hands-on marketing management, and the coordination discipline that keeps the plan moving and measurable.', 3)
on conflict (slug) do update set
  label = excluded.label, tagline = excluded.tagline,
  description = excluded.description, sort_order = excluded.sort_order, updated_at = now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Services (11 existing, re-published + 3 new in buyer language)
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.services
  (slug, title, category, tagline, intro, body, deliverables, icon_key, sort_order, is_published)
values

-- ── A. STRATEGY ──────────────────────────────────────────────────────────────
('market-competitive-analysis', 'Market & Competitive Analysis', 'strategy',
 'See clearly before you move.',
 'Before you invest in repositioning, a new market, or a significant go-to-market push, you need a clear view of the landscape. Most companies act on assumptions that feel solid but haven''t been tested. We replace those assumptions with structured market intelligence.',
 '<p>Our market and competitive analysis work covers the full commercial picture — category dynamics, competitor positioning, customer decision drivers, and the whitespace where real differentiation is possible.</p><p>The output is a clear, actionable read of the market — a focused brief that tells you where you stand, who you''re really competing with, and where the opportunity to win is most real.</p>',
 '["Market mapping and category dynamics", "Competitor positioning and messaging audit", "Customer behaviour and decision-driver analysis", "Whitespace and opportunity identification", "Strategic implications and recommended priorities"]',
 'Globe', 1, true),

('business-growth-strategy', 'Business & Growth Strategy', 'strategy',
 'Define where you play and how you win.',
 'Growth strategy without honest diagnosis is just ambition. We start with where the business actually is — not where leadership assumes it is — then define the strategic priorities that will move the needle.',
 '<p>We work with leadership teams to build a clear, prioritised growth strategy that reflects the real shape of your business, your market, and your team''s capacity to execute. The result isn''t a presentation — it''s a direction with enough specificity to act on.</p><p>The output is a prioritised roadmap: which markets and segments to focus on, where to invest, what to de-prioritise, and what the growth engine should look like 12–24 months out.</p>',
 '["Current-state diagnostic and growth gap analysis", "Market and segment prioritisation", "Revenue stream review and opportunity sizing", "Strategic roadmap with 12–24 month priorities", "Executive alignment and communication framework"]',
 'Chart', 2, true),

('positioning-value-proposition', 'Positioning & Value Proposition', 'strategy',
 'Make what you offer impossible to ignore.',
 'Unclear positioning is the single most common reason good businesses grow slowly. Prospects don''t understand what makes you different, sales teams can''t articulate the value, and marketing pushes volume into a message that doesn''t land.',
 '<p>We help you define what makes you genuinely different and relevant to the people who matter most — then build the language and frameworks to express it consistently across every touchpoint.</p><p>Strong positioning sharpens product decisions, focuses sales conversations, and gives leadership a clearer basis for trade-offs. It is foundational work that multiplies the impact of everything downstream.</p>',
 '["Brand and offer positioning framework", "Value proposition design for key segments", "Messaging hierarchy and language guide", "Offer-market fit review", "Competitive differentiation map"]',
 'Target', 3, true),

('go-to-market-planning', 'Go-to-Market Planning', 'strategy',
 'Translate strategy into a launch worth executing.',
 'A strategy without a go-to-market plan is an intention. Most businesses have a direction — they''re missing the structured plan that connects it to the activity that will actually generate revenue.',
 '<p>We develop practical GTM plans for product launches, market entries, and new segment pushes — built around what your team can actually execute. The work covers channel selection, sequencing, sales motion design, and the indicators that tell you whether the launch is working before it''s too late to adjust.</p>',
 '["GTM framework and channel prioritisation", "Launch sequencing and milestone map", "Sales motion and lead handling design", "Marketing and sales alignment plan", "Early performance indicators and review cadence"]',
 'Trend', 4, true),

('commercial-strategy', 'Commercial Strategy', 'strategy',
 'Sharpen the commercial engine behind growth.',
 'Growth problems are rarely solved by marketing alone. In most businesses the real constraint is in the commercial structure — how opportunities are identified, qualified, handled, and converted.',
 '<p>We audit the end-to-end commercial journey — from how leads are generated and qualified to how proposals are structured and deals closed — and design the fixes that make the biggest difference. We work through the actual mechanics of your pipeline, your team, and your conversion data.</p>',
 '["Commercial journey audit and conversion analysis", "Pipeline logic and lead qualification design", "Sales process and handoff optimisation", "Proposal and presentation structure", "Commercial performance metrics framework"]',
 'Scale', 5, true),

('ecommerce-growth', 'E-commerce Growth', 'strategy',
 'A profitable, repeatable engine for D2C and online brands.',
 'For e-commerce and D2C brands scaling revenue faster than profit. We rebuild the unit economics, the channel mix, the on-site conversion, and the retention so growth actually compounds — instead of buying revenue you can''t measure.',
 '<p>Online brands often scale spend before they can see margin, then wonder why growth doesn''t translate into profit. We start with the real unit economics — CAC, LTV, and contribution margin after returns and shipping — and rebuild the engine from there.</p><p>The work spans acquisition channel mix, on-site conversion, and the retention and repeat-purchase flows that quietly hold most of the profit. The output is a 90-day growth roadmap your team can run. (The hands-on version is our e-commerce workshop.)</p>',
 '["Unit-economics and margin model", "Acquisition channel mix and plan", "On-site conversion improvements", "Retention and repeat-purchase system", "90-day e-commerce growth roadmap"]',
 'Growth', 6, true),

-- ── B. ENABLEMENT ────────────────────────────────────────────────────────────
('team-capability-building', 'Team & Capability Building', 'enablement',
 'Build the team behind the strategy.',
 'A strategy that outpaces the team executing it is a strategy that stalls. The most common failure mode isn''t poor planning — it''s a gap between what the plan demands and what the organisation can deliver. We close that gap.',
 '<p>We help companies define the right team structure for the next phase of growth, assess where capability gaps are limiting execution, and build the plans — for hiring, training, and role clarity — that make the strategy executable. It''s a commercial decision, not an HR exercise.</p>',
 '["Team structure design and role definition", "Capability gap assessment against strategy", "Hiring priorities and candidate profile development", "Onboarding and development plans", "Performance management framework"]',
 'Team', 7, true),

('workshops-strategic-sessions', 'Workshops & Strategic Sessions', 'enablement',
 'Align the room. Move the decision.',
 'Most leadership teams have more insight than they give themselves credit for. What they lack is a structured environment to surface it, challenge it, and convert it into a decision the whole team will act on.',
 '<p>We design and facilitate working sessions that produce real output — not another brainstorm. A focused process with a clear brief, the right participants, and a deliberate methodology. We run sessions for leadership alignment, go-to-market planning, positioning work, and quarterly reviews, each designed around what the team actually needs to resolve.</p>',
 '["Pre-session diagnostic and brief development", "Leadership alignment and strategic planning sessions", "Go-to-market and positioning workshops", "Cross-functional team alignment sessions", "Session documentation and decision register"]',
 'Users', 8, true),

('operating-systems-frameworks', 'Operating Systems & Decision Frameworks', 'enablement',
 'Replace chaos with systems that compound.',
 'Unclear planning, inconsistent reporting, and ad-hoc decision-making are symptoms of businesses that have grown faster than their operating infrastructure. The result is wasted effort, missed signals, and leadership that spends too much time managing rather than deciding.',
 '<p>We design the internal operating systems that remove friction and create the conditions for consistent execution — planning rhythms, reporting structures, decision frameworks, and KPI architectures. Simple enough that people actually use them, rigorous enough that they hold under pressure.</p>',
 '["Operating rhythm and planning cycle design", "Reporting structure and dashboard framework", "KPI architecture and performance indicators", "Decision-making process and escalation framework", "Internal workflow and cross-team coordination design"]',
 'Ops', 9, true),

-- ── C. EXECUTION SUPPORT ─────────────────────────────────────────────────────
('marketing-management-support', 'Marketing Management Support', 'execution',
 'Strategic oversight over execution.',
 'Many businesses have the marketing activity — agencies, freelancers, campaigns, content — but not the strategic layer above it that connects execution back to the growth plan. The result is activity that''s hard to evaluate and harder to redirect.',
 '<p>We provide the strategic oversight layer most growing businesses are missing — not a replacement for your marketing team, but the direction, performance framework, and accountability that makes their work more effective. We work on a retained basis: setting priorities, reviewing performance, directing agencies, and ensuring the effort produces the commercial outcomes the business needs.</p>',
 '["Marketing strategy direction and priority-setting", "Campaign review and performance management", "Agency and freelancer briefing and coordination", "Monthly performance review and reporting", "Marketing-to-sales alignment and lead handoff design"]',
 'Growth', 10, true),

('performance-marketing-media', 'Performance Marketing & Media', 'execution',
 'Media buying that answers to your P&L — not just ROAS.',
 'Paid search, social, and marketplace media — planned and run against contribution margin, not vanity ROAS. We build the channel portfolio, the testing system, and the rules for when to scale and when to stop, then run it or oversee whoever does. If you came looking for media buying, this is the difference: we make the spend accountable to the business, not just the dashboard.',
 '<p>Most media spend is optimised to ROAS — a number that hides returns, discounts, and true margin. We rebuild the picture around contribution margin and lifetime value, so every channel is judged on the profit it actually creates.</p><p>We structure campaigns, run a disciplined testing framework for creative and offers, and set clear stop/scale rules. We can run the media directly or sit above your existing buyers and agencies — but either way the spend is connected to a commercial outcome and reviewed every week.</p>',
 '["Channel strategy and budget allocation", "Campaign structure and testing framework", "Creative and offer testing system", "Stop/scale rules tied to margin", "Weekly performance reporting and review"]',
 'Trend', 11, true),

('digital-marketing-management', 'Digital Marketing Management', 'execution',
 'We run your growth engine month to month — and own the outcome with you.',
 'A monthly partnership for brands that want senior operators running marketing, not just advising on it. We own — or oversee — performance, content, and lifecycle against one set of targets, with a weekly review you sit in. A managed-growth retainer built as a system, with accountability, not hours on an ad account.',
 '<p>This is our managed-growth model. A senior operator becomes your point of contact and runs the marketing engine: a monthly plan, the channels that pay back, the content and lifecycle flows, and one scorecard everyone reviews together.</p><p>Best for brands with real revenue and the will to run a system. Not for buyers shopping purely on the lowest hourly media-buying rate — we compete on outcomes, not price per hour.</p>',
 '["Monthly growth plan and targets", "Performance and media management or oversight", "Content and lifecycle execution", "Weekly operating review and scorecard", "A senior operator as your point of contact"]',
 'Ops', 12, true),

('sales-enablement-support', 'Sales Enablement Support', 'execution',
 'Strategy the sales team can actually use.',
 'Strategy that doesn''t translate into tools the sales team can use is strategy that stops at the whiteboard. We build the materials — decks, credentials, proposals, and messaging guides — that close the gap between positioning and the actual sales conversation.',
 '<p>Most sales teams are undersupported — in front of clients with materials that don''t reflect the company''s positioning, or writing proposals from scratch every time. We audit the full sales toolkit, identify the gaps, and build what''s missing, so the conversation is easier to have and the close more likely.</p>',
 '["Sales presentation and pitch deck development", "Company credentials and case study materials", "Proposal structure and template development", "Product and service one-pagers", "Messaging guide for sales conversations"]',
 'Merge', 13, true),

('growth-execution-advisory', 'Growth Execution Advisory', 'execution',
 'From plan to disciplined action.',
 'Execution breaks down without accountability, clear priorities, and the discipline to review what''s working before it''s too late to adjust. We stay close to the work — not as observers, but as a partner in keeping the growth plan moving.',
 '<p>This is our most embedded model. We work alongside your leadership on a sustained basis — tracking priorities, facilitating reviews, solving the problems that block momentum, and keeping strategy connected to day-to-day decisions.</p><p>The value isn''t a deliverable — it''s the discipline of execution most businesses struggle to maintain beyond the first 90 days of a new strategy.</p>',
 '["Weekly or bi-weekly execution reviews", "Priority tracking and accountability framework", "Cross-functional coordination support", "Blocker identification and problem-solving", "Quarterly strategic review and plan recalibration"]',
 'Transform', 14, true)

on conflict (slug) do update set
  title = excluded.title, category = excluded.category, tagline = excluded.tagline,
  intro = excluded.intro, body = excluded.body, deliverables = excluded.deliverables,
  icon_key = excluded.icon_key, sort_order = excluded.sort_order,
  is_published = excluded.is_published, updated_at = now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Success stories (anonymized; numbers are launch placeholders — replace with real)
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.success_stories
  (slug, title, client_name, industry, summary, challenge, solution, results, body, metric_value, metric_label, sort_order, is_published)
values

('scattered-demand-to-predictable-growth',
 'From scattered demand to predictable growth', null, 'Beauty & personal care',
 'A Cairo D2C beauty brand was scaling revenue but losing the plot on profit. We replaced reactive ad-buying and fragmented reporting with a growth system that made demand, margin, and execution measurable week by week.',
 'The brand was growing on paid social, but blended ROAS hid the truth: several "winning" campaigns were unprofitable after returns and discounts. Reporting lived in three places, no one owned the number, and every month felt like starting over.',
 'We ran a growth diagnostic, then built the engine: a contribution-margin model that priced in COGS, shipping, and returns; a channel portfolio with stop/scale rules tied to margin; rebuilt email and WhatsApp retention flows; and a single weekly growth review the founder now leads. We managed the media for four months, then handed the system to the in-house team.',
 'Within six months the brand could see true profit per channel and cut 22% of spend that was quietly losing money. Contribution margin improved by 34%, repeat-purchase rate rose from 19% to 31%, and growth became something the team could forecast instead of hope for.',
 '<p>Scaling spend before you can see margin is scaling a leak. Once the brand could read profit per channel every week, the decisions got simple — and the growth got durable.</p>',
 '+34%', 'contribution margin', 1, true),

('ksa-market-entry-that-launched',
 'A market entry that actually launched', null, 'On-demand services',
 'An Egyptian services company wanted into Saudi but kept stalling on planning. We built the go-to-market — segments, pricing, channels, and a launch runbook — and stood up the operating rhythm that took it live in KSA.',
 'Strong ambition, no operating plan. The product worked in Egypt, but the team couldn''t say how it would land in Riyadh — pricing, demand channels, supply, or local nuance. Every planning cycle produced another deck and no launch date.',
 'A focused strategic project: KSA segmentation and pricing, localised positioning, a channel plan built for the Saudi market, and a launch runbook with owners and milestones. We then ran the operating cadence through go-live, so the launch had a control room instead of a group chat.',
 'The company launched in Riyadh in nine weeks and reached a profitable acquisition channel within four months. Three cities were live by month six, with a repeatable playbook the local team now owns.',
 '<p>A market entry isn''t a strategy problem at the end — it''s an operating problem. The plan only mattered because someone owned the rhythm that turned it into a launch.</p>',
 '4', 'months to a profitable channel', 2, true),

('strategy-deck-into-growth-motion',
 'Turning a strategy deck into a growth motion', null, 'Healthtech',
 'A funded Egyptian healthtech had a board mandate to grow efficiently and a strategy that lived on slides. We turned it into a measurable GTM motion — a demand engine, a dashboard leadership trusts, and a weekly rhythm.',
 'Plenty of strategy, no system to execute it. The growth team was spread across too many channels, couldn''t defend the budget with clean numbers, and needed a win the board could see. CAC was rising and no one could say exactly why.',
 'A growth partnership: we rebuilt the funnel and tracking, focused spend on the two channels that paid back, installed a CAC/LTV dashboard, and ran a weekly growth review. Content and lifecycle were rebuilt to carry more of the load so paid didn''t have to.',
 'Over two quarters, CAC fell 41%, qualified pipeline rose 63%, and the growth team walked into the board with one dashboard instead of five spreadsheets.',
 '<p>Efficient growth is a measurement problem before it''s a spending problem. Once the team could see which channel paid back, the budget defended itself.</p>',
 '-41%', 'CAC in two quarters', 3, true),

('brand-and-demand-engine-together',
 'Building the brand and the demand engine together', null, 'Consumer retail',
 'A consumer brand expanding from Egypt into the Gulf was treating brand and performance as separate worlds. We rebuilt them as one flywheel — sharper positioning feeding a measurable demand engine — and grew revenue across both markets.',
 'The brand looked good but converted inconsistently, and the Gulf audience didn''t connect with messaging built for Egypt. Performance and creative teams worked in silos; spend went up while efficiency went down.',
 'We sharpened positioning and messaging for the Gulf, rebuilt the creative-to-performance loop so winning angles fed the media plan, localised the funnel, and put one scorecard across brand and demand. We oversaw the existing agencies rather than replacing them — on our strategy and briefs.',
 'Revenue grew 47% across Egypt and the Gulf over twelve months, blended CAC dropped 29%, and creative win-rate improved because briefs were finally tied to performance data.',
 '<p>Brand and performance aren''t a trade-off — run them as one flywheel. The creative got better because it was finally accountable to the numbers, and the numbers got better because the creative was on-strategy.</p>',
 '+47%', 'revenue in 12 months', 4, true)

on conflict (slug) do update set
  title = excluded.title, client_name = excluded.client_name, industry = excluded.industry,
  summary = excluded.summary, challenge = excluded.challenge, solution = excluded.solution,
  results = excluded.results, body = excluded.body, metric_value = excluded.metric_value,
  metric_label = excluded.metric_label, sort_order = excluded.sort_order,
  is_published = excluded.is_published, updated_at = now();
