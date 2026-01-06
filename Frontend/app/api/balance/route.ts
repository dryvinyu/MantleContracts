import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Get user's RWA balance
 * GET /api/balance?wallet=0x...
 */
export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet')

  if (!wallet) {
    return NextResponse.json(
      { error: 'Wallet address required' },
      { status: 400 },
    )
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('user_balances')
      .select('rwa_balance')
      .eq('wallet_address', wallet.toLowerCase())
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return NextResponse.json({
      rwaBalance: data?.rwa_balance || 0,
    })
  } catch (error) {
    console.error('Error fetching balance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 },
    )
  }
}
