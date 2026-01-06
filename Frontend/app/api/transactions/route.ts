import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { TransactionType, TransactionStatus } from '@/lib/supabase'

/**
 * 获取用户交易记录
 * GET /api/transactions?wallet=0x...&type=invest&limit=50
 */
export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet')
  const type = request.nextUrl.searchParams.get('type')
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50')
  const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0')

  if (!wallet) {
    return NextResponse.json(
      { error: 'Wallet address required' },
      { status: 400 },
    )
  }

  let query = supabaseAdmin
    .from('user_transactions')
    .select('*', { count: 'exact' })
    .eq('wallet_address', wallet.toLowerCase())
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    transactions: data,
    pagination: {
      offset,
      limit,
      total: count,
    },
  })
}

/**
 * 创建新交易记录
 * POST /api/transactions
 */
export async function POST(request: NextRequest) {
  const body = await request.json()

  const {
    walletAddress,
    assetId,
    assetName,
    type,
    amount,
    valueUsd,
    pricePerUnit,
    txHash,
    chainId = 5003, // Mantle Sepolia default
  } = body

  if (
    !walletAddress ||
    !assetName ||
    !type ||
    amount === undefined ||
    valueUsd === undefined
  ) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    )
  }

  const { data, error } = await supabaseAdmin
    .from('user_transactions')
    .insert({
      wallet_address: walletAddress.toLowerCase(),
      asset_id: assetId,
      asset_name: assetName,
      type: type as TransactionType,
      amount,
      value_usd: valueUsd,
      price_per_unit: pricePerUnit || valueUsd / amount,
      tx_hash: txHash,
      chain_id: chainId,
      status: 'pending' as TransactionStatus,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ transaction: data }, { status: 201 })
}
