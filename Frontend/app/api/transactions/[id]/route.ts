import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { TransactionStatus } from '@/lib/supabase'

/**
 * 获取单个交易详情
 * GET /api/transactions/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('user_transactions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Transaction not found' },
      { status: 404 },
    )
  }

  return NextResponse.json({ transaction: data })
}

/**
 * 更新交易状态 (确认/失败)
 * PATCH /api/transactions/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await request.json()

  const { status, txHash, blockNumber } = body

  if (!status || !['pending', 'confirmed', 'failed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const updateFields: Record<string, unknown> = {
    status: status as TransactionStatus,
  }

  if (txHash) {
    updateFields.tx_hash = txHash
  }

  if (blockNumber) {
    updateFields.block_number = blockNumber
  }

  if (status === 'confirmed') {
    updateFields.confirmed_at = new Date().toISOString()
  }

  const { data, error } = await supabaseAdmin
    .from('user_transactions')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ transaction: data })
}

/**
 * 通过 tx_hash 更新交易状态
 * PUT /api/transactions/[txHash] (txHash as id)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: txHash } = await params
  const body = await request.json()

  const { status, blockNumber } = body

  if (!status || !['pending', 'confirmed', 'failed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const updateFields: Record<string, unknown> = {
    status: status as TransactionStatus,
  }

  if (blockNumber) {
    updateFields.block_number = blockNumber
  }

  if (status === 'confirmed') {
    updateFields.confirmed_at = new Date().toISOString()
  }

  const { data, error } = await supabaseAdmin
    .from('user_transactions')
    .update(updateFields)
    .eq('tx_hash', txHash)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ transaction: data })
}
