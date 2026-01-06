-- User Balance Tables for RWA Recharge Feature
-- Run this in Supabase SQL Editor

-- User balances table
create table if not exists user_balances (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null unique,
  rwa_balance numeric(18,6) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Balance transactions table (recharge/withdraw history)
create table if not exists balance_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  type text not null check (type in ('recharge', 'withdraw', 'invest', 'redeem')),
  amount numeric(18,6) not null,
  source_token text,
  source_amount numeric(18,6),
  tx_hash text,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_user_balances_wallet on user_balances(wallet_address);
create index if not exists idx_balance_transactions_wallet on balance_transactions(wallet_address);
create index if not exists idx_balance_transactions_created on balance_transactions(created_at desc);

-- Enable RLS
alter table user_balances enable row level security;
alter table balance_transactions enable row level security;

-- RLS Policies for user_balances
create policy "Users can view their own balance" on user_balances
  for select using (true);

create policy "Service role can manage balances" on user_balances
  for all using (auth.role() = 'service_role');

-- RLS Policies for balance_transactions
create policy "Users can view their own transactions" on balance_transactions
  for select using (true);

create policy "Service role can manage transactions" on balance_transactions
  for all using (auth.role() = 'service_role');
