'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeft,
  Bot,
  Calendar,
  Clock,
  Copy,
  DollarSign,
  ExternalLink,
  Plus,
  TrendingUp,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'

import AddPositionModal from '@/components/AddPositionModal'
import RedeemModal from '@/components/RedeemModal'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import usePortfolio from '@/lib/hooks/usePortfolio'
import {
  formatCurrency,
  formatDuration,
  getAssetTypeColor,
  getAssetTypeLabel,
  getRiskLevel,
  type Asset,
} from '@/lib/mockData'

export default function AssetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const { portfolio } = usePortfolio()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [showRealWorld, setShowRealWorld] = useState(false)
  const [asset, setAsset] = useState<Asset | null>(null)
  const [userPosition, setUserPosition] = useState({ shares: 0, amount: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchAsset = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/assets/${id}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('Asset not found')
          } else {
            setError('Failed to load asset')
          }
          setLoading(false)
          return
        }
        const data = await response.json()
        setAsset(data.asset)
        setUserPosition(data.userPosition)
      } catch (err) {
        setError('Failed to load asset')
        console.error('Error fetching asset:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAsset()
  }, [id])

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Loading...</h1>
        </div>
      </div>
    )
  }

  if (error || !asset) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">
            {error || 'Asset Not Found'}
          </h1>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const shares = userPosition.shares
  const positionValue = userPosition.amount
  const riskLevel = getRiskLevel(asset.riskScore)

  const yieldChartData = (asset.yieldHistory || []).map((value, index) => ({
    day: index + 1,
    yield: value * 100,
  }))

  const navChartData = (asset.navHistory || []).map((value, index) => ({
    day: index + 1,
    nav: value,
  }))

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    toast.success('Copied', {
      description: 'Address copied to clipboard',
    })
  }

  const openExplorer = (address: string) => {
    window.open(
      `https://explorer.testnet.mantle.xyz/address/${address}`,
      '_blank',
    )
  }

  const getImpactBadgeClass = (impact: string) => {
    switch (impact) {
      case 'positive':
        return 'text-green-400'
      case 'negative':
        return 'text-red-400'
      default:
        return 'text-muted-foreground'
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'Maturing':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'Paused':
        return 'bg-muted text-slate-600 border-border'
      default:
        return 'bg-muted text-slate-600 border-border'
    }
  }

  return (
    <div className="h-full flex flex-col">
      <main className="flex-1 p-6 overflow-y-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold mb-2">{asset.name}</h1>
            <div className="flex items-center gap-3">
              <span className={`status-badge ${getAssetTypeColor(asset.type)}`}>
                {getAssetTypeLabel(asset.type)}
              </span>
              <span
                className={`status-badge border ${getStatusBadgeClass(asset.status)}`}
              >
                {asset.status}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Position
            </Button>
            {shares > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowRedeemModal(true)}
              >
                <ArrowDownToLine className="w-4 h-4 mr-2" />
                Redeem
              </Button>
            )}
            <Button onClick={() => router.push(`/copilot?asset=${asset.id}`)}>
              <Bot className="w-4 h-4 mr-2" />
              Ask Copilot
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 mb-6">
          <div className="metric-card">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="metric-label">APY</span>
            </div>
            <div className="metric-value text-green-400">{asset.apy}%</div>
          </div>

          <div className="metric-card">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-primary" />
              <span className="metric-label">Duration</span>
            </div>
            <div className="metric-value">
              {formatDuration(asset.durationDays)}
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="metric-label">Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="metric-value">{asset.riskScore}</span>
              <span
                className={`status-badge text-xs ${
                  riskLevel === 'Low'
                    ? 'risk-low'
                    : riskLevel === 'Medium'
                      ? 'risk-medium'
                      : 'risk-high'
                }`}
              >
                {riskLevel}
              </span>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="metric-label">Price</span>
            </div>
            <div className="metric-value">{formatCurrency(asset.price)}</div>
          </div>

          <div className="metric-card">
            <div className="metric-label mb-1">Your Units</div>
            <div className="metric-value">{shares}</div>
            <div className="metric-subtext">
              {formatCurrency(positionValue)}
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="metric-label">Next Payout</span>
            </div>
            <div className="metric-value text-lg">
              {new Date(asset.nextPayoutDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="metric-card">
            <h3 className="font-medium mb-4">Yield Breakdown</h3>
            <div className="space-y-4">
              {(asset.yieldBreakdown || []).map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.label}</span>
                    <span className={getImpactBadgeClass(item.impact)}>
                      {item.percentage}%
                    </span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Yield Confidence</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Explainable
                </span>
                <Switch
                  checked={showRealWorld}
                  onCheckedChange={setShowRealWorld}
                />
              </div>
            </div>

            {showRealWorld && asset.realWorld ? (
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium">
                    {asset.realWorld.title}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {asset.realWorld.summary}
                  </p>
                </div>
                <div className="space-y-2">
                  {asset.realWorld.keyFacts.map((fact) => (
                    <div
                      key={fact.label}
                      className="flex justify-between text-xs"
                    >
                      <span className="text-muted-foreground">
                        {fact.label}
                      </span>
                      <span>{fact.value}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  {asset.realWorld.verification.map((item) => (
                    <div key={item} className="text-xs text-slate-600">
                      锟?{item}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-3xl font-semibold">
                  {asset.yieldConfidence}%
                </div>
                <Progress value={asset.yieldConfidence} className="h-2" />
                <div className="space-y-3">
                  {(asset.confidenceFactors || []).map((factor) => (
                    <div key={factor.label} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{factor.label}</span>
                        <span className="text-muted-foreground">
                          {factor.score}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {factor.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="metric-card">
            <h3 className="font-medium mb-4">30D Yield History</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height={192} minWidth={0}>
                <LineChart data={yieldChartData}>
                  <XAxis dataKey="day" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number | undefined) => [
                      value ? `${value.toFixed(2)}%` : '0%',
                      'Yield',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="yield"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="metric-card">
            <h3 className="font-medium mb-4">30D NAV Trend</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height={192} minWidth={0}>
                <AreaChart data={navChartData}>
                  <XAxis dataKey="day" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number | undefined) => [
                      value ? formatCurrency(value) : '$0',
                      'NAV',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="nav"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="metric-card">
            <h3 className="font-medium mb-4">Cash Flow Sources</h3>
            <div className="space-y-3">
              {(asset.cashFlowSources || []).map((source) => (
                <div
                  key={source.source}
                  className="p-3 bg-secondary rounded-lg"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{source.source}</span>
                    <span className="text-xs text-muted-foreground">
                      {source.frequency}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    {source.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="metric-card">
            <h3 className="font-medium mb-4">On-chain Info</h3>
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Token Address
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs truncate">{asset.tokenAddress}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => copyAddress(asset.tokenAddress || '')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => openExplorer(asset.tokenAddress || '')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Distributor Address
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs truncate">
                    {asset.distributorAddress}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() =>
                        copyAddress(asset.distributorAddress || '')
                      }
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() =>
                        openExplorer(asset.distributorAddress || '')
                      }
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showAddModal && (
        <AddPositionModal
          asset={asset}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showRedeemModal && (
        <RedeemModal asset={asset} onClose={() => setShowRedeemModal(false)} />
      )}
    </div>
  )
}
