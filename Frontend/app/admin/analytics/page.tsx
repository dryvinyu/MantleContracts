'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Coins,
  Gauge,
  ShieldAlert,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AdminStats {
  totalAUM: number
  totalUsers: number
  activeInvestments: number
  pendingYields: number
  totalRWABalance: number
  newUsers7d: number
  newInvestments7d: number
  redemptions7d: number
}

interface AdminAsset {
  id: string
  name: string
  type: string
  status: 'Active' | 'Paused' | 'Maturing'
  aum_usd: number
  apy: number
  risk_score: number
}

interface AdminUser {
  id: string
  kyc_status: 'pending' | 'verified' | 'rejected'
  is_frozen: boolean
}

interface AdminApplication {
  id: string
  status:
    | 'pending'
    | 'reviewing'
    | 'approved'
    | 'rejected'
    | 'changes_requested'
    | 'draft'
}

const typeLabels: Record<string, string> = {
  'fixed-income': 'Fixed Income',
  'real-estate': 'Real Estate',
  'private-credit': 'Private Credit',
  alternatives: 'Alternatives',
}

const chartColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

const formatRWA = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M RWA`
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K RWA`
  return `${value.toFixed(2)} RWA`
}

const formatPercent = (value: number) => `${value.toFixed(1)}%`

