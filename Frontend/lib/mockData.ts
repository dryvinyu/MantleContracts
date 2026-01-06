// ============ Type Definitions ============
export type AssetType =
  | 'fixed-income'
  | 'real-estate'
  | 'private-credit'
  | 'alternatives'
export type AssetStatus = 'Active' | 'Maturing' | 'Paused'
export type RiskLevel = 'Low' | 'Medium' | 'High'

export interface YieldBreakdownItem {
  label: string
  percentage: number
  description: string
  impact: 'positive' | 'negative' | 'neutral'
}

export interface ConfidenceFactor {
  label: string
  score: number
  description: string
}

export interface RealWorldInfo {
  title: string
  summary: string
  keyFacts: { label: string; value: string }[]
  verification: string[]
}

export interface Asset {
  id: string
  name: string
  type: AssetType
  apy: number
  durationDays: number
  riskScore: number
  yieldConfidence: number
  yieldBreakdown?: YieldBreakdownItem[]
  confidenceFactors?: ConfidenceFactor[]
  realWorld?: RealWorldInfo
  aumUsd: number
  price: number
  status: AssetStatus
  nextPayoutDate: string
  yieldHistory?: number[]
  navHistory?: number[]
  description?: string
  cashFlowSources?: {
    source: string
    frequency: string
    description: string
  }[]
  tokenAddress?: string
  distributorAddress?: string
  onchainAssetId?: string | null
  events?: {
    type: 'Deposit' | 'Withdraw' | 'Payout'
    amount: number
    date: string
    txHash: string
  }[]
}

export interface Portfolio {
  holdings: Record<string, number>
  cashUsd: number
  lastUpdated: string
}

// ============ Utility Functions ============
export const getRiskLevel = (score: number): RiskLevel => {
  if (score <= 20) return 'Low'
  if (score <= 45) return 'Medium'
  return 'High'
}

export const formatRwa = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M RWA`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K RWA`
  }
  return `${value.toFixed(2)} RWA`
}

export const formatCurrency = (value: number): string => formatRwa(value)

export const formatDuration = (days: number): string => {
  if (days >= 365) {
    const years = days / 365
    return years === 1 ? '1Y' : `${years.toFixed(1)}Y`
  }
  return `${days}D`
}

export const getAssetTypeLabel = (type: AssetType): string => {
  const labels: Record<AssetType, string> = {
    'fixed-income': 'Fixed Income',
    'real-estate': 'Real Estate',
    'private-credit': 'Private Credit',
    alternatives: 'Alternatives',
  }
  return labels[type]
}

export const getAssetTypeColor = (type: AssetType): string => {
  const colors: Record<AssetType, string> = {
    'fixed-income': 'bg-blue-500/20 text-blue-400',
    'real-estate': 'bg-purple-500/20 text-purple-400',
    'private-credit': 'bg-pink-500/20 text-pink-400',
    alternatives: 'bg-amber-500/20 text-amber-400',
  }
  return colors[type]
}

// Empty initial portfolio - should be fetched from API
export const initialPortfolio: Portfolio = {
  holdings: {},
  cashUsd: 0,
  lastUpdated: new Date().toISOString(),
}
