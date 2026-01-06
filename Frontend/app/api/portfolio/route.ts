import { NextResponse } from 'next/server'
import type { Address, Hex } from 'viem'
import { supabaseAdmin, type AssetType } from '@/lib/supabase'
import { batchGetPositions, formatTokenAmount } from '@/lib/contracts'
import { mantleTestnet } from '@/lib/config/networks'

// Helper to get asset type label
const getAssetTypeLabel = (type: AssetType): string => {
  const labels: Record<AssetType, string> = {
    'fixed-income': 'Fixed Income',
    'real-estate': 'Real Estate',
    'private-credit': 'Private Credit',
    alternatives: 'Alternatives',
  }
  return labels[type]
}

export const GET = async (request: Request) => {
  try {
    // Get wallet address from query params or header
    const url = new URL(request.url)
    const walletAddress =
      url.searchParams.get('wallet') || request.headers.get('x-wallet-address')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 401 },
      )
    }

    const normalizedWallet = walletAddress.toLowerCase()

    // Find or create user by wallet address
    let userId: string
    const { data: existingUser, error: existingUserError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('wallet_address', normalizedWallet)
      .single()

    if (existingUserError && existingUserError.code !== 'PGRST116') {
      console.error('Error fetching user:', existingUserError)
      return NextResponse.json(
        { error: 'Failed to fetch user', detail: existingUserError.message },
        { status: 500 },
      )
    }

    if (existingUser) {
      userId = existingUser.id
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({ wallet_address: normalizedWallet })
        .select('id')
        .single()

      if (createError || !newUser) {
        console.error('Error creating user:', createError)
        return NextResponse.json(
          { error: 'Failed to initialize user', detail: createError?.message },
          { status: 500 },
        )
      }

      userId = newUser.id
      const { error: portfolioError } = await supabaseAdmin
        .from('portfolios')
        .insert({ user_id: userId, cash_usd: 0 })

      if (portfolioError) {
        console.error('Error creating portfolio:', portfolioError)
        return NextResponse.json(
          {
            error: 'Failed to initialize portfolio',
            detail: portfolioError.message,
          },
          { status: 500 },
        )
      }
    }

    // Fetch portfolio
    const { data: portfolio, error: portfolioError } = await supabaseAdmin
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (portfolioError && portfolioError.code !== 'PGRST116') {
      console.error('Error fetching portfolio:', portfolioError)
      return NextResponse.json(
        { error: 'Failed to fetch portfolio', detail: portfolioError.message },
        { status: 500 },
      )
    }

    // Fetch holdings with asset details
    const { data: holdings, error: holdingsError } = await supabaseAdmin
      .from('portfolio_holdings')
      .select(`
        shares,
        asset_id,
        assets (
          id,
          name,
          type,
          apy,
          price,
          risk_score,
          status,
          next_payout_date,
          onchain_asset_id
        )
      `)
      .eq('user_id', userId)

    if (holdingsError) {
      console.error('Error fetching holdings:', holdingsError)
      return NextResponse.json(
        { error: 'Failed to fetch holdings', detail: holdingsError.message },
        { status: 500 },
      )
    }

    const cashUsd = portfolio ? Number(portfolio.cash_usd) : 0

    // Prefer on-chain positions for accuracy when available
    const onchainSharesByAssetId: Record<string, number> = {}
    const assetsWithOnchain = (holdings || [])
      .filter((h: any) => h.assets?.onchain_asset_id)
      .map((h: any) => ({
        assetId: h.assets.id,
        onchainAssetId: h.assets.onchain_asset_id as Hex,
      }))

    if (assetsWithOnchain.length > 0) {
      const positions = await batchGetPositions(
        assetsWithOnchain,
        walletAddress as Address,
        mantleTestnet.id,
      )
      assetsWithOnchain.forEach((asset) => {
        const raw = positions[asset.assetId] || BigInt(0)
        onchainSharesByAssetId[asset.assetId] = formatTokenAmount(raw, 18)
      })
    }

    // Calculate positions with values
    const positions = (holdings || [])
      .filter((h: any) => {
        if (!h.assets) return false
        const dbShares = Number(h.shares)
        const onchainShares = onchainSharesByAssetId[h.assets.id]
        const shares =
          onchainShares && onchainShares > 0 ? onchainShares : dbShares
        return shares > 0
      })
      .map((holding: any) => {
        const dbShares = Number(holding.shares)
        const onchainShares = onchainSharesByAssetId[holding.assets.id]
        const shares =
          onchainShares && onchainShares > 0 ? onchainShares : dbShares
        const price = Number(holding.assets.price)
        const value = shares * price
        return {
          assetId: holding.asset_id,
          shares,
          value,
          apy: Number(holding.assets.apy),
          riskScore: holding.assets.risk_score,
          type: holding.assets.type as AssetType,
        }
      })

    // Calculate total AUM
    const totalAUM = positions.reduce(
      (sum: number, position: any) => sum + position.value,
      cashUsd,
    )

    // Calculate weighted APY (excluding cash)
    const investedValue = positions.reduce(
      (sum: number, position: any) => sum + position.value,
      0,
    )
    const weightedAPY =
      investedValue === 0
        ? 0
        : positions.reduce((sum: number, position: any) => {
            return sum + (position.value / investedValue) * position.apy
          }, 0)

    // Calculate weighted risk score
    const riskScore =
      totalAUM === 0
        ? 0
        : Math.round(
            positions.reduce((sum: number, position: any) => {
              return sum + (position.value / totalAUM) * position.riskScore
            }, 0),
          )

    // Calculate allocation by asset type
    const allocation = positions.reduce<Record<string, number>>(
      (map: Record<string, number>, position: any) => {
        const label = getAssetTypeLabel(position.type)
        map[label] = (map[label] ?? 0) + position.value
        return map
      },
      { Cash: cashUsd },
    )

    const assetIds = positions.map((position: any) => position.assetId)
    const portfolioValue = positions.reduce(
      (sum: number, position: any) => sum + position.value,
      0,
    )
    const assetWeights = new Map<string, number>()
    if (portfolioValue > 0) {
      positions.forEach((position: any) => {
        assetWeights.set(position.assetId, position.value / portfolioValue)
      })
    }

    let yieldCurve: { day: number; value: number }[] = []
    let payoutEvents: { day: number; label: string }[] = []

    if (assetIds.length > 0 && portfolioValue > 0) {
      const endDate = new Date()
      const startDate = new Date(endDate)
      startDate.setDate(endDate.getDate() - 29)
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      const { data: yieldHistory, error: yieldError } = await supabaseAdmin
        .from('asset_yield_history')
        .select('asset_id, record_date, yield_value')
        .in('asset_id', assetIds)
        .gte('record_date', startDateStr)
        .lte('record_date', endDateStr)
        .order('record_date', { ascending: true })

      if (yieldError) {
        console.error('Error fetching yield history:', yieldError)
      }

      const yieldByDate = new Map<string, number>()
      ;(yieldHistory || []).forEach((row) => {
        const weight = assetWeights.get(row.asset_id) || 0
        const value = Number(row.yield_value)
        const dateKey = row.record_date
        const current = yieldByDate.get(dateKey) || 0
        yieldByDate.set(dateKey, current + value * weight)
      })

      const sortedDates = Array.from(yieldByDate.keys()).sort()
      yieldCurve = sortedDates.map((date, index) => ({
        day: index + 1,
        value: Number((yieldByDate.get(date) || 0).toFixed(6)),
      }))

      const nextPayouts = (holdings || [])
        .filter((h: any) => Number(h.shares) > 0 && h.assets?.next_payout_date)
        .map((h: any) => ({
          date: h.assets.next_payout_date,
        }))

      payoutEvents = nextPayouts
        .map((payout) => {
          const payoutDate = new Date(payout.date)
          const dayIndex =
            Math.floor(
              (payoutDate.getTime() - startDate.getTime()) /
                (24 * 60 * 60 * 1000),
            ) + 1
          if (dayIndex < 1 || dayIndex > 30) return null
          return { day: dayIndex, label: 'Payout' }
        })
        .filter(Boolean) as { day: number; label: string }[]
    }

    // Build full holdings with asset details
    const fullHoldings = (holdings || [])
      .filter((h: any) => {
        if (!h.assets) return false
        const dbShares = Number(h.shares)
        const onchainShares = onchainSharesByAssetId[h.assets.id]
        const shares =
          onchainShares && onchainShares > 0 ? onchainShares : dbShares
        return shares > 0
      })
      .map((holding: any) => {
        const dbShares = Number(holding.shares)
        const onchainShares = onchainSharesByAssetId[holding.assets.id]
        const shares =
          onchainShares && onchainShares > 0 ? onchainShares : dbShares
        const asset = holding.assets
        const price = Number(asset.price)
        return {
          asset: {
            id: asset.id,
            name: asset.name,
            type: asset.type,
            apy: Number(asset.apy),
            price,
            riskScore: asset.risk_score,
            status: asset.status,
            nextPayoutDate: asset.next_payout_date,
            onchainAssetId: asset.onchain_asset_id || null,
          },
          shares,
          value: shares * price,
        }
      })

    return NextResponse.json({
      portfolio: {
        userId,
        totalAUM,
        weightedAPY: Number(weightedAPY.toFixed(2)),
        riskScore,
        positions,
        allocation,
        lastUpdated: portfolio?.last_updated ?? new Date().toISOString(),
      },
      holdings: fullHoldings,
      yieldCurve,
      payoutEvents,
    })
  } catch (error) {
    console.error('Error fetching portfolio:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch portfolio',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

// Update holdings (for invest/redeem operations)
export const POST = async (request: Request) => {
  try {
    const body = await request.json()
    const { assetId, shares, action } = body
    const walletAddress = request.headers.get('x-wallet-address')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 401 },
      )
    }

    if (!assetId || shares === undefined || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: assetId, shares, action' },
        { status: 400 },
      )
    }

    if (!['invest', 'redeem'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "invest" or "redeem"' },
        { status: 400 },
      )
    }

    const normalizedWallet = walletAddress.toLowerCase()

    // Find or create user
    let userId: string
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('wallet_address', normalizedWallet)
      .single()

    if (user) {
      userId = user.id
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({ wallet_address: normalizedWallet })
        .select('id')
        .single()

      if (createError || !newUser) {
        console.error('Error creating user:', createError)
        return NextResponse.json(
          { error: 'Failed to initialize user' },
          { status: 500 },
        )
      }

      userId = newUser.id
      await supabaseAdmin
        .from('portfolios')
        .insert({ user_id: userId, cash_usd: 0 })
    }

    // Get current holding
    const { data: currentHolding } = await supabaseAdmin
      .from('portfolio_holdings')
      .select('shares')
      .eq('user_id', userId)
      .eq('asset_id', assetId)
      .single()

    const currentShares = currentHolding ? Number(currentHolding.shares) : 0
    let newShares: number

    if (action === 'invest') {
      newShares = currentShares + Number(shares)
    } else {
      // redeem
      if (Number(shares) > currentShares) {
        return NextResponse.json(
          { error: 'Insufficient shares to redeem' },
          { status: 400 },
        )
      }
      newShares = currentShares - Number(shares)
    }

    // Update or insert holding
    if (currentHolding) {
      const { error } = await supabaseAdmin
        .from('portfolio_holdings')
        .update({ shares: newShares })
        .eq('user_id', userId)
        .eq('asset_id', assetId)

      if (error) {
        console.error('Error updating holding:', error)
        return NextResponse.json(
          { error: 'Failed to update holding' },
          { status: 500 },
        )
      }
    } else if (action === 'invest') {
      const { error } = await supabaseAdmin.from('portfolio_holdings').insert({
        user_id: userId,
        asset_id: assetId,
        shares: newShares,
      })

      if (error) {
        console.error('Error creating holding:', error)
        return NextResponse.json(
          { error: 'Failed to create holding' },
          { status: 500 },
        )
      }
    }

    // Record event
    const { data: asset } = await supabaseAdmin
      .from('assets')
      .select('price')
      .eq('id', assetId)
      .single()

    const amount = Number(shares) * (asset ? Number(asset.price) : 0)

    await supabaseAdmin.from('asset_events').insert({
      asset_id: assetId,
      type: action === 'invest' ? 'Deposit' : 'Withdraw',
      amount,
      event_date: new Date().toISOString().split('T')[0],
      tx_hash: null, // Will be updated with actual tx hash
    })

    await supabaseAdmin
      .from('portfolios')
      .update({ last_updated: new Date().toISOString() })
      .eq('user_id', userId)

    return NextResponse.json({
      success: true,
      newShares,
      action,
    })
  } catch (error) {
    console.error('Error updating portfolio:', error)
    return NextResponse.json(
      { error: 'Failed to update portfolio' },
      { status: 500 },
    )
  }
}
