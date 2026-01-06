import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  batchGetPositions,
  formatTokenAmount,
  ASSET_VAULT_ADDRESS,
} from '@/lib/contracts'
import type { Address, Hex } from 'viem'
import { mantleTestnet } from '@/lib/config/networks'

// Sync on-chain balances with database
export const POST = async (request: Request) => {
  try {
    const walletAddress = request.headers.get('x-wallet-address')
    const body = await request.json().catch(() => ({}))
    const { chainId = mantleTestnet.id } = body

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 },
      )
    }

    // Find user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!ASSET_VAULT_ADDRESS) {
      return NextResponse.json(
        { error: 'AssetVault address not configured' },
        { status: 500 },
      )
    }

    // Get all assets with on-chain IDs
    const { data: assets } = await supabaseAdmin
      .from('assets')
      .select('id, onchain_asset_id, price')
      .not('onchain_asset_id', 'is', null)

    if (!assets || assets.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No on-chain assets found',
        synced: 0,
      })
    }

    // Prepare assets for batch position read
    const onchainAssets = assets
      .filter((a) => a.onchain_asset_id)
      .map((a) => ({
        onchainAssetId: a.onchain_asset_id as Hex,
        assetId: a.id,
      }))

    // Read positions from chain
    const positions = await batchGetPositions(
      onchainAssets,
      walletAddress as Address,
      chainId,
    )

    // AssetVault positions use 18 decimals
    const decimals = 18

    // Update holdings in database
    let syncedCount = 0
    const updates: { assetId: string; shares: number; value: number }[] = []

    for (const asset of assets) {
      if (!asset.onchain_asset_id) continue

      const balance = positions[asset.id] || BigInt(0)
      const shares = formatTokenAmount(balance, decimals)

      if (shares > 0) {
        // Upsert holding
        const { error } = await supabaseAdmin.from('portfolio_holdings').upsert(
          {
            user_id: user.id,
            asset_id: asset.id,
            shares,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,asset_id',
          },
        )

        if (!error) {
          syncedCount++
          updates.push({
            assetId: asset.id,
            shares,
            value: shares * Number(asset.price),
          })
        }
      } else {
        // Remove holding if balance is 0
        await supabaseAdmin
          .from('portfolio_holdings')
          .delete()
          .eq('user_id', user.id)
          .eq('asset_id', asset.id)
      }
    }

    // Update last synced timestamp for assets
    await supabaseAdmin
      .from('assets')
      .update({ last_synced_at: new Date().toISOString() })
      .in(
        'id',
        assets.map((a) => a.id),
      )

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      updates,
    })
  } catch (error) {
    console.error('Error syncing balances:', error)
    return NextResponse.json(
      { error: 'Failed to sync balances' },
      { status: 500 },
    )
  }
}

// Get sync status
export const GET = async (request: Request) => {
  const walletAddress = request.headers.get('x-wallet-address')

  if (!walletAddress) {
    return NextResponse.json(
      { error: 'Wallet address required' },
      { status: 400 },
    )
  }

  // Find user
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('wallet_address', walletAddress)
    .single()

  if (!user) {
    return NextResponse.json({ lastSynced: null, holdings: [] })
  }

  // Get holdings with asset info
  const { data: holdings } = await supabaseAdmin
    .from('portfolio_holdings')
    .select(`
      shares,
      updated_at,
      assets (
        id,
        name,
        onchain_asset_id,
        last_synced_at
      )
    `)
    .eq('user_id', user.id)

  return NextResponse.json({
    holdings: (holdings || []).map((h: any) => ({
      assetId: h.assets.id,
      name: h.assets.name,
      shares: Number(h.shares),
      onchainAssetId: h.assets.onchain_asset_id,
      lastSynced: h.assets.last_synced_at,
    })),
  })
}
