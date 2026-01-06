import { prisma } from '@/lib/db'

// Define AssetType locally to match Prisma enum
type AssetType =
  | 'fixed_income'
  | 'real_estate'
  | 'private_credit'
  | 'alternatives'

// Helper to get asset type label
export const getAssetTypeLabel = (type: AssetType): string => {
  const labels: Record<AssetType, string> = {
    fixed_income: 'Fixed Income',
    real_estate: 'Real Estate',
    private_credit: 'Private Credit',
    alternatives: 'Alternatives',
  }
  return labels[type]
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const fetchAssets = async () => {
  await delay(300)
  const assets = await prisma.asset.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return {
    assets,
    total: assets.length,
    page: 1,
    pageSize: 20,
  }
}

export const fetchAssetById = async (id: string) => {
  await delay(200)
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      yieldBreakdowns: true,
      confidenceFactors: true,
      realWorldInfo: true,
      realWorldKeyFacts: true,
      realWorldVerifications: true,
      cashFlowSources: true,
      events: {
        orderBy: { eventDate: 'desc' },
        take: 10,
      },
      yieldHistory: {
        orderBy: { dayIndex: 'asc' },
      },
      navHistory: {
        orderBy: { dayIndex: 'asc' },
      },
    },
  })

  if (!asset) return null

  // Transform to match mock data structure
  return {
    ...asset,
    apy: Number(asset.apy),
    aumUsd: Number(asset.aumUsd),
    price: Number(asset.price),
    yieldBreakdown: asset.yieldBreakdowns.map((yb: any) => ({
      label: yb.label,
      percentage: Number(yb.percentage),
      description: yb.description,
      impact: yb.impact as 'positive' | 'negative' | 'neutral',
    })),
    confidenceFactors: asset.confidenceFactors.map((cf: any) => ({
      label: cf.label,
      score: cf.score,
      description: cf.description,
    })),
    realWorld: asset.realWorldInfo
      ? {
          title: asset.realWorldInfo.title,
          summary: asset.realWorldInfo.summary ?? '',
          keyFacts: asset.realWorldKeyFacts.map((kf: any) => ({
            label: kf.label,
            value: kf.value,
          })),
          verification: asset.realWorldVerifications.map((v: any) => v.item),
        }
      : null,
    cashFlowSources: asset.cashFlowSources.map((cfs: any) => ({
      source: cfs.source,
      frequency: cfs.frequency,
      description: cfs.description,
    })),
    events: asset.events.map((e: any) => ({
      type: e.type,
      amount: Number(e.amount),
      date: e.eventDate.toISOString().split('T')[0],
      txHash: e.txHash ?? '',
    })),
    yieldHistory: asset.yieldHistory.map((yh: any) => Number(yh.yieldValue)),
    navHistory: asset.navHistory.map((nh: any) => Number(nh.navValue)),
    nextPayoutDate: asset.nextPayoutDate.toISOString().split('T')[0],
  }
}

export const fetchPortfolio = async () => {
  await delay(250)

  // Hardcoded demo user ID for now
  const userId = '00000000-0000-0000-0000-000000000001'

  // Fetch portfolio and holdings with asset details
  const portfolio = await prisma.portfolio.findUnique({
    where: { userId },
  })

  const holdings = await prisma.portfolioHolding.findMany({
    where: { userId },
    include: {
      asset: true,
    },
  })

  const cashUsd = portfolio ? Number(portfolio.cashUsd) : 0

  // Calculate positions with values
  const positions = holdings
    .filter((h: any) => Number(h.shares) > 0)
    .map((holding: any) => {
      const shares = Number(holding.shares)
      const price = Number(holding.asset.price)
      const value = shares * price
      return {
        assetId: holding.assetId,
        shares,
        value,
        apy: Number(holding.asset.apy),
        riskScore: holding.asset.riskScore,
        type: holding.asset.type as AssetType,
      }
    })

  // Calculate total AUM
  const totalAUM = positions.reduce(
    (sum: number, position: any) => sum + position.value,
    cashUsd,
  )

  // Calculate weighted APY (excluding cash)
  const investedValue = positions.reduce(
    (sum: number, position: any) => sum + position.value,
    0,
  )
  const weightedAPY =
    investedValue === 0
      ? 0
      : positions.reduce((sum: number, position: any) => {
          return sum + (position.value / investedValue) * position.apy
        }, 0)

  // Calculate weighted risk score
  const riskScore =
    totalAUM === 0
      ? 0
      : Math.round(
          positions.reduce((sum: number, position: any) => {
            return sum + (position.value / totalAUM) * position.riskScore
          }, 0),
        )

  // Calculate allocation by asset type
  const allocation = positions.reduce<Record<string, number>>(
    (map: Record<string, number>, position: any) => {
      const label = getAssetTypeLabel(position.type)
      map[label] = (map[label] ?? 0) + position.value
      return map
    },
    { Cash: cashUsd },
  )

  return {
    portfolio: {
      userId,
      totalAUM,
      weightedAPY: Number(weightedAPY.toFixed(2)),
      riskScore,
      positions,
      allocation,
    },
  }
}

