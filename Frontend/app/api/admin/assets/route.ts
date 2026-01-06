import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * 获取已上架资产列表
 * GET /api/admin/assets?status=Active
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
    .from('assets')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ assets: data })
}
