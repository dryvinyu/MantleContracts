'use client'
import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react'
import { useAccount } from 'wagmi'

import { Portfolio, initialPortfolio } from '../mockData'

interface PortfolioContextType {
  portfolio: Portfolio
  addPosition: (assetId: string, shares: number) => Promise<void>
  redeemPosition: (assetId: string, shares: number) => Promise<void>
  refreshPortfolio: () => Promise<void>
  getTotalAUM: () => number
  getWeightedAPY: () => number
  getRiskScore: () => number
  getAllocation: () => { type: string; value: number; percentage: number }[]
  getYieldCurve: () => { day: number; value: number }[]
  getPayoutEvents: () => { day: number; label: string }[]
  loading: boolean
  isRefreshing: boolean
}

export const PortfolioContext = createContext<PortfolioContextType | undefined>(
  undefined,
)

export const PortfolioProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { address } = useAccount()
  const [portfolio, setPortfolio] = useState<Portfolio>(initialPortfolio)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [apiMetrics, setApiMetrics] = useState<{
    totalAUM: number
    weightedAPY: number
    riskScore: number
    allocation: Record<string, number>
    yieldCurve: { day: number; value: number }[]
    payoutEvents: { day: number; label: string }[]
  } | null>(null)

  const fetchPortfolio = useCallback(
    async (isRefresh = false) => {
      try {
        if (!address) {
          setPortfolio(initialPortfolio)
          setApiMetrics(null)
          setLoading(false)
          setIsRefreshing(false)
          return
        }

        if (isRefresh) {
          setIsRefreshing(true)
        } else {
          setLoading(true)
        }

        const headers: HeadersInit = {}
        headers['x-wallet-address'] = address

        const response = await fetch('/api/portfolio', { headers })
        if (!response.ok) {
          let detail = ''
          try {
            detail = await response.text()
          } catch {
            detail = ''
          }
          console.error('Failed to fetch portfolio', response.status, detail)
          return
        }
        const data = await response.json()
        // Transform API response to Portfolio format
        const holdings: Record<string, number> = {}
        data.portfolio.positions.forEach((pos: any) => {
          holdings[pos.assetId] = pos.shares
        })

        // Extract cash from allocation or use 0 if not found
        const cashUsd = data.portfolio.allocation?.Cash || 0

        setPortfolio({
          holdings,
          cashUsd,
          lastUpdated: data.portfolio.lastUpdated || new Date().toISOString(),
        })

        // Store API-provided metrics
        setApiMetrics({
          totalAUM: data.portfolio.totalAUM,
          weightedAPY: data.portfolio.weightedAPY,
          riskScore: data.portfolio.riskScore,
          allocation: data.portfolio.allocation,
          yieldCurve: data.yieldCurve || [],
          payoutEvents: data.payoutEvents || [],
        })
      } catch (err) {
        console.error('Error fetching portfolio:', err)
        throw err // Re-throw so caller can handle
      } finally {
        setLoading(false)
        setIsRefreshing(false)
      }
    },
    [address],
  )

  const refreshPortfolio = async () => {
    try {
      await fetchPortfolio(true)
    } catch (err) {
      console.error('Error refreshing portfolio:', err)
      // Don't throw - allow user to continue
    }
  }

  // Fetch portfolio on mount and when wallet changes
  useEffect(() => {
    fetchPortfolio()
  }, [fetchPortfolio])

  const addPosition = async (assetId: string, shares: number) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (address) {
      headers['x-wallet-address'] = address
    }

    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          assetId,
          shares,
          action: 'invest',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add position')
      }

      // Refresh portfolio to get updated data
      await fetchPortfolio(true)
    } catch (err) {
      console.error('Error adding position:', err)
      throw err
    }
  }

  const redeemPosition = async (assetId: string, shares: number) => {
    const currentShares = portfolio.holdings[assetId] || 0
    if (shares > currentShares) {
      throw new Error('Insufficient shares')
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (address) {
      headers['x-wallet-address'] = address
    }

    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          assetId,
          shares,
          action: 'redeem',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to redeem position')
      }

      // Refresh portfolio to get updated data
      await fetchPortfolio(true)
    } catch (err) {
      console.error('Error redeeming position:', err)
      throw err
    }
  }

  const getTotalAUM = () => {
    return apiMetrics?.totalAUM || 0
  }

  const getWeightedAPY = () => {
    return apiMetrics?.weightedAPY || 0
  }

  const getRiskScore = () => {
    return apiMetrics?.riskScore || 0
  }

  const getAllocation = () => {
    if (!apiMetrics?.allocation) {
      return []
    }
    const totalAUM = getTotalAUM()
    return Object.entries(apiMetrics.allocation)
      .filter(([_, value]) => value > 0)
      .map(([type, value]) => ({
        type,
        value,
        percentage: totalAUM > 0 ? (value / totalAUM) * 100 : 0,
      }))
  }

  const getYieldCurve = () => {
    return apiMetrics?.yieldCurve || []
  }

  const getPayoutEvents = () => {
    return apiMetrics?.payoutEvents || []
  }

  return (
    <PortfolioContext.Provider
      value={{
        portfolio,
        addPosition,
        redeemPosition,
        refreshPortfolio,
        getTotalAUM,
        getWeightedAPY,
        getRiskScore,
        getAllocation,
        getYieldCurve,
        getPayoutEvents,
        loading,
        isRefreshing,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  )
}
