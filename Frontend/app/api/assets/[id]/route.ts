import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params

  // Get wallet address from header (set by frontend)
  const walletAddress = request.headers.get('x-wallet-address')

  // Fetch asset
  const { data: asset, error: assetError } = await supabaseAdmin
    .from('assets')
    .select('*')
    .eq('id', id)
    .single()

  if (assetError || !asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  // Fetch related data in parallel
  const [
    { data: yieldBreakdowns },
    { data: confidenceFactors },
    { data: realWorldInfo },
    { data: keyFacts },
    { data: verifications },
    { data: cashFlowSources },
    { data: events },
    { data: yieldHistory },
    { data: navHistory },
  ] = await Promise.all([
    supabaseAdmin.from('asset_yield_breakdowns').select('*').eq('asset_id', id),
    supabaseAdmin
      .from('asset_confidence_factors')
      .select('*')
      .eq('asset_id', id),
    supabaseAdmin
      .from('asset_real_world_info')
      .select('*')
      .eq('asset_id', id)
      .single(),
    supabaseAdmin
      .from('asset_real_world_key_facts')
      .select('*')
      .eq('asset_id', id),
    supabaseAdmin
      .from('asset_real_world_verifications')
      .select('*')
      .eq('asset_id', id),
    supabaseAdmin
      .from('asset_cash_flow_sources')
      .select('*')
      .eq('asset_id', id),
    supabaseAdmin
      .from('asset_events')
      .select('*')
      .eq('asset_id', id)
      .order('event_date', { ascending: false })
      .limit(10),
    supabaseAdmin
      .from('asset_yield_history')
      .select('*')
      .eq('asset_id', id)
      .order('record_date', { ascending: true }),
    supabaseAdmin
      .from('asset_nav_history')
      .select('*')
      .eq('asset_id', id)
      .order('record_date', { ascending: true }),
  ])

  // Find user and their holdings
  let userPosition = { amount: 0, shares: 0 }

  if (walletAddress) {
    // Find user by wallet address
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single()

    if (user) {
      // Fetch user's holdings for this asset
      const { data: holding } = await supabaseAdmin
        .from('portfolio_holdings')
        .select('shares')
        .eq('user_id', user.id)
        .eq('asset_id', id)
        .single()

      if (holding) {
        const shares = Number(holding.shares)
        userPosition = {
          amount: shares * Number(asset.price),
          shares,
        }
      }
    }
  }

  // Transform asset data to frontend format
  const transformedAsset = {
    id: asset.id,
    name: asset.name,
    type: asset.type,
    apy: Number(asset.apy),
    durationDays: asset.duration_days,
    riskScore: asset.risk_score,
    yieldConfidence: asset.yield_confidence,
    yieldBreakdown: (yieldBreakdowns || []).map((yb) => ({
      label: yb.label,
      percentage: Number(yb.percentage),
      description: yb.description,
      impact: yb.impact as 'positive' | 'negative' | 'neutral',
    })),
    confidenceFactors: (confidenceFactors || []).map((cf) => ({
      label: cf.label,
      score: cf.score,
      description: cf.description,
    })),
    realWorld: realWorldInfo
      ? {
          title: realWorldInfo.title,
          summary: realWorldInfo.summary ?? '',
          keyFacts: (keyFacts || []).map((kf) => ({
            label: kf.label,
            value: kf.value,
          })),
          verification: (verifications || []).map((v) => v.item),
        }
      : null,
    aumUsd: Number(asset.aum_usd),
    price: Number(asset.price),
    status: asset.status,
    nextPayoutDate: asset.next_payout_date,
    yieldHistory: (yieldHistory || []).map((yh) => Number(yh.yield_value)),
    navHistory: (navHistory || []).map((nh) => Number(nh.nav_value)),
    description: asset.description,
    cashFlowSources: (cashFlowSources || []).map((cfs) => ({
      source: cfs.source,
      frequency: cfs.frequency,
      description: cfs.description,
    })),
    tokenAddress: asset.token_address,
    distributorAddress: asset.distributor_address,
    onchainAssetId: asset.onchain_asset_id || null,
    events: (events || []).map((e) => ({
      type: e.type,
      amount: Number(e.amount),
      date: e.event_date,
      txHash: e.tx_hash ?? '',
    })),
  }

  return NextResponse.json({ asset: transformedAsset, userPosition })
}
