import { useState, useEffect } from 'react'
import usePortfolio from '@/lib/hooks/usePortfolio'
import { getRiskLevel, type Asset } from '@/lib/mockData'

export default function usePortfolioSummary() {
  const {
    getTotalAUM,
    getWeightedAPY,
    getRiskScore,
    getAllocation,
    portfolio,
    getYieldCurve,
    getPayoutEvents,
  } = usePortfolio()
  const [assets, setAssets] = useState<Asset[]>([])

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch('/api/assets')
        if (!response.ok) return
        const data = await response.json()
        // Map database type format (real_estate) to frontend format (real-estate)
        const mappedAssets = data.assets.map((asset: any) => ({
          ...asset,
          type: asset.type === 'real_estate' ? 'real-estate' : asset.type,
        }))
        setAssets(mappedAssets)
      } catch (err) {
        console.error('Error fetching assets:', err)
      }
    }

    fetchAssets()
  }, [])

  const totalAUM = getTotalAUM()
  const weightedAPY = getWeightedAPY()
  const riskScore = getRiskScore()
  const riskLevel = getRiskLevel(riskScore)
  const allocation = getAllocation()
  const yieldCurve = getYieldCurve()
  const payoutEvents = getPayoutEvents()
  const lastUpdated = portfolio.lastUpdated

  // Get next payout date
  const getNextPayout = () => {
    const holdingAssets = Object.keys(portfolio.holdings)
      .map((id) => assets.find((a) => a.id === id))
      .filter(Boolean)
    if (holdingAssets.length === 0) return 'N/A'

    const sorted = holdingAssets.sort(
      (a, b) =>
        new Date(a!.nextPayoutDate).getTime() -
        new Date(b!.nextPayoutDate).getTime(),
    )
    return new Date(sorted[0]!.nextPayoutDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low':
        return 'text-green-400'
      case 'Medium':
        return 'text-yellow-400'
      case 'High':
        return 'text-red-400'
      default:
        return 'text-slate-500'
    }
  }

  return {
    totalAUM,
    weightedAPY,
    riskScore,
    riskLevel,
    allocation,
    getNextPayout,
    getRiskColor,
    yieldCurve,
    payoutEvents,
    lastUpdated,
  }
}
