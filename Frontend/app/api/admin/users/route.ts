import { NextRequest, NextResponse } from 'next/server'
import type { Address } from 'viem'
import { supabaseAdmin } from '@/lib/supabase'
import {
  RWA_EXCHANGE_ABI,
  RWA_EXCHANGE_ADDRESS,
  formatTokenAmount,
  getClient,
} from '@/lib/contracts'
import { mantleTestnet } from '@/lib/config/networks'

/**
 * Get all users for admin management
 * GET /api/admin/users
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
    // Get all users
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, wallet_address, created_at, kyc_status, is_frozen')
      .order('created_at', { ascending: false })

    if (error) throw error

    const walletAddresses = (users || [])
      .map((user) => user.wallet_address?.toLowerCase())
      .filter((address): address is string => Boolean(address))

    const client = getClient(mantleTestnet.id)
    let rwaDecimals = 18
    try {
      const decimals = await client.readContract({
        address: RWA_EXCHANGE_ADDRESS,
        abi: RWA_EXCHANGE_ABI,
        functionName: 'decimals',
      })
      rwaDecimals = Number(decimals)
    } catch (decimalsError) {
      console.error('Failed to read RWA decimals:', decimalsError)
    }

    const balanceMap = new Map<string, bigint>()
    if (walletAddresses.length > 0) {
      const balanceResults = await Promise.all(
        walletAddresses.map(async (walletAddress) => {
          try {
            const balance = await client.readContract({
              address: RWA_EXCHANGE_ADDRESS,
              abi: RWA_EXCHANGE_ABI,
              functionName: 'balanceOf',
              args: [walletAddress as Address],
            })
            return [walletAddress, balance as bigint] as const
          } catch (balanceError) {
            console.error(
              'Failed to read balance for',
              walletAddress,
              balanceError,
            )
            return [walletAddress, BigInt(0)] as const
          }
        }),
      )

      balanceResults.forEach(([walletAddress, balance]) => {
        balanceMap.set(walletAddress, balance)
      })
    }

    // Enrich with balance and investment data
    const enrichedUsers = await Promise.all(
      (users || []).map(async (user) => {
        const walletAddress = user.wallet_address?.toLowerCase()
        const onchainBalance = walletAddress
          ? balanceMap.get(walletAddress) || BigInt(0)
          : BigInt(0)
        const rwaBalance = formatTokenAmount(onchainBalance, rwaDecimals)

        // Get investment count and total
        const { data: holdings } = await supabaseAdmin
          .from('portfolio_holdings')
          .select('shares, assets(price)')
          .eq('user_id', user.id)
          .gt('shares', 0)

        const investmentCount = holdings?.length || 0
        const totalInvested =
          holdings?.reduce((sum, h) => {
            const assets = h.assets as
              | { price: number }
              | { price: number }[]
              | null
            const price = Array.isArray(assets)
              ? assets[0]?.price || 0
              : assets?.price || 0
            return sum + h.shares * price
          }, 0) || 0

        return {
          id: user.id,
          wallet_address: user.wallet_address,
          created_at: user.created_at,
          rwa_balance: rwaBalance,
          total_invested: totalInvested,
          investment_count: investmentCount,
          kyc_status: user.kyc_status || 'pending',
          is_frozen: user.is_frozen || false,
        }
      }),
    )

    return NextResponse.json({ users: enrichedUsers })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 },
    )
  }
}
