'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  Coins,
  DollarSign,
  Download,
  Play,
  RefreshCw,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useAdmin, hasPermission } from '@/lib/hooks/useAdmin'

interface YieldDistribution {
  id: string
  asset_id: string
  asset_name: string
  total_amount: number
  recipient_count: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  scheduled_date: string
  executed_at: string | null
  tx_hash: string | null
}

interface AssetYieldInfo {
  id: string
  name: string
  type: string
  apy: number
  total_invested: number
  pending_yield: number
  investor_count: number
  next_payout_date: string
  last_payout_date: string | null
}

const formatRWA = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M RWA`
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K RWA`
  return `${value.toFixed(2)} RWA`
}

export default function YieldsPage() {
  const { address } = useAccount()
  const { admin } = useAdmin()
  const [assets, setAssets] = useState<AssetYieldInfo[]>([])
  const [history, setHistory] = useState<YieldDistribution[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDistributeModal, setShowDistributeModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<AssetYieldInfo | null>(
    null,
  )
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!address) return

      setIsLoading(true)
      try {
        const response = await fetch('/api/admin/yields', {
          headers: { 'x-wallet-address': address },
        })

        if (response.ok) {
          const data = await response.json()
          setAssets(data.assets || [])
          setHistory(data.history || [])
        } else {
          console.error('Failed to fetch yield data')
          setAssets([])
          setHistory([])
        }
      } catch (error) {
        console.error('Failed to fetch yield data:', error)
        setAssets([])
        setHistory([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [address])

  const openDistributeModal = (asset: AssetYieldInfo) => {
    setSelectedAsset(asset)
    setShowDistributeModal(true)
  }

  const handleDistribute = async () => {
    if (!address || !selectedAsset) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/admin/yields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address,
        },
        body: JSON.stringify({ asset_id: selectedAsset.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to distribute yields')
      }

      const data = await response.json()

      toast.success(`Yield distribution completed for ${selectedAsset.name}`)

      // Update local state
      setAssets((prev) =>
        prev.map((a) =>
          a.id === selectedAsset.id
            ? {
                ...a,
                pending_yield: 0,
                last_payout_date: new Date().toISOString(),
              }
            : a,
        ),
      )

      setHistory((prev) => [data.distribution, ...prev])

      setShowDistributeModal(false)
    } catch (error) {
      console.error('Distribution error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to distribute yields',
      )
    } finally {
      setIsProcessing(false)
    }
  }

  // Calculate totals
  const totalPendingYield = assets.reduce((sum, a) => sum + a.pending_yield, 0)
  const totalInvestors =
    new Set(assets.flatMap((a) => Array(a.investor_count).fill(0))).size ||
    assets.reduce((sum, a) => sum + a.investor_count, 0)
  const totalDistributed = history.reduce((sum, h) => sum + h.total_amount, 0)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500">
            Completed
          </span>
        )
      case 'processing':
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500">
            Processing
          </span>
        )
      case 'pending':
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500">
            Pending
          </span>
        )
      case 'failed':
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-500">
            Failed
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Yield Distribution</h1>
          <p className="text-slate-600">
            Manage and execute yield payouts to investors
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Pending Yields</p>
                <p className="text-xl font-bold">
                  {formatRWA(totalPendingYield)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Distributed</p>
                <p className="text-xl font-bold">
                  {formatRWA(totalDistributed)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Investors</p>
                <p className="text-xl font-bold">{totalInvestors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Coins className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Assets with Yields</p>
                <p className="text-xl font-bold">
                  {assets.filter((a) => a.pending_yield > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Distributions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Pending Distributions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-slate-600">
              Loading yield data...
            </div>
          ) : assets.filter((a) => a.pending_yield > 0).length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No pending yield distributions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assets
                .filter((a) => a.pending_yield > 0)
                .map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-yellow-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">{asset.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-slate-600 mt-1">
                          <span>{asset.apy}% APY</span>
                          <span>•</span>
                          <span>{asset.investor_count} investors</span>
                          <span>•</span>
                          <span>
                            Total Invested: {formatRWA(asset.total_invested)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-yellow-500">
                          {formatRWA(asset.pending_yield)}
                        </p>
                        <p className="text-xs text-slate-600">
                          Due:{' '}
                          {new Date(
                            asset.next_payout_date,
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      {hasPermission(admin?.role, 'admin') && (
                        <Button onClick={() => openDistributeModal(asset)}>
                          <Play className="w-4 h-4 mr-2" />
                          Distribute
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribution History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Distribution History
          </CardTitle>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No distribution history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((dist) => (
                <div
                  key={dist.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">{dist.asset_name}</h4>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span>{dist.recipient_count} recipients</span>
                        <span>•</span>
                        <span>
                          {dist.executed_at &&
                            new Date(dist.executed_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-green-500">
                        {formatRWA(dist.total_amount)}
                      </p>
                      {getStatusBadge(dist.status)}
                    </div>
                    {dist.tx_hash && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `https://explorer.mantle.xyz/tx/${dist.tx_hash}`,
                            '_blank',
                          )
                        }
                      >
                        View Tx
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribution Confirmation Modal */}
      <Dialog open={showDistributeModal} onOpenChange={setShowDistributeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Yield Distribution</DialogTitle>
            <DialogDescription>
              Review the distribution details before proceeding
            </DialogDescription>
          </DialogHeader>

          {selectedAsset && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-secondary/50">
                <h4 className="font-medium mb-3">{selectedAsset.name}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Amount</span>
                    <span className="font-bold text-yellow-500">
                      {formatRWA(selectedAsset.pending_yield)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Recipients</span>
                    <span>{selectedAsset.investor_count} investors</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Avg per Investor</span>
                    <span>
                      {formatRWA(
                        selectedAsset.pending_yield /
                          selectedAsset.investor_count,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                <p className="text-sm text-yellow-500">
                  This action will distribute{' '}
                  {formatRWA(selectedAsset.pending_yield)} to{' '}
                  {selectedAsset.investor_count} investors. This action cannot
                  be undone.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDistributeModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleDistribute}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Execute Distribution
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
