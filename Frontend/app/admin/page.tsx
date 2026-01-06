'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Coins,
  DollarSign,
  FileText,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface DashboardStats {
  totalApplications: number
  pending: number
  approved: number
  rejected: number
  totalAUM: number
  totalUsers: number
  activeInvestments: number
  pendingYields: number
  totalRWABalance: number
  newUsers7d: number
  newInvestments7d: number
  redemptions7d: number
}

interface RecentApplication {
  id: string
  name: string
  type: string
  status: string
  submittedAt: string
  expectedApy: number
}

const formatRWA = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M RWA`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K RWA`
  }
  return `${value.toFixed(2)} RWA`
}

export default function AdminDashboardPage() {
  const { address } = useAccount()
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAUM: 0,
    totalUsers: 0,
    activeInvestments: 0,
    pendingYields: 0,
    totalRWABalance: 0,
    newUsers7d: 0,
    newInvestments7d: 0,
    redemptions7d: 0,
  })
  const [recentApplications, setRecentApplications] = useState<
    RecentApplication[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assetDistribution, setAssetDistribution] = useState<
    { label: string; value: number; percentage: number }[]
  >([])

  useEffect(() => {
    const fetchData = async () => {
      if (!address) return

      try {
        // Fetch applications
        const appResponse = await fetch('/api/admin/applications', {
          headers: { 'x-wallet-address': address },
        })
        const appData = await appResponse.json()

        if (appData.applications) {
          const apps = appData.applications
          setStats((prev) => ({
            ...prev,
            totalApplications: apps.length,
            pending: apps.filter(
              (a: { status: string }) => a.status === 'pending',
            ).length,
            approved: apps.filter(
              (a: { status: string }) => a.status === 'approved',
            ).length,
            rejected: apps.filter(
              (a: { status: string }) => a.status === 'rejected',
            ).length,
          }))

          // Get recent pending applications
          const recent = apps
            .filter((a: { status: string }) => a.status === 'pending')
            .slice(0, 5)
            .map(
              (a: {
                id: string
                name: string
                type: string
                status: string
                submitted_at: string
                expected_apy: number
              }) => ({
                id: a.id,
                name: a.name,
                type: a.type,
                status: a.status,
                submittedAt: a.submitted_at,
                expectedApy: a.expected_apy,
              }),
            )
          setRecentApplications(recent)
        }

        // Fetch platform stats
        const statsResponse = await fetch('/api/admin/stats', {
          headers: { 'x-wallet-address': address },
        })
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats((prev) => ({
            ...prev,
            totalAUM: statsData.totalAUM || 0,
            totalUsers: statsData.totalUsers || 0,
            activeInvestments: statsData.activeInvestments || 0,
            pendingYields: statsData.pendingYields || 0,
            totalRWABalance: statsData.totalRWABalance || 0,
            newUsers7d: statsData.newUsers7d || 0,
            newInvestments7d: statsData.newInvestments7d || 0,
            redemptions7d: statsData.redemptions7d || 0,
          }))
        } else {
          setError('Failed to load platform stats')
        }

        // Fetch asset distribution by AUM
        const assetsResponse = await fetch('/api/admin/assets?status=Active', {
          headers: { 'x-wallet-address': address },
        })
        if (assetsResponse.ok) {
          const assetsData = await assetsResponse.json()
          const assets = assetsData.assets || []
          const totalsByType = assets.reduce(
            (acc: Record<string, number>, asset: any) => {
              const type = asset.type || 'unknown'
              const aum = Number(asset.aum_usd || 0)
              acc[type] = (acc[type] || 0) + aum
              return acc
            },
            {},
          )
          const totalAum = (Object.values(totalsByType) as number[]).reduce(
            (sum, val) => sum + val,
            0,
          )
          const distribution = (
            Object.entries(totalsByType) as [string, number][]
          )
            .map(([type, value]) => ({
              label: typeLabels[type] || type,
              value,
              percentage: totalAum > 0 ? (value / totalAum) * 100 : 0,
            }))
            .sort((a, b) => b.value - a.value)
          setAssetDistribution(distribution)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
        setError('Failed to load platform stats')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [address])

  const statCards = [
    {
      title: 'Total AUM',
      value: formatRWA(stats.totalAUM),
      icon: Coins,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      change: '+12.5%',
      changeType: 'positive',
    },
    {
      title: 'Active Users',
      value: stats.totalUsers.toString(),
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      change: '+8.2%',
      changeType: 'positive',
    },
    {
      title: 'Active Investments',
      value: stats.activeInvestments.toString(),
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      change: '+15.3%',
      changeType: 'positive',
    },
    {
      title: 'Pending Yields',
      value: formatRWA(stats.pendingYields),
      icon: DollarSign,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      change: 'Due in 3 days',
      changeType: 'neutral',
    },
  ]

  const applicationStats = [
    {
      title: 'Pending Review',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Approved',
      value: stats.approved,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Rejected',
      value: stats.rejected,
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Total',
      value: stats.totalApplications,
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ]

  const typeLabels: Record<string, string> = {
    'fixed-income': 'Fixed Income',
    'real-estate': 'Real Estate',
    'private-credit': 'Private Credit',
    alternatives: 'Alternatives',
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-600">Platform overview and key metrics</p>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">
                    {isLoading ? '...' : stat.value}
                  </p>
                  <div
                    className={`flex items-center gap-1 mt-2 text-xs ${
                      stat.changeType === 'positive'
                        ? 'text-green-500'
                        : stat.changeType === 'negative'
                          ? 'text-red-500'
                          : 'text-slate-600'
                    }`}
                  >
                    {stat.changeType === 'positive' && (
                      <ArrowUpRight className="w-3 h-3" />
                    )}
                    {stat.changeType === 'negative' && (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Application Stats & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Overview */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Application Overview</CardTitle>
            <Link href="/admin/applications">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {applicationStats.map((stat) => (
                <div
                  key={stat.title}
                  className="text-center p-4 rounded-lg bg-secondary/50"
                >
                  <div
                    className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${stat.bgColor}`}
                  >
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold">
                    {isLoading ? '...' : stat.value}
                  </p>
                  <p className="text-xs text-slate-600">{stat.title}</p>
                </div>
              ))}
            </div>

            {/* Recent Pending Applications */}
            {recentApplications.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">
                  Recent Pending Applications
                </h4>
                <div className="space-y-2">
                  {recentApplications.map((app) => (
                    <Link
                      key={app.id}
                      href={`/admin/applications/${app.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-yellow-500/20 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-yellow-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{app.name}</p>
                          <p className="text-xs text-slate-600">
                            {typeLabels[app.type] || app.type} 锟?
                            {app.expectedApy}% APY
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-600">
                        {new Date(app.submittedAt).toLocaleDateString()}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {recentApplications.length === 0 && !isLoading && (
              <div className="text-center py-8 text-slate-600">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No pending applications</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/applications?status=pending" className="block">
              <Button variant="outline" className="w-full justify-start gap-3">
                <Clock className="w-4 h-4 text-yellow-500" />
                Review Pending ({stats.pending})
              </Button>
            </Link>
            <Link href="/admin/assets" className="block">
              <Button variant="outline" className="w-full justify-start gap-3">
                <Coins className="w-4 h-4 text-primary" />
                Manage Assets
              </Button>
            </Link>
            <Link href="/admin/users" className="block">
              <Button variant="outline" className="w-full justify-start gap-3">
                <Users className="w-4 h-4 text-blue-500" />
                View Users
              </Button>
            </Link>
            <Link href="/admin/yields" className="block">
              <Button variant="outline" className="w-full justify-start gap-3">
                <DollarSign className="w-4 h-4 text-green-500" />
                Distribute Yields
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Platform Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <h4 className="font-medium mb-2">Asset Distribution</h4>
              <div className="space-y-2 text-sm">
                {assetDistribution.length === 0 ? (
                  <div className="text-slate-600">No active assets</div>
                ) : (
                  assetDistribution.map((item) => (
                    <div key={item.label} className="flex justify-between">
                      <span className="text-slate-600">{item.label}</span>
                      <span>{item.percentage.toFixed(1)}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
              <h4 className="font-medium mb-2">RWA Balances</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total RWA Balance</span>
                  <span>{formatRWA(stats.totalRWABalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Pending Yields</span>
                  <span>{formatRWA(stats.pendingYields)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
              <h4 className="font-medium mb-2">User Activity (7 Days)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">New Users</span>
                  <span>+{stats.newUsers7d}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">New Investments</span>
                  <span>+{stats.newInvestments7d}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Redemptions</span>
                  <span>{stats.redemptions7d}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
