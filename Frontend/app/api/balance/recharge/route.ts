import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Recharge RWA balance
 * POST /api/balance/recharge
 */
export async function POST(request: NextRequest) {
  try {
    const { walletAddress, amount, sourceToken, sourceAmount } =
      await request.json()

    if (!walletAddress || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    const wallet = walletAddress.toLowerCase()

    // Check if user balance record exists
    const { data: existing } = await supabaseAdmin
      .from('user_balances')
      .select('rwa_balance')
      .eq('wallet_address', wallet)
      .single()

    let newBalance: number

    if (existing) {
      // Update existing balance
      const { data, error } = await supabaseAdmin
        .from('user_balances')
        .update({
          rwa_balance: existing.rwa_balance + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('wallet_address', wallet)
        .select('rwa_balance')
        .single()

      if (error) throw error
      newBalance = data.rwa_balance
    } else {
      // Create new balance record
      const { data, error } = await supabaseAdmin
        .from('user_balances')
        .insert({
          wallet_address: wallet,
          rwa_balance: amount,
        })
        .select('rwa_balance')
        .single()

      if (error) throw error
      newBalance = data.rwa_balance
    }

    // Record the recharge transaction
    await supabaseAdmin.from('balance_transactions').insert({
      wallet_address: wallet,
      type: 'recharge',
      amount,
      source_token: sourceToken,
      source_amount: sourceAmount,
    })

    return NextResponse.json({
      success: true,
      newBalance,
    })
  } catch (error) {
    console.error('Error recharging balance:', error)
    return NextResponse.json({ error: 'Failed to recharge' }, { status: 500 })
  }
}
