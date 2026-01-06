import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * 获取资产申请列表
 * GET /api/admin/applications?status=pending
 */
export async function GET(request: NextRequest) {
  const wallet = request.headers.get('x-wallet-address')

  if (!wallet) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 验证管理员身份
  const { data: admin } = await supabaseAdmin
    .from('admins')
    .select('id, role, is_active')
    .eq('wallet_address', wallet.toLowerCase())
    .single()

  if (!admin || !admin.is_active) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const status = request.nextUrl.searchParams.get('status')

  let query = supabaseAdmin
    .from('asset_applications')
    .select('*')
    .order('submitted_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ applications: data })
}

/**
 * 创建新的资产申请（管理员手动添加）
 * POST /api/admin/applications
 */
export async function POST(request: NextRequest) {
  const wallet = request.headers.get('x-wallet-address')

  if (!wallet) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 验证管理员身份
  const { data: admin } = await supabaseAdmin
    .from('admins')
    .select('id, role, is_active')
    .eq('wallet_address', wallet.toLowerCase())
    .single()

  if (!admin || !admin.is_active) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 只有 admin 和 super_admin 可以创建
  if (admin.role === 'reviewer') {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json()

  const { data, error } = await supabaseAdmin
    .from('asset_applications')
    .insert({
      name: body.name,
      type: body.type,
      description: body.description,
      expected_apy: body.expectedApy,
      target_aum: body.targetAum,
      minimum_investment: body.minimumInvestment || 100,
      duration_days: body.durationDays,
      price: body.price || 1.0,
      risk_score: body.riskScore,
      token_address: body.tokenAddress,
      token_symbol: body.tokenSymbol,
      distributor_address: body.distributorAddress,
      metadata: body.metadata || null,
      onchain_asset_id: body.onchainAssetId || null,
      onchain_tx_hash: body.onchainTxHash || null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 记录操作日志
  await supabaseAdmin.from('admin_logs').insert({
    admin_id: admin.id,
    action: 'create_application',
    target_type: 'asset_application',
    target_id: data.id,
    details: { name: body.name },
  })

  return NextResponse.json({ application: data }, { status: 201 })
}
