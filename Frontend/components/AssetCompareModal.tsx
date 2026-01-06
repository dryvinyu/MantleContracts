'use client'

import { X, TrendingUp, AlertTriangle, Clock, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type Asset, formatCurrency, formatDuration } from '@/lib/mockData'

interface AssetCompareModalProps {
  assets: Asset[]
  onClose: () => void
}

export default function AssetCompareModal({
  assets,
  onClose,
}: AssetCompareModalProps) {
  const metrics = [
    {
      key: 'apy',
      label: 'APY',
      icon: TrendingUp,
      format: (v: number) => `${v.toFixed(2)}%`,
      highlight: 'high',
    },
    {
      key: 'riskScore',
      label: 'Risk Score',
      icon: AlertTriangle,
      format: (v: number) => `${v}/100`,
      highlight: 'low',
    },
    {
      key: 'yieldConfidence',
      label: 'Yield Confidence',
      icon: null,
      format: (v: number) => `${v}%`,
      highlight: 'high',
    },
    {
      key: 'durationDays',
      label: 'Duration',
      icon: Clock,
      format: (v: number) => formatDuration(v),
      highlight: null,
    },
    {
      key: 'price',
      label: 'Price',
      icon: DollarSign,
      format: (v: number) => formatCurrency(v),
      highlight: null,
    },
    {
      key: 'aumUsd',
      label: 'AUM',
      icon: null,
      format: (v: number) => formatCurrency(v),
      highlight: 'high',
    },
  ]

  const getAssetValue = (asset: Asset, key: string): number => {
    switch (key) {
      case 'apy':
        return asset.apy
      case 'riskScore':
        return asset.riskScore
      case 'yieldConfidence':
        return asset.yieldConfidence
      case 'durationDays':
        return asset.durationDays
      case 'price':
        return asset.price
      case 'aumUsd':
        return asset.aumUsd
      default:
        return 0
    }
  }

  const getBestValue = (key: string, highlight: string | null) => {
    if (!highlight) return null
    const values = assets.map((a) => getAssetValue(a, key))
    if (highlight === 'high') return Math.max(...values)
    if (highlight === 'low') return Math.min(...values)
    return null
  }

  const typeLabels: Record<string, string> = {
    'fixed-income': 'Fixed Income',
    'real-estate': 'Real Estate',
    'private-credit': 'Private Credit',
    alternatives: 'Alternatives',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Compare Assets</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="overflow-auto max-h-[calc(90vh-60px)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-medium text-muted-foreground w-40">
                  Metric
                </th>
                {assets.map((asset) => (
                  <th key={asset.id} className="text-center p-4 font-medium">
                    <div className="space-y-1">
                      <div className="font-semibold">{asset.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {typeLabels[asset.type]}
                      </div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                          asset.status === 'Active'
                            ? 'bg-green-500/10 text-green-500'
                            : asset.status === 'Maturing'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-gray-500/10 text-gray-500'
                        }`}
                      >
                        {asset.status}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => {
                const bestValue = getBestValue(metric.key, metric.highlight)
                return (
                  <tr key={metric.key} className="border-b border-border">
                    <td className="p-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {metric.icon && <metric.icon className="w-4 h-4" />}
                        {metric.label}
                      </div>
                    </td>
                    {assets.map((asset) => {
                      const value = getAssetValue(asset, metric.key)
                      const isBest = bestValue !== null && value === bestValue
                      return (
                        <td key={asset.id} className="p-4 text-center">
                          <span
                            className={`font-medium ${
                              isBest
                                ? 'text-green-500'
                                : metric.key === 'riskScore'
                                  ? (
                                      value < 30
                                        ? 'text-green-500'
                                        : value < 60
                                          ? 'text-yellow-500'
                                          : 'text-red-500'
                                    )
                                  : ''
                            }`}
                          >
                            {metric.format(value)}
                          </span>
                          {isBest && (
                            <span className="ml-2 text-xs text-green-500">
                              Best
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}

              {/* Yield Breakdown */}
              <tr className="border-b border-border bg-secondary/30">
                <td className="p-4 font-medium" colSpan={assets.length + 1}>
                  Yield Breakdown
                </td>
              </tr>
              {(assets[0]?.yieldBreakdown || []).map((_, idx) => (
                <tr key={`yield-${idx}`} className="border-b border-border">
                  <td className="p-4 text-slate-600 text-sm">
                    Component {idx + 1}
                  </td>
                  {assets.map((asset) => {
                    const breakdown = asset.yieldBreakdown?.[idx]
                    return (
                      <td key={asset.id} className="p-4 text-center text-sm">
                        {breakdown ? (
                          <div>
                            <div className="font-medium">{breakdown.label}</div>
                            <div
                              className={`text-xs ${
                                breakdown.impact === 'positive'
                                  ? 'text-green-500'
                                  : breakdown.impact === 'negative'
                                    ? 'text-red-500'
                                    : 'text-muted-foreground'
                              }`}
                            >
                              {breakdown.percentage}%
                            </div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}

              {/* Confidence Factors */}
              <tr className="border-b border-border bg-secondary/30">
                <td className="p-4 font-medium" colSpan={assets.length + 1}>
                  Confidence Factors
                </td>
              </tr>
              {(assets[0]?.confidenceFactors || []).map((_, idx) => (
                <tr key={`conf-${idx}`} className="border-b border-border">
                  <td className="p-4 text-slate-600 text-sm">
                    Factor {idx + 1}
                  </td>
                  {assets.map((asset) => {
                    const factor = asset.confidenceFactors?.[idx]
                    return (
                      <td key={asset.id} className="p-4 text-center text-sm">
                        {factor ? (
                          <div>
                            <div className="font-medium">{factor.label}</div>
                            <div className="text-muted-foreground">
                              {factor.score}/100
                            </div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
