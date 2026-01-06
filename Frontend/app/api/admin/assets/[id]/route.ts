import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * 获取资产详情
 * GET /api/admin/assets/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
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

  const { data, error } = await supabaseAdmin
    .from('assets')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ asset: data })
}

/**
 * 更新资产 (上架/下架/编辑)
 * PATCH /api/admin/assets/[id]
 * Body: { status?: 'Active' | 'Paused', ... }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
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

  // 只有 admin 和 super_admin 可以修改资产
  if (admin.role === 'reviewer') {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json()

  // 构建更新字段
  const updateFields: Record<string, unknown> = {}
  const allowedFields = [
    'name',
    'description',
    'apy',
    'price',
    'status',
    'risk_score',
    'yield_confidence',
    'token_address',
    'distributor_address',
    'next_payout_date',
  ]

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateFields[field] = body[field]
    }
  }

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('assets')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 记录操作日志
  const action =
    body.status === 'Paused'
      ? 'pause_asset'
      : body.status === 'Active'
        ? 'activate_asset'
        : 'update_asset'

  await supabaseAdmin.from('admin_logs').insert({
    admin_id: admin.id,
    action,
    target_type: 'asset',
    target_id: id,
    details: updateFields,
  })

  return NextResponse.json({ asset: data })
}

/**
 * 删除资产 (仅 super_admin)
 * DELETE /api/admin/assets/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
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

  // 只有 super_admin 可以删除资产
  if (admin.role !== 'super_admin') {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  // 检查是否有用户持仓
  const { data: holdings } = await supabaseAdmin
    .from('portfolio_holdings')
    .select('id')
    .eq('asset_id', id)
    .gt('shares', 0)
    .limit(1)

  if (holdings && holdings.length > 0) {
    return NextResponse.json(
      { error: 'Cannot delete asset with active holdings' },
      { status: 400 },
    )
  }

  const { error } = await supabaseAdmin.from('assets').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 记录操作日志
  await supabaseAdmin.from('admin_logs').insert({
    admin_id: admin.id,
    action: 'delete_asset',
    target_type: 'asset',
    target_id: id,
  })

  return NextResponse.json({ success: true })
}