const copilotResponses: Record<
  string,
  {
    summary: string
    recommendations: { action: string; reason: string }[]
    riskNotes: string
  }
> = {
  risk: {
    summary:
      'Your portfolio has a moderate risk profile with a weighted score of 28/100. The main risk contributors are your Credit positions and SaaS Revenue Pool.',
    recommendations: [
      {
        action: 'Consider increasing Treasury allocation',
        reason: 'Treasury positions provide stability with lowest risk.',
      },
      {
        action: 'Monitor Credit exposure',
        reason: 'Higher yield comes with elevated counterparty risk.',
      },
    ],
    riskNotes:
      'Risk scores are simulated based on asset class volatility and duration. Past performance does not guarantee future results.',
  },
  conservative: {
    summary:
      'For a conservative 6% target APY, shift allocation towards treasuries and real estate, reducing credit exposure.',
    recommendations: [
      {
        action: 'Increase Treasury allocation by 30%',
        reason: 'Stable yield with minimal risk.',
      },
      {
        action: 'Add to Real Estate holdings',
        reason: 'Balanced yield with tangible collateral.',
      },
      {
        action: 'Reduce Credit exposure by 40%',
        reason: 'Lower portfolio volatility.',
      },
    ],
    riskNotes:
      'Conservative allocation may limit upside potential. Rebalancing involves transaction costs. Yields are not guaranteed.',
  },
  payout: {
    summary:
      'Upcoming payouts are concentrated in the next 2 weeks across credit pools and revenue assets.',
    recommendations: [
      {
        action: 'Trade Finance Pool: Jan 2',
        reason: 'Maturing position with final distribution.',
      },
      {
        action: 'Supply Chain Factoring: Jan 5',
        reason: 'Regular monthly payout cycle.',
      },
      {
        action: 'SaaS Revenue Pool: Jan 8',
        reason: 'Monthly revenue share distribution.',
      },
    ],
    riskNotes:
      'Payout amounts are estimates based on historical distributions. Actual amounts may vary.',
  },
  default: {
    summary:
      'I can help you understand your RWA portfolio, analyze risks, and suggest allocation adjustments. What would you like to explore?',
    recommendations: [
      {
        action: 'Ask about portfolio risk analysis',
        reason: 'Understand your exposure across asset classes.',
      },
      {
        action: 'Request conservative allocation advice',
        reason: 'Optimize for lower volatility and stable yields.',
      },
      {
        action: 'Check upcoming payouts',
        reason: 'Plan around distribution schedules.',
      },
    ],
    riskNotes:
      'This is a demo environment. All yields and recommendations are simulated. Not financial advice.',
  },
}

export const postCopilotMessage = async (content: string) => {
  await delay(700)
  const lowerContent = content.toLowerCase()
  if (lowerContent.includes('risk') || lowerContent.includes('风险'))
    return copilotResponses.risk
  if (
    lowerContent.includes('conservative') ||
    lowerContent.includes('保守') ||
    lowerContent.includes('6%')
  )
    return copilotResponses.conservative
  if (
    lowerContent.includes('payout') ||
    lowerContent.includes('分红') ||
    lowerContent.includes('next')
  )
    return copilotResponses.payout
  return copilotResponses.default
}

export const postTransaction = async () => {
  await delay(500)

  // For now, return a mock transaction since we don't have a transactions table
  // This would need to be updated once the transactions table is created
  return {
    transaction: {
      id: `tx-${Date.now()}`,
      status: 'Completed',
      txHash: '0xmock...',
      timestamp: new Date().toISOString(),
    },
  }
}
