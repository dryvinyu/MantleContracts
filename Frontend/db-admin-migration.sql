-- Migration: add metadata for type-specific application fields
-- Run this if asset_applications already exists
alter table asset_applications
  add column if not exists metadata jsonb;

alter table asset_applications
  add column if not exists onchain_asset_id text,
  add column if not exists onchain_tx_hash text;
