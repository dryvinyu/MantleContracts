-- ============================================
-- Admin System Tables for RealFi Console
-- Run this after db.sql
-- ============================================

-- Admin role enum
create type admin_role as enum ('super_admin', 'admin', 'reviewer');

-- Asset application status enum
create type application_status as enum ('draft', 'pending', 'reviewing', 'approved', 'rejected', 'changes_requested');

-- Review decision enum
create type review_decision as enum ('approve', 'reject', 'request_changes');

-- ============================================
-- Admins Table (直接通过钱包地址验证)
-- ============================================
create table admins (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null unique,
  role admin_role not null default 'reviewer',
  name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index admins_wallet_idx on admins (wallet_address);
create index admins_role_idx on admins (role);

-- ============================================
-- Admin Activity Logs
-- ============================================
create table admin_logs (
  id bigserial primary key,
  admin_id uuid not null references admins(id) on delete cascade,
  action text not null,
  target_type text,
  target_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index admin_logs_admin_idx on admin_logs (admin_id);
create index admin_logs_created_idx on admin_logs (created_at);

-- ============================================
-- Asset Applications
-- ============================================
create table asset_applications (
  id uuid primary key default gen_random_uuid(),

  -- Basic Info
  name text not null,
  type asset_type not null,
  description text,

  -- Financial Info
  expected_apy numeric(6,2) not null check (expected_apy >= 0),
  target_aum numeric(18,2) not null check (target_aum >= 0),
  minimum_investment numeric(18,2) not null default 100,
  duration_days int not null check (duration_days > 0),
  price numeric(18,2) not null default 1.00,

  -- Risk Info
  risk_score int not null check (risk_score >= 0 and risk_score <= 100),

  -- Token Info
  token_address text,
  token_symbol text,
  distributor_address text,

  -- Metadata (type-specific fields)
  metadata jsonb,

  -- On-chain registry info
  onchain_asset_id text,
  onchain_tx_hash text,

  -- Status
  status application_status not null default 'pending',

  -- Review Info
  reviewed_by uuid references admins(id),
  review_comments text,

  -- Timestamps
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index asset_applications_status_idx on asset_applications (status);
create index asset_applications_type_idx on asset_applications (type);

-- ============================================
-- Triggers
-- ============================================
create trigger admins_set_updated_at
before update on admins
for each row
execute function set_updated_at();

create trigger asset_applications_set_updated_at
before update on asset_applications
for each row
execute function set_updated_at();

-- ============================================
-- 插入初始管理员 (修改为你的钱包地址)
-- ============================================
-- insert into admins (wallet_address, role, name) values
--   ('0xYourWalletAddress', 'super_admin', 'Super Admin');
