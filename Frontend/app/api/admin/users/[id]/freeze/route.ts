import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Freeze or unfreeze user account
 * POST /api/admin/users/:id/freeze
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
  const frozen = body?.frozen

  if (typeof frozen !== 'boolean') {
    return NextResponse.json({ error: 'Invalid frozen flag' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ is_frozen: frozen })
    .eq('id', id)
    .select('id, is_frozen')
    .single()

  if (error) {
    console.error('Failed to update freeze status:', error)
    return NextResponse.json(
      { error: 'Failed to update freeze status' },
      { status: 500 },
    )
  }

  return NextResponse.json({ user: data })
}