export default function AdminAnalyticsPage() {
  const { address } = useAccount()
  const [stats, setStats] = useState<AdminStats>({
    totalAUM: 0,
    totalUsers: 0,
    activeInvestments: 0,
    pendingYields: 0,
    totalRWABalance: 0,
    newUsers7d: 0,
    newInvestments7d: 0,
    redemptions7d: 0,
  })
  const [assets, setAssets] = useState<AdminAsset[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [applications, setApplications] = useState<AdminApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!address) return

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [statsRes, assetsRes, usersRes, appsRes] = await Promise.all([
          fetch('/api/admin/stats', {
            headers: { 'x-wallet-address': address },
          }),
          fetch('/api/admin/assets', {
            headers: { 'x-wallet-address': address },
          }),
          fetch('/api/admin/users', {
            headers: { 'x-wallet-address': address },
          }),
          fetch('/api/admin/applications', {
            headers: { 'x-wallet-address': address },
          }),
        ])

        const statsData = statsRes.ok ? await statsRes.json() : null
        const assetsData = assetsRes.ok ? await assetsRes.json() : null
        const usersData = usersRes.ok ? await usersRes.json() : null
        const appsData = appsRes.ok ? await appsRes.json() : null

        if (statsData) {
          setStats({
            totalAUM: statsData.totalAUM || 0,
            totalUsers: statsData.totalUsers || 0,
            activeInvestments: statsData.activeInvestments || 0,
            pendingYields: statsData.pendingYields || 0,
            totalRWABalance: statsData.totalRWABalance || 0,
            newUsers7d: statsData.newUsers7d || 0,
            newInvestments7d: statsData.newInvestments7d || 0,
            redemptions7d: statsData.redemptions7d || 0,
          })
        }

        setAssets(assetsData?.assets || [])
        setUsers(usersData?.users || [])
        setApplications(appsData?.applications || [])
      } catch (fetchError) {
        console.error('Failed to fetch analytics data:', fetchError)
        setError('Failed to load analytics data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [address])

  const activeAssets = useMemo(
    () => assets.filter((asset) => asset.status === 'Active'),
    [assets],
  )

  const totalAum = useMemo(
    () => activeAssets.reduce((sum, asset) => sum + (asset.aum_usd || 0), 0),
    [activeAssets],
  )

  const typeDistribution = useMemo(() => {
    const totals = activeAssets.reduce((acc: Record<string, number>, asset) => {
      const type = asset.type || 'unknown'
      acc[type] = (acc[type] || 0) + (asset.aum_usd || 0)
      return acc
    }, {})
    return Object.entries(totals)
      .map(([type, value]) => ({
        label: typeLabels[type] || type,
        value,
      }))
      .sort((a, b) => b.value - a.value)
  }, [activeAssets])

  const riskDistribution = useMemo(() => {
    const buckets = [
      { label: 'Low (0-30)', count: 0, aum: 0 },
      { label: 'Medium (31-60)', count: 0, aum: 0 },
      { label: 'High (61+)', count: 0, aum: 0 },
    ]
    activeAssets.forEach((asset) => {
      const score = asset.risk_score || 0
      const bucketIndex = score <= 30 ? 0 : score <= 60 ? 1 : 2
      buckets[bucketIndex].count += 1
      buckets[bucketIndex].aum += asset.aum_usd || 0
    })
    return buckets
  }, [activeAssets])

  const topAssets = useMemo(
    () =>
      [...activeAssets]
        .sort((a, b) => (b.aum_usd || 0) - (a.aum_usd || 0))
        .slice(0, 5),
    [activeAssets],
  )

  const pendingApplications = applications.filter(
    (app) => app.status === 'pending',
  ).length
  const frozenUsers = users.filter((user) => user.is_frozen).length
  const kycPending = users.filter(
    (user) => user.kyc_status === 'pending',
  ).length
  const kycPendingRate =
    users.length > 0 ? (kycPending / users.length) * 100 : 0

  const highRiskAum = riskDistribution[2]?.aum || 0
  const highRiskShare = totalAum > 0 ? (highRiskAum / totalAum) * 100 : 0

  const healthSignals = [
    {
      label: 'Pending Applications',
      value: pendingApplications.toString(),
      status:
        pendingApplications > 8
          ? 'critical'
          : pendingApplications > 3
            ? 'warn'
            : 'good',
      description: 'Backlog for new listings.',
      icon: Clock,
    },
    {
      label: 'KYC Pending Rate',
      value: formatPercent(kycPendingRate),
      status:
        kycPendingRate > 25
          ? 'critical'
          : kycPendingRate > 10
            ? 'warn'
            : 'good',
      description: 'Users awaiting verification.',
      icon: ShieldAlert,
    },
    {
      label: 'Frozen Accounts',
      value: frozenUsers.toString(),
      status: frozenUsers > 5 ? 'warn' : 'good',
      description: 'Frozen wallets needing review.',
      icon: AlertTriangle,
    },
    {
      label: 'High Risk AUM Share',
      value: formatPercent(highRiskShare),
      status:
        highRiskShare > 50 ? 'critical' : highRiskShare > 30 ? 'warn' : 'good',
      description: 'Exposure to high-risk assets.',
      icon: Gauge,
    },
  ]

  const statusStyle = (status: 'good' | 'warn' | 'critical') => {
    if (status === 'good')
      return 'bg-green-500/10 text-green-500 border-green-500/20'
    if (status === 'warn')
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    return 'bg-red-500/10 text-red-500 border-red-500/20'
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-slate-600">
          Platform insights and operational health
        </p>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total AUM</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : formatRWA(totalAum || stats.totalAUM)}
                </p>
                <p className="text-xs text-slate-600 mt-2">
                  Active assets only
                </p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <Coins className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Users</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : stats.totalUsers}
                </p>
                <p className="text-xs text-slate-600 mt-2">
                  +{stats.newUsers7d} in 7 days
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Investments</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : stats.activeInvestments}
                </p>
                <p className="text-xs text-slate-600 mt-2">
                  +{stats.newInvestments7d} in 7 days
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <Activity className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pending Yields</p>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : formatRWA(stats.pendingYields)}
                </p>
                <p className="text-xs text-slate-600 mt-2">
                  {stats.redemptions7d} redemptions in 7 days
                </p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <BarChart3 className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Analysis */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Asset Type AUM</CardTitle>
          </CardHeader>
          <CardContent>
            {typeDistribution.length === 0 ? (
              <div className="text-sm text-slate-600 py-10 text-center">
                No active assets
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {typeDistribution.map((entry, index) => (
                        <Cell
                          key={entry.label}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number | undefined) => [
                        value ? formatRWA(value) : '0',
                        'AUM',
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-4 space-y-2 text-sm">
              {typeDistribution.map((item, index) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          chartColors[index % chartColors.length],
                      }}
                    />
                    <span className="text-slate-600">{item.label}</span>
                  </div>
                  <span className="font-medium">{formatRWA(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Risk Distribution (AUM)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskDistribution}>
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number | undefined) => [
                      value ? formatRWA(value) : '0',
                      'AUM',
                    ]}
                  />
                  <Bar dataKey="aum" radius={[6, 6, 0, 0]}>
                    {riskDistribution.map((entry, index) => (
                      <Cell
                        key={entry.label}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              {riskDistribution.map((bucket, index) => (
                <div
                  key={bucket.label}
                  className="p-3 rounded-lg bg-secondary/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">{bucket.label}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${chartColors[index % chartColors.length]}20`,
                        color: chartColors[index % chartColors.length],
                      }}
                    >
                      {bucket.count} assets
                    </span>
                  </div>
                  <div className="text-lg font-semibold mt-2">
                    {formatRWA(bucket.aum)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Assets by AUM</CardTitle>
        </CardHeader>
        <CardContent>
          {topAssets.length === 0 ? (
            <div className="text-sm text-slate-600 py-8 text-center">
              No active assets
            </div>
          ) : (
            <div className="space-y-3">
              {topAssets.map((asset, index) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/60 bg-secondary/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{asset.name}</div>
                      <div className="text-xs text-slate-600">
                        {typeLabels[asset.type] || asset.type} · {asset.apy}%
                        APY
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {formatRWA(asset.aum_usd || 0)}
                    </div>
                    <div className="text-xs text-slate-600">
                      Risk {asset.risk_score}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operational Health */}
      <Card>
        <CardHeader>
          <CardTitle>Operational Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {healthSignals.map((signal) => {
              const Icon = signal.icon
              return (
                <div
                  key={signal.label}
                  className="p-4 rounded-lg border border-border/60 bg-secondary/20"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-600">{signal.label}</p>
                      <p className="text-2xl font-bold mt-1">{signal.value}</p>
                      <p className="text-xs text-slate-600 mt-2">
                        {signal.description}
                      </p>
                    </div>
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center ${statusStyle(signal.status)}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-border/60 bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Healthy assets
              </div>
              <div className="text-2xl font-semibold mt-2">
                {activeAssets.length}
              </div>
              <div className="text-xs text-slate-600 mt-1">Active listings</div>
            </div>
            <div className="p-4 rounded-lg border border-border/60 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Assets paused
              </div>
              <div className="text-2xl font-semibold mt-2">
                {assets.filter((asset) => asset.status === 'Paused').length}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Require manual review
              </div>
            </div>
            <div className="p-4 rounded-lg border border-border/60 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4 text-blue-500" />
                Pending reviews
              </div>
              <div className="text-2xl font-semibold mt-2">
                {pendingApplications}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Applications waiting
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
