'use client'
import { TrendingUp, Calendar, AlertTriangle, DollarSign } from 'lucide-react'
import PortfolioCharts from './PortfolioCharts'
import usePortfolioSummary from './service'
import { formatCurrency } from '@/lib/mockData'

const COLORS = ['#3b82f6', '#38bdf8', '#6366f1', '#14b8a6', '#94a3b8']

export default function PortfolioSummary() {
  const {
    totalAUM,
    weightedAPY,
    riskScore,
    riskLevel,
    allocation,
    getNextPayout,
    yieldCurve,
    payoutEvents,
    lastUpdated,
  } = usePortfolioSummary()

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-slate-600 uppercase tracking-wider">
        Portfolio Summary
      </h2>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total AUM */}
        <div className="metric-card col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="metric-label">Total AUM</span>
          </div>
          <div className="metric-value">{formatCurrency(totalAUM)}</div>
          <div className="metric-subtext">
            {lastUpdated
              ? `Last updated ${new Date(lastUpdated).toLocaleString()}`
              : 'Last updated unavailable'}
          </div>
        </div>

        {/* Weighted APY */}
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="metric-label">APY</span>
          </div>
          <div className="metric-value text-green-400">
            {weightedAPY.toFixed(2)}%
          </div>
        </div>

        {/* Next Payout */}
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="metric-label">Next Payout</span>
          </div>
          <div className="metric-value text-lg">{getNextPayout()}</div>
        </div>

        {/* Risk Score */}
        <div className="metric-card col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="metric-label">Risk Score</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="metric-value">{riskScore}/100</div>
            <span
              className={`status-badge ${riskLevel === 'Low' ? 'risk-low' : riskLevel === 'Medium' ? 'risk-medium' : 'risk-high'}`}
            >
              {riskLevel}
            </span>
          </div>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${riskLevel === 'Low' ? 'bg-green-400' : riskLevel === 'Medium' ? 'bg-yellow-400' : 'bg-red-400'}`}
              style={{ width: `${riskScore}%` }}
            />
          </div>
        </div>
      </div>

      <PortfolioCharts
        allocation={allocation}
        colors={COLORS}
        yieldCurve={yieldCurve}
        payoutEvents={payoutEvents}
      />
    </div>
  )
}
