-- ============================================================
-- 0022_quotations.sql
-- Full quotation system: quotations + line items
-- Linked to proposals; separate magic-link for client portal /q/[token]
-- ============================================================

-- ── Quotation status type ─────────────────────────────────────────────────────

create type public.quotation_status as enum (
  'draft',       -- being built by admin
  'sent',        -- magic link delivered to client
  'viewed',      -- client opened the portal
  'accepted',    -- client accepted digitally
  'declined',    -- client declined
  'expired',     -- validity window passed
  'superseded'   -- a newer quote replaced this one
);

-- ── Quotations ────────────────────────────────────────────────────────────────

create table if not exists public.quotations (
  id            uuid primary key default gen_random_uuid(),
  proposal_id   uuid references public.proposals(id) on delete cascade,
  title         text not null,
  intro_text    text,                          -- narrative paragraph above line items
  currency      text not null default 'SAR',
  validity_days int  not null default 30,

  -- pricing (all stored, totals recomputed on any item change)
  subtotal      numeric(12,2) not null default 0,
  discount_pct  numeric(5,2)  not null default 0,  -- 0–100
  tax_pct       numeric(5,2)  not null default 0,  -- e.g. 15 for VAT
  total         numeric(12,2) not null default 0,

  -- access
  token_hash    text unique,
  token_prefix  text,

  -- lifecycle
  status        public.quotation_status not null default 'draft',
  sent_at       timestamptz,
  viewed_at     timestamptz,
  accepted_at   timestamptz,
  declined_at   timestamptz,
  decline_reason text,

  -- meta
  notes         text,                          -- internal-only notes
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Quotation line items ──────────────────────────────────────────────────────

create table if not exists public.quotation_items (
  id             uuid primary key default gen_random_uuid(),
  quotation_id   uuid not null references public.quotations(id) on delete cascade,
  sort_order     int  not null default 0,
  name           text not null,
  description    text,
  quantity       numeric(10,2) not null default 1,
  unit           text,                          -- 'month', 'session', 'day', 'flat', etc.
  unit_price     numeric(12,2) not null default 0,
  total          numeric(12,2) not null default 0,
  created_at     timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

create index if not exists quotations_proposal_id_idx on public.quotations(proposal_id);
create index if not exists quotations_token_hash_idx  on public.quotations(token_hash);
create index if not exists quotation_items_quotation_id_idx on public.quotation_items(quotation_id);

-- ── updated_at trigger ────────────────────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger quotations_updated_at
  before update on public.quotations
  for each row execute function public.touch_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table public.quotations       enable row level security;
alter table public.quotation_items  enable row level security;

-- Staff (service-role bypasses RLS; these are for anon/authenticated role)
create policy "staff can manage quotations"
  on public.quotations for all
  using  (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "staff can manage quotation_items"
  on public.quotation_items for all
  using  (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- No anon policy — portal reads via service-role admin client (token lookup)

-- ── Grant admin client access ─────────────────────────────────────────────────

grant all on public.quotations      to service_role;
grant all on public.quotation_items to service_role;
