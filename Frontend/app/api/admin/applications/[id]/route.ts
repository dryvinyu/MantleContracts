import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface ApplicationData {
  id: string
  name: string
  type: string
  description: string | null
  expected_apy: number
  target_aum: number
  minimum_investment: number
  duration_days: number
  price: number
  risk_score: number
  token_address: string | null
  token_symbol: string | null
  distributor_address: string | null
  onchain_asset_id: string | null
  onchain_tx_hash?: string | null
}

/**
 * 从申请创建资产并上架到 assets 表
 */
async function publishAssetFromApplication(application: ApplicationData) {
  // 生成资产 ID (使用申请 ID 的前 8 位 + 时间戳)
  const assetId = `rwa-${application.id.slice(0, 8)}-${Date.now().toString(36)}`

  // 计算下次支付日期 (假设每月支付一次)
  const nextPayoutDate = new Date()
  nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1)

  const { data: asset, error } = await supabaseAdmin
    .from('assets')
    .insert({
      id: assetId,
      name: application.name,
      type: application.type,
      apy: application.expected_apy,
      duration_days: application.duration_days,
      risk_score: application.risk_score,
      yield_confidence: 85,
      aum_usd: 0,
      price: application.price,
      status: 'Active',
      next_payout_date: nextPayoutDate.toISOString().split('T')[0],
      description: application.description,
      token_address: application.token_address,
      distributor_address: application.distributor_address,
      onchain_asset_id: application.onchain_asset_id,
      onchain_tx_hash: application.onchain_tx_hash ?? null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create asset: ${error.message}`)
  }

  return asset
}

/**
 * 获取单个资产申请详情
 * GET /api/admin/applications/[id]
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
    .from('asset_applications')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ application: data })
}

/**
 * 审核资产申请
 * PATCH /api/admin/applications/[id]
 * Body: { action: 'approve' | 'reject' | 'request_changes', comments?: string }
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

  const body = await request.json()
  const { action, comments } = body

  if (!['approve', 'reject', 'request_changes'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  // 映射 action 到 status
  const statusMap: Record<string, string> = {
    approve: 'approved',
    reject: 'rejected',
    request_changes: 'changes_requested',
  }

  const newStatus = statusMap[action]

  // 先获取申请详情
  const { data: application, error: fetchError } = await supabaseAdmin
    .from('asset_applications')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !application) {
    return NextResponse.json(
      { error: 'Application not found' },
      { status: 404 },
    )
  }

  // 更新申请状态
  const { data, error } = await supabaseAdmin
    .from('asset_applications')
    .update({
      status: newStatus,
      reviewed_by: admin.id,
      review_comments: comments,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 如果是审核通过，自动上架资产
  let publishedAsset = null
  if (action === 'approve') {
    try {
      publishedAsset = await publishAssetFromApplication(
        application as ApplicationData,
      )

      // 记录资产上架日志
      await supabaseAdmin.from('admin_logs').insert({
        admin_id: admin.id,
        action: 'publish_asset',
        target_type: 'asset',
        target_id: publishedAsset.id,
        details: { application_id: id, asset_name: application.name },
      })
    } catch (publishError) {
      console.error('Failed to publish asset:', publishError)
      // 回滚状态
      await supabaseAdmin
        .from('asset_applications')
        .update({ status: 'pending' })
        .eq('id', id)
      return NextResponse.json(
        {
          error: `Approved but failed to publish: ${publishError instanceof Error ? publishError.message : 'Unknown error'}`,
        },
        { status: 500 },
      )
    }
  }

  // 记录审核日志
  await supabaseAdmin.from('admin_logs').insert({
    admin_id: admin.id,
    action: `review_${action}`,
    target_type: 'asset_application',
    target_id: id,
    details: { comments, published_asset_id: publishedAsset?.id },
  })

  return NextResponse.json({
    application: data,
    publishedAsset: publishedAsset,
  })
}

/**
 * 删除资产申请
 * DELETE /api/admin/applications/[id]
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

  // 只有 super_admin 可以删除
  if (admin.role !== 'super_admin') {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from('asset_applications')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 记录操作日志
  await supabaseAdmin.from('admin_logs').insert({
    admin_id: admin.id,
    action: 'delete_application',
    target_type: 'asset_application',
    target_id: id,
  })

  return NextResponse.json({ success: true })
}
