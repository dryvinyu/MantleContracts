'use client'

import { Loader2 } from 'lucide-react'
import usePortfolio from '@/lib/hooks/usePortfolio'
import { formatCurrency } from '@/lib/mockData'

export default function PortfolioSummary() {
  const { loading, getTotalAUM, getWeightedAPY, getRiskScore, getAllocation } =
    usePortfolio()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
      </div>
    )
  }

  const totalAUM = getTotalAUM()
  const weightedAPY = getWeightedAPY()
  const riskScore = getRiskScore()
  const allocation = getAllocation()

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Portfolio Summary</h2>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Total AUM</span>
          <span className="font-semibold">{formatCurrency(totalAUM)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Weighted APY</span>
          <span className="font-semibold text-green-500">
            {weightedAPY.toFixed(2)}%
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Risk Score</span>
          <span
            className={`font-semibold ${
              riskScore < 30
                ? 'text-green-500'
                : riskScore < 60
                  ? 'text-yellow-500'
                  : 'text-red-500'
            }`}
          >
            {riskScore}/100
          </span>
        </div>
      </div>

      {allocation.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-border">
          <h3 className="text-xs font-medium text-slate-600 uppercase tracking-wider">
            Allocation
          </h3>
          {allocation.map((item) => (
            <div key={item.type} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{item.type}</span>
                <span>{item.percentage.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
