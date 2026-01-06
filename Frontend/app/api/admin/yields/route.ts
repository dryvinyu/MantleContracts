import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const walletAddress = request.headers.get('x-wallet-address')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 401 },
      )
    }

    // Verify admin
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single()

    if (adminError || !admin || !admin.is_active) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get assets with yield info
    const { data: assets, error: assetsError } = await supabaseAdmin
      .from('assets')
      .select(`
        id,
        name,
        type,
        apy,
        next_payout_date
      `)
      .eq('status', 'Active')

    if (assetsError) {
      console.error('Error fetching assets:', assetsError)
      return NextResponse.json(
        { error: 'Failed to fetch assets' },
        { status: 500 },
      )
    }

    // Get investment stats for each asset
    const assetsWithYieldInfo = await Promise.all(
      (assets || []).map(async (asset) => {
        // Get total invested and investor count for this asset
        const { data: investments, error: invError } = await supabaseAdmin
          .from('investments')
          .select('user_id, amount')
          .eq('asset_id', asset.id)
          .eq('status', 'active')

        if (invError) {
          console.error(
            'Error fetching investments for asset:',
            asset.id,
            invError,
          )
        }

        const totalInvested =
          investments?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0
        const investorCount = new Set(
          investments?.map((inv) => inv.user_id) || [],
        ).size

        // Calculate pending yield based on APY and time since last payout
        // This is a simplified calculation - in production, you'd track actual accrued yields
        const monthlyYieldRate = Number(asset.apy) / 100 / 12
        const pendingYield =
          Math.round(totalInvested * monthlyYieldRate * 100) / 100

        return {
          id: asset.id,
          name: asset.name,
          type: asset.type,
          apy: Number(asset.apy),
          total_invested: totalInvested,
          pending_yield: pendingYield,
          investor_count: investorCount,
          next_payout_date: asset.next_payout_date,
          last_payout_date: null, // Would come from yield_distributions table
        }
      }),
    )

    // Get distribution history
    const { data: history, error: historyError } = await supabaseAdmin
      .from('yield_distributions')
      .select(`
        id,
        asset_id,
        total_amount,
        recipient_count,
        status,
        scheduled_date,
        executed_at,
        tx_hash,
        assets!inner(name)
      `)
      .order('executed_at', { ascending: false })
      .limit(50)

    const formattedHistory = (history || []).map((dist) => {
      const assetData = dist.assets as unknown as { name: string } | null
      return {
        id: dist.id,
        asset_id: dist.asset_id,
        asset_name: assetData?.name || 'Unknown Asset',
        total_amount: Number(dist.total_amount),
        recipient_count: dist.recipient_count,
        status: dist.status,
        scheduled_date: dist.scheduled_date,
        executed_at: dist.executed_at,
        tx_hash: dist.tx_hash,
      }
    })

    return NextResponse.json({
      assets: assetsWithYieldInfo,
      history: formattedHistory,
    })
  } catch (error) {
    console.error('Error in yields API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const walletAddress = request.headers.get('x-wallet-address')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 401 },
      )
    }

    // Verify admin with 'admin' role
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single()

    if (adminError || !admin || !admin.is_active || admin.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin role required' },
        { status: 403 },
      )
    }

    const { asset_id } = await request.json()

    if (!asset_id) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 })
    }

    // Get asset info
    const { data: asset, error: assetError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .eq('id', asset_id)
      .single()

    if (assetError || !asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Get active investments for this asset
    const { data: investments, error: invError } = await supabaseAdmin
      .from('investments')
      .select('user_id, amount')
      .eq('asset_id', asset_id)
      .eq('status', 'active')

    if (invError) {
      return NextResponse.json(
        { error: 'Failed to fetch investments' },
        { status: 500 },
      )
    }

    const totalInvested =
      investments?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0
    const investorCount = new Set(investments?.map((inv) => inv.user_id) || [])
      .size
    const monthlyYieldRate = Number(asset.apy) / 100 / 12
    const totalYield = Math.round(totalInvested * monthlyYieldRate * 100) / 100

    // Create distribution record
    const { data: distribution, error: distError } = await supabaseAdmin
      .from('yield_distributions')
      .insert({
        asset_id,
        total_amount: totalYield,
        recipient_count: investorCount,
        status: 'completed',
        scheduled_date: new Date().toISOString().split('T')[0],
        executed_at: new Date().toISOString(),
        tx_hash: `0x${Date.now().toString(16)}`, // Placeholder - would be actual tx hash in production
      })
      .select()
      .single()

    if (distError) {
      console.error('Error creating distribution:', distError)
      return NextResponse.json(
        { error: 'Failed to create distribution' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      distribution: {
        id: distribution.id,
        asset_id: distribution.asset_id,
        asset_name: asset.name,
        total_amount: Number(distribution.total_amount),
        recipient_count: distribution.recipient_count,
        status: distribution.status,
        executed_at: distribution.executed_at,
        tx_hash: distribution.tx_hash,
      },
    })
  } catch (error) {
    console.error('Error in yields distribution:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
