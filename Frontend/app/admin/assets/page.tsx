'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import {
  Edit,
  Eye,
  EyeOff,
  MoreHorizontal,
  Package,
  Pause,
  Play,
  Plus,
  Search,
  Settings,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useAdmin, hasPermission } from '@/lib/hooks/useAdmin'
import type { AssetType, AssetStatus } from '@/lib/supabase'

interface Asset {
  id: string
  name: string
  type: AssetType
  apy: number
  aum_usd: number
  risk_score: number
  status: AssetStatus
  price: number
  duration_days: number
  created_at: string
  total_investors?: number
}

const statusConfig: Record<AssetStatus, { label: string; color: string }> = {
  Active: { label: 'Active', color: 'text-green-500 bg-green-500/10' },
  Maturing: { label: 'Maturing', color: 'text-yellow-500 bg-yellow-500/10' },
  Paused: { label: 'Paused', color: 'text-red-500 bg-red-500/10' },
}

const typeLabels: Record<AssetType, string> = {
  'fixed-income': 'Fixed Income',
  'real-estate': 'Real Estate',
  'private-credit': 'Private Credit',
  alternatives: 'Alternatives',
}

const formatRWA = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M RWA`
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K RWA`
  return `${value.toFixed(2)} RWA`
}

export default function AssetsPage() {
  const router = useRouter()
  const { address } = useAccount()
  const { admin } = useAdmin()
  const [assets, setAssets] = useState<Asset[]>([])
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [editForm, setEditForm] = useState({
    apy: '',
    price: '',
    status: '',
  })
  const [isProcessing, setIsProcessing] = useState(false)

  const fetchAssets = async () => {
    if (!address) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/assets', {
        headers: { 'x-wallet-address': address },
      })
      const data = await response.json()
      setAssets(data.assets || [])
    } catch (error) {
      console.error('Failed to fetch assets:', error)
      toast.error('Failed to load assets')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [address])

  useEffect(() => {
    let filtered = assets

    if (statusFilter !== 'all') {
      filtered = filtered.filter((asset) => asset.status === statusFilter)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (asset) =>
          asset.name.toLowerCase().includes(term) ||
          asset.type.toLowerCase().includes(term),
      )
    }

    setFilteredAssets(filtered)
  }, [assets, statusFilter, searchTerm])

  const handleToggleStatus = async (asset: Asset) => {
    if (!address) return

    const newStatus = asset.status === 'Active' ? 'Paused' : 'Active'
    setIsProcessing(true)

    try {
      const response = await fetch(`/api/admin/assets/${asset.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success(
          `Asset ${newStatus === 'Active' ? 'activated' : 'paused'}`,
        )
        fetchAssets()
      } else {
        throw new Error('Failed to update')
      }
    } catch (error) {
      toast.error('Failed to update asset status')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async (asset: Asset) => {
    if (!address) return
    if (
      !confirm(
        `Are you sure you want to delete "${asset.name}"? This action cannot be undone.`,
      )
    )
      return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/assets/${asset.id}`, {
        method: 'DELETE',
        headers: { 'x-wallet-address': address },
      })

      if (response.ok) {
        toast.success('Asset deleted successfully')
        fetchAssets()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete asset')
      }
    } catch (error) {
      toast.error('Failed to delete asset')
    } finally {
      setIsProcessing(false)
    }
  }

  const openEditModal = (asset: Asset) => {
    setSelectedAsset(asset)
    setEditForm({
      apy: asset.apy.toString(),
      price: asset.price.toString(),
      status: asset.status,
    })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!address || !selectedAsset) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/assets/${selectedAsset.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address,
        },
        body: JSON.stringify({
          apy: parseFloat(editForm.apy),
          price: parseFloat(editForm.price),
          status: editForm.status,
        }),
      })

      if (response.ok) {
        toast.success('Asset updated successfully')
        setShowEditModal(false)
        fetchAssets()
      } else {
        throw new Error('Failed to update')
      }
    } catch (error) {
      toast.error('Failed to update asset')
    } finally {
      setIsProcessing(false)
    }
  }

  const filterTabs = [
    { key: 'all', label: 'All', count: assets.length },
    {
      key: 'Active',
      label: 'Active',
      count: assets.filter((a) => a.status === 'Active').length,
    },
    {
      key: 'Paused',
      label: 'Paused',
      count: assets.filter((a) => a.status === 'Paused').length,
    },
    {
      key: 'Maturing',
      label: 'Maturing',
      count: assets.filter((a) => a.status === 'Maturing').length,
    },
  ]

  // Calculate totals
  const totalAUM = assets
    .filter((a) => a.status === 'Active')
    .reduce((sum, a) => sum + a.aum_usd, 0)
  const avgAPY =
    assets.length > 0
      ? assets.reduce((sum, a) => sum + a.apy, 0) / assets.length
      : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Listed Assets</h1>
          <p className="text-slate-600">
            Manage assets currently listed on the platform
          </p>
        </div>
        <Button
          onClick={() => router.push('/admin/applications?status=approved')}
        >
          <Plus className="w-4 h-4 mr-2" />
          List New Asset
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Assets</p>
                <p className="text-xl font-bold">{assets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Eye className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Active</p>
                <p className="text-xl font-bold">
                  {assets.filter((a) => a.status === 'Active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total AUM</p>
                <p className="text-xl font-bold">{formatRWA(totalAUM)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <TrendingUp className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Avg APY</p>
                <p className="text-xl font-bold">{avgAPY.toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <Input
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {filterTabs.map((tab) => (
            <Button
              key={tab.key}
              variant={statusFilter === tab.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(tab.key)}
              className="gap-2"
            >
              {tab.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  statusFilter === tab.key
                    ? 'bg-primary-foreground/20'
                    : 'bg-secondary'
                }`}
              >
                {tab.count}
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-slate-600">
            Loading assets...
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-600">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No assets found</p>
          </div>
        ) : (
          filteredAssets.map((asset) => {
            const status = statusConfig[asset.status]

            return (
              <Card key={asset.id} className="relative overflow-hidden">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{asset.name}</h3>
                      <p className="text-sm text-slate-600">
                        {typeLabels[asset.type]}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${status.color}`}
                      >
                        {status.label}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/asset/${asset.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Public Page
                          </DropdownMenuItem>
                          {hasPermission(admin?.role, 'admin') && (
                            <>
                              <DropdownMenuItem
                                onClick={() => openEditModal(asset)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Asset
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(asset)}
                              >
                                {asset.status === 'Active' ? (
                                  <>
                                    <Pause className="w-4 h-4 mr-2" />
                                    Pause Asset
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Activate Asset
                                  </>
                                )}
                              </DropdownMenuItem>
                              {admin?.role === 'super_admin' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-500"
                                    onClick={() => handleDelete(asset)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Asset
                                  </DropdownMenuItem>
                                </>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <p className="text-xs text-slate-600">APY</p>
                      <p className="text-lg font-semibold text-green-500">
                        {asset.apy}%
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <p className="text-xs text-slate-600">Price</p>
                      <p className="text-lg font-semibold">{asset.price} RWA</p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">AUM</span>
                      <span>{formatRWA(asset.aum_usd)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Risk Score</span>
                      <span
                        className={
                          asset.risk_score <= 30
                            ? 'text-green-500'
                            : asset.risk_score <= 60
                              ? 'text-yellow-500'
                              : 'text-red-500'
                        }
                      >
                        {asset.risk_score}/100
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Duration</span>
                      <span>{asset.duration_days} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Listed</span>
                      <span>
                        {new Date(asset.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>
              Update settings for &quot;{selectedAsset?.name}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">APY (%)</label>
              <Input
                type="number"
                step="0.01"
                value={editForm.apy}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, apy: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Price (RWA)</label>
              <Input
                type="number"
                step="0.01"
                value={editForm.price}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, price: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <div className="flex gap-2">
                {(['Active', 'Paused', 'Maturing'] as AssetStatus[]).map(
                  (status) => (
                    <Button
                      key={status}
                      variant={
                        editForm.status === status ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() =>
                        setEditForm((prev) => ({ ...prev, status }))
                      }
                      className={
                        editForm.status === status
                          ? ''
                          : statusConfig[status].color
                      }
                    >
                      {status}
                    </Button>
                  ),
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveEdit}
                disabled={isProcessing}
              >
                {isProcessing ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
