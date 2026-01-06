import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * 验证钱包地址是否是管理员
 * GET /api/admin/verify?wallet=0x...
 */
export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet')

  if (!wallet) {
    return NextResponse.json(
      { error: 'Wallet address required' },
      { status: 400 },
    )
  }

  const { data: admin, error } = await supabaseAdmin
    .from('admins')
    .select('id, wallet_address, role, name, is_active')
    .eq('wallet_address', wallet.toLowerCase())
    .single()

  if (error || !admin) {
    return NextResponse.json({ isAdmin: false }, { status: 200 })
  }

  if (!admin.is_active) {
    return NextResponse.json(
      { isAdmin: false, reason: 'Account disabled' },
      { status: 200 },
    )
  }

  return NextResponse.json({
    isAdmin: true,
    admin: {
      id: admin.id,
      role: admin.role,
      name: admin.name,
    },
  })
}
