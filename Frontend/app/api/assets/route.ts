import { NextResponse } from 'next/server'
import { supabaseAdmin, type AssetType, type AssetStatus } from '@/lib/supabase'

interface CreateAssetRequest {
  id: string
  name: string
  type: AssetType
  apy: number
  durationDays: number
  riskScore: number
  yieldConfidence: number
  aumUsd: number
  price: number
  status: AssetStatus
  nextPayoutDate: string
  description?: string | null
  tokenAddress?: string | null
  distributorAddress?: string | null
}

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') as AssetType | null
  const minAPY = searchParams.get('minAPY')
  const maxRisk = searchParams.get('maxRisk')

  let query = supabaseAdmin
    .from('assets')
    .select('*')
    .order('created_at', { ascending: false })

  if (type) {
    query = query.eq('type', type)
  }
  if (minAPY) {
    const minAPYNum = Number(minAPY)
    if (!isNaN(minAPYNum)) {
      query = query.gte('apy', minAPYNum)
    }
  }
  if (maxRisk) {
    const maxRiskNum = Number(maxRisk)
    if (!isNaN(maxRiskNum)) {
      query = query.lte('risk_score', maxRiskNum)
    }
  }

  const { data: dbAssets, error } = await query

  if (error) {
    console.error('Error fetching assets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 },
    )
  }

  // Transform to frontend format
  const assets = (dbAssets || []).map((asset) => ({
    id: asset.id,
    name: asset.name,
    type: asset.type,
    apy: Number(asset.apy),
    durationDays: asset.duration_days,
    riskScore: asset.risk_score,
    yieldConfidence: asset.yield_confidence,
    aumUsd: Number(asset.aum_usd),
    price: Number(asset.price),
    status: asset.status,
    nextPayoutDate: asset.next_payout_date,
    description: asset.description,
    tokenAddress: asset.token_address,
    distributorAddress: asset.distributor_address,
    onchainAssetId: asset.onchain_asset_id || null,
  }))

  return NextResponse.json({
    assets,
    total: assets.length,
    page: 1,
    pageSize: 20,
  })
}

export const POST = async (request: Request) => {
  try {
    const body: CreateAssetRequest = await request.json()

    // Validate required fields
    const requiredFields = [
      'id',
      'name',
      'type',
      'apy',
      'durationDays',
      'riskScore',
      'yieldConfidence',
      'aumUsd',
      'price',
      'status',
      'nextPayoutDate',
    ] as const

    const missingFields = requiredFields.filter(
      (field) =>
        body[field] === undefined || body[field] === null || body[field] === '',
    )

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          missingFields,
        },
        { status: 400 },
      )
    }

    // Validate asset ID format
    if (typeof body.id !== 'string' || body.id.trim() === '') {
      return NextResponse.json(
        {
          error: 'Invalid asset ID',
          message: 'Asset ID must be a non-empty string',
        },
        { status: 400 },
      )
    }

    // Check for duplicate asset ID
    const { data: existingAsset } = await supabaseAdmin
      .from('assets')
      .select('id')
      .eq('id', body.id)
      .single()

    if (existingAsset) {
      return NextResponse.json(
        {
          error: 'Duplicate asset ID',
          message: `Asset with ID "${body.id}" already exists`,
        },
        { status: 409 },
      )
    }

    // Validate enum values
    const validTypes: AssetType[] = [
      'fixed-income',
      'real-estate',
      'private-credit',
      'alternatives',
    ]
    const validStatuses: AssetStatus[] = ['Active', 'Maturing', 'Paused']

    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        {
          error: 'Invalid asset type',
          message: `Type must be one of: ${validTypes.join(', ')}`,
          validTypes,
        },
        { status: 400 },
      )
    }

    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        {
          error: 'Invalid asset status',
          message: `Status must be one of: ${validStatuses.join(', ')}`,
          validStatuses,
        },
        { status: 400 },
      )
    }

    // Validate numeric ranges
    const validationErrors: string[] = []

    if (typeof body.apy !== 'number' || body.apy < 0) {
      validationErrors.push('apy must be >= 0')
    }
    if (
      typeof body.durationDays !== 'number' ||
      body.durationDays <= 0 ||
      !Number.isInteger(body.durationDays)
    ) {
      validationErrors.push('durationDays must be a positive integer')
    }
    if (
      typeof body.riskScore !== 'number' ||
      body.riskScore < 0 ||
      body.riskScore > 100 ||
      !Number.isInteger(body.riskScore)
    ) {
      validationErrors.push('riskScore must be an integer between 0 and 100')
    }
    if (
      typeof body.yieldConfidence !== 'number' ||
      body.yieldConfidence < 0 ||
      body.yieldConfidence > 100 ||
      !Number.isInteger(body.yieldConfidence)
    ) {
      validationErrors.push(
        'yieldConfidence must be an integer between 0 and 100',
      )
    }
    if (typeof body.aumUsd !== 'number' || body.aumUsd < 0) {
      validationErrors.push('aumUsd must be >= 0')
    }
    if (typeof body.price !== 'number' || body.price < 0) {
      validationErrors.push('price must be >= 0')
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Invalid field values',
          validationErrors,
        },
        { status: 400 },
      )
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(body.nextPayoutDate)) {
      return NextResponse.json(
        {
          error: 'Invalid date format',
          message: 'nextPayoutDate must be in YYYY-MM-DD format',
        },
        { status: 400 },
      )
    }

    const nextPayoutDate = new Date(body.nextPayoutDate)
    if (isNaN(nextPayoutDate.getTime())) {
      return NextResponse.json(
        {
          error: 'Invalid date',
          message: 'nextPayoutDate must be a valid date',
        },
        { status: 400 },
      )
    }

    // Insert asset into database
    const { data: createdAsset, error: insertError } = await supabaseAdmin
      .from('assets')
      .insert({
        id: body.id.trim(),
        name: body.name,
        type: body.type,
        apy: body.apy,
        duration_days: body.durationDays,
        risk_score: body.riskScore,
        yield_confidence: body.yieldConfidence,
        aum_usd: body.aumUsd,
        price: body.price,
        status: body.status,
        next_payout_date: body.nextPayoutDate,
        description: body.description || null,
        token_address: body.tokenAddress || null,
        distributor_address: body.distributorAddress || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating asset:', insertError)
      return NextResponse.json(
        {
          error: 'Failed to create asset',
          message: insertError.message,
        },
        { status: 500 },
      )
    }

    // Transform response
    const assetResponse = {
      id: createdAsset.id,
      name: createdAsset.name,
      type: createdAsset.type,
      apy: Number(createdAsset.apy),
      durationDays: createdAsset.duration_days,
      riskScore: createdAsset.risk_score,
      yieldConfidence: createdAsset.yield_confidence,
      aumUsd: Number(createdAsset.aum_usd),
      price: Number(createdAsset.price),
      status: createdAsset.status,
      nextPayoutDate: createdAsset.next_payout_date,
      description: createdAsset.description,
      tokenAddress: createdAsset.token_address,
      distributorAddress: createdAsset.distributor_address,
    }

    return NextResponse.json(assetResponse, { status: 201 })
  } catch (error) {
    console.error('Error creating asset:', error)
    return NextResponse.json(
      {
        error: 'Failed to create asset',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
