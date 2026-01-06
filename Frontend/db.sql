-- enums
create type asset_type as enum ('fixed-income', 'real-estate', 'private-credit', 'alternatives');
create type asset_status as enum ('Active', 'Maturing', 'Paused');
create type asset_event_type as enum ('Deposit', 'Withdraw', 'Payout');
create type kyc_status as enum ('pending', 'verified', 'rejected');

-- users (local pg)
create table users (
  id uuid primary key default gen_random_uuid(),
  wallet_address text unique,
  kyc_status kyc_status not null default 'pending',
  is_frozen boolean not null default false,
  created_at timestamptz not null default now()
);

create index users_wallet_address_idx on users (wallet_address);

-- assets
create table assets (
  id text primary key,
  name text not null,
  type asset_type not null,
  apy numeric(6,2) not null check (apy >= 0),
  duration_days int not null check (duration_days > 0),
  risk_score int not null check (risk_score >= 0 and risk_score <= 100),
  yield_confidence int not null check (yield_confidence >= 0 and yield_confidence <= 100),
  aum_usd numeric(18,2) not null check (aum_usd >= 0),
  price numeric(18,2) not null check (price >= 0),
  status asset_status not null,
  next_payout_date date not null,
  description text,
  token_address text,
  distributor_address text,
  onchain_asset_id text,
  onchain_tx_hash text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index assets_type_idx on assets (type);
create index assets_status_idx on assets (status);
create index assets_apy_idx on assets (apy);
create index assets_risk_idx on assets (risk_score);

-- yield breakdown
create table asset_yield_breakdowns (
  id bigserial primary key,
  asset_id text not null references assets(id) on delete cascade,
  label text not null,
  percentage numeric(5,2) not null check (percentage >= 0 and percentage <= 100),
  description text,
  impact text not null check (impact in ('positive', 'negative', 'neutral'))
);

create index asset_yield_breakdowns_asset_idx on asset_yield_breakdowns (asset_id);

-- confidence factors
create table asset_confidence_factors (
  id bigserial primary key,
  asset_id text not null references assets(id) on delete cascade,
  label text not null,
  score int not null check (score >= 0 and score <= 100),
  description text
);

create index asset_confidence_factors_asset_idx on asset_confidence_factors (asset_id);

-- real world info (1:1)
create table asset_real_world_info (
  asset_id text primary key references assets(id) on delete cascade,
  title text not null,
  summary text
);

create table asset_real_world_key_facts (
  id bigserial primary key,
  asset_id text not null references assets(id) on delete cascade,
  label text not null,
  value text not null
);

create table asset_real_world_verifications (
  id bigserial primary key,
  asset_id text not null references assets(id) on delete cascade,
  item text not null
);

-- cash flow sources
create table asset_cash_flow_sources (
  id bigserial primary key,
  asset_id text not null references assets(id) on delete cascade,
  source text not null,
  frequency text not null,
  description text
);

-- events
create table asset_events (
  id bigserial primary key,
  asset_id text not null references assets(id) on delete cascade,
  type asset_event_type not null,
  amount numeric(18,2) not null check (amount >= 0),
  event_date date not null,
  tx_hash text
);

create index asset_events_asset_idx on asset_events (asset_id);
create index asset_events_date_idx on asset_events (event_date);

-- yield history (daily)
create table asset_yield_history (
  id bigserial primary key,
  asset_id text not null references assets(id) on delete cascade,
  record_date date not null,
  yield_value numeric(10,6) not null,
  unique (asset_id, record_date)
);

create index asset_yield_history_asset_idx on asset_yield_history (asset_id);
create index asset_yield_history_date_idx on asset_yield_history (record_date);

-- nav history (daily)
create table asset_nav_history (
  id bigserial primary key,
  asset_id text not null references assets(id) on delete cascade,
  record_date date not null,
  nav_value numeric(18,4) not null check (nav_value > 0),
  unique (asset_id, record_date)
);

create index asset_nav_history_asset_idx on asset_nav_history (asset_id);
create index asset_nav_history_date_idx on asset_nav_history (record_date);

-- portfolios (1 per user)
create table portfolios (
  user_id uuid primary key references users(id) on delete cascade,
  cash_usd numeric(18,2) not null default 0 check (cash_usd >= 0),
  last_updated timestamptz not null default now()
);

-- holdings
create table portfolio_holdings (
  id bigserial primary key,
  user_id uuid not null references portfolios(user_id) on delete cascade,
  asset_id text not null references assets(id) on delete cascade,
  shares numeric(18,6) not null default 0 check (shares >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, asset_id)
);

create index portfolio_holdings_user_idx on portfolio_holdings (user_id);
create index portfolio_holdings_asset_idx on portfolio_holdings (asset_id);

create index asset_real_world_key_facts_asset_idx on asset_real_world_key_facts (asset_id);
create index asset_real_world_verifications_asset_idx on asset_real_world_verifications (asset_id);
create index asset_cash_flow_sources_asset_idx on asset_cash_flow_sources (asset_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger assets_set_updated_at
before update on assets
for each row
execute function set_updated_at();

create trigger portfolio_holdings_set_updated_at
before update on portfolio_holdings
for each row
execute function set_updated_at();
