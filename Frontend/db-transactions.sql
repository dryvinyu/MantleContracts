-- ============================================
-- User Transaction Tables for RealFi Console
-- Run this after db.sql
-- ============================================

-- Transaction type enum
create type transaction_type as enum ('invest', 'redeem', 'yield_payout');

-- Transaction status enum
create type transaction_status as enum ('pending', 'confirmed', 'failed');

-- ============================================
-- User Transactions Table
-- ============================================
create table user_transactions (
  id uuid primary key default gen_random_uuid(),

  -- User info (wallet address based)
  wallet_address text not null,

  -- Asset info
  asset_id text references assets(id) on delete set null,
  asset_name text not null,

  -- Transaction details
  type transaction_type not null,
  amount numeric(18,6) not null,  -- Token amount / shares
  value_usd numeric(18,2) not null,  -- USD value at time of transaction
  price_per_unit numeric(18,6) not null,  -- Price per token/share

  -- Blockchain info
  tx_hash text unique,
  block_number bigint,
  chain_id int not null default 5003,  -- Mantle Sepolia

  -- Status
  status transaction_status not null default 'pending',

  -- Timestamps
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index user_transactions_wallet_idx on user_transactions (wallet_address);
create index user_transactions_asset_idx on user_transactions (asset_id);
create index user_transactions_type_idx on user_transactions (type);
create index user_transactions_status_idx on user_transactions (status);
create index user_transactions_created_idx on user_transactions (created_at desc);
create index user_transactions_tx_hash_idx on user_transactions (tx_hash);

-- ============================================
-- Trigger to update AUM on confirmed transactions
-- ============================================
create or replace function update_asset_aum()
returns trigger as $$
begin
  if new.status = 'confirmed' and (old.status is null or old.status != 'confirmed') then
    if new.type = 'invest' then
      update assets set aum_usd = aum_usd + new.value_usd where id = new.asset_id;
    elsif new.type = 'redeem' then
      update assets set aum_usd = greatest(0, aum_usd - new.value_usd) where id = new.asset_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger user_transactions_update_aum
after insert or update on user_transactions
for each row
execute function update_asset_aum();
