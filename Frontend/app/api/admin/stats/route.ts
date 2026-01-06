import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Get platform statistics for admin dashboard
 * GET /api/admin/stats
 */
export async function GET(request: NextRequest) {
  const wallet = request.headers.get('x-wallet-address')

  if (!wallet) {
    return NextResponse.json(
      { error: 'Wallet address required' },
      { status: 401 },
    )
  }

  // Verify admin
  const { data: admin } = await supabaseAdmin
    .from('admins')
    .select('id, role')
    .eq('wallet_address', wallet.toLowerCase())
    .eq('is_active', true)
    .single()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    // Get total AUM from active assets
    const { data: assets } = await supabaseAdmin
      .from('assets')
      .select('aum_usd')
      .eq('status', 'Active')

    const totalAUM = assets?.reduce((sum, a) => sum + (a.aum_usd || 0), 0) || 0

    // Get total users count
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Get active investments count
    const { count: activeInvestments } = await supabaseAdmin
      .from('portfolio_holdings')
      .select('*', { count: 'exact', head: true })
      .gt('shares', 0)

    // Calculate pending yields from pending payout transactions
    const { data: pendingTransactions } = await supabaseAdmin
      .from('user_transactions')
      .select('value_usd')
      .eq('type', 'yield_payout')
      .eq('status', 'pending')

    const pendingYields = (pendingTransactions || []).reduce(
      (sum, tx) => sum + (tx.value_usd || 0),
      0,
    )

    // Get user balance totals
    const { data: balances } = await supabaseAdmin
      .from('user_balances')
      .select('rwa_balance')

    const totalRWABalance =
      balances?.reduce((sum, b) => sum + (b.rwa_balance || 0), 0) || 0

    // Get recent transactions
    const { data: recentTransactions } = await supabaseAdmin
      .from('user_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString()

    const { count: newUsers7d } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo)

    const { count: newInvestments7d } = await supabaseAdmin
      .from('user_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'invest')
      .gte('created_at', sevenDaysAgo)

    const { count: redemptions7d } = await supabaseAdmin
      .from('user_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'redeem')
      .gte('created_at', sevenDaysAgo)

    return NextResponse.json({
      totalAUM,
      totalUsers: totalUsers || 0,
      activeInvestments: activeInvestments || 0,
      pendingYields,
      totalRWABalance,
      newUsers7d: newUsers7d || 0,
      newInvestments7d: newInvestments7d || 0,
      redemptions7d: redemptions7d || 0,
      recentTransactions: recentTransactions || [],
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 },
    )
  }
}
