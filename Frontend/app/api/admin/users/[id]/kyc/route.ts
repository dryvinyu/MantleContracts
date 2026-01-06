import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const validStatuses = ['pending', 'verified', 'rejected'] as const

/**
 * Update user KYC status
 * POST /api/admin/users/:id/kyc
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const wallet = request.headers.get('x-wallet-address')
  const { id } = await params

  if (!wallet) {
    return NextResponse.json(
      { error: 'Wallet address required' },
      { status: 401 },
    )
  }

  const { data: admin } = await supabaseAdmin
    .from('admins')
    .select('id, role')
    .eq('wallet_address', wallet.toLowerCase())
    .eq('is_active', true)
    .single()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()
  const status = body?.status

  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: 'Invalid status', valid: validStatuses },
      { status: 400 },
    )
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ kyc_status: status })
    .eq('id', id)
    .select('id, kyc_status')
    .single()

  if (error) {
    console.error('Failed to update KYC:', error)
    return NextResponse.json({ error: 'Failed to update KYC' }, { status: 500 })
  }

  return NextResponse.json({ user: data })
}
