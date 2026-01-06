import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

// Server-side client with service role (full access)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Client-side client with anon key (RLS enforced)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type AssetType =
  | 'fixed-income'
  | 'real-estate'
  | 'private-credit'
  | 'alternatives'
export type AssetStatus = 'Active' | 'Maturing' | 'Paused'
export type AssetEventType = 'Deposit' | 'Withdraw' | 'Payout'

export interface DbAsset {
  id: string
  name: string
  type: AssetType
  apy: number
  duration_days: number
  risk_score: number
  yield_confidence: number
  aum_usd: number
  price: number
  status: AssetStatus
  next_payout_date: string
  description: string | null
  token_address: string | null
  distributor_address: string | null
  onchain_asset_id: string | null
  onchain_tx_hash: string | null
  last_synced_at: string | null
  created_at: string
  updated_at: string
}

export interface DbUser {
  id: string
  wallet_address: string | null
  kyc_status?: 'pending' | 'verified' | 'rejected'
  is_frozen?: boolean
  created_at: string
}

export interface DbPortfolio {
  user_id: string
  cash_usd: number
  last_updated: string
}

export interface DbPortfolioHolding {
  id: number
  user_id: string
  asset_id: string
  shares: number
  updated_at: string
}

export interface DbYieldBreakdown {
  id: number
  asset_id: string
  label: string
  percentage: number
  description: string | null
  impact: 'positive' | 'negative' | 'neutral'
}

export interface DbConfidenceFactor {
  id: number
  asset_id: string
  label: string
  score: number
  description: string | null
}

export interface DbRealWorldInfo {
  asset_id: string
  title: string
  summary: string | null
}

export interface DbRealWorldKeyFact {
  id: number
  asset_id: string
  label: string
  value: string
}

export interface DbRealWorldVerification {
  id: number
  asset_id: string
  item: string
}

export interface DbCashFlowSource {
  id: number
  asset_id: string
  source: string
  frequency: string
  description: string | null
}

export interface DbAssetEvent {
  id: number
  asset_id: string
  type: AssetEventType
  amount: number
  event_date: string
  tx_hash: string | null
}

export interface DbYieldHistory {
  id: number
  asset_id: string
  record_date: string
  yield_value: number
}

export interface DbNavHistory {
  id: number
  asset_id: string
  record_date: string
  nav_value: number
}

// ============================================
// Admin System Types
// ============================================

export type AdminRole = 'super_admin' | 'admin' | 'reviewer'
export type ApplicationStatus =
  | 'draft'
  | 'pending'
  | 'reviewing'
  | 'approved'
  | 'rejected'
  | 'changes_requested'
export type ReviewStage = 'initial' | 'compliance' | 'final'
export type ReviewDecision = 'approve' | 'reject' | 'request_changes'

export interface DbAdmin {
  id: string
  wallet_address: string
  role: AdminRole
  name: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DbAdminLog {
  id: number
  admin_id: string
  action: string
  target_type: string | null
  target_id: string | null
  details: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

export interface DbAssetApplication {
  id: string
  issuer_id: string
  name: string
  type: AssetType
  description: string | null
  expected_apy: number
  target_aum: number
  minimum_investment: number
  duration_days: number
  risk_score: number
  risk_factors: string[] | null
  legal_docs_hash: string | null
  audit_report_hash: string | null
  valuation_report_hash: string | null
  additional_docs: Record<string, string> | null
  token_address: string | null
  token_symbol: string | null
  status: ApplicationStatus
  current_stage: ReviewStage | null
  submitted_at: string | null
  reviewed_at: string | null
  approved_at: string | null
  rejected_at: string | null
  created_at: string
  updated_at: string
}

export interface DbAssetReview {
  id: string
  application_id: string
  reviewer_id: string
  stage: ReviewStage
  decision: ReviewDecision
  comments: string | null
  checklist: Record<string, boolean> | null
  created_at: string
}

// ============================================
// User Transaction Types
// ============================================

export type TransactionType = 'invest' | 'redeem' | 'yield_payout'
export type TransactionStatus = 'pending' | 'confirmed' | 'failed'

export interface DbUserTransaction {
  id: string
  wallet_address: string
  asset_id: string | null
  asset_name: string
  type: TransactionType
  amount: number
  value_usd: number
  price_per_unit: number
  tx_hash: string | null
  block_number: number | null
  chain_id: number
  status: TransactionStatus
  created_at: string
  confirmed_at: string | null
}
