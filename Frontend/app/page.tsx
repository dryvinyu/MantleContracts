'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Filter,
  TrendingUp,
  AlertTriangle,
  ArrowUpDown,
  LayoutGrid,
  List,
  Loader2,
  GitCompare,
  Heart,
  Wallet,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import AddPositionModal from '@/components/AddPositionModal'
import AssetCompareModal from '@/components/AssetCompareModal'
import { type Asset, formatCurrency } from '@/lib/mockData'
import { useWallet } from '@/lib/hooks/useWallet'

const typeColors: Record<string, string> = {
  'fixed-income': 'bg-blue-500/10 text-blue-500',
  'real-estate': 'bg-green-500/10 text-green-500',
  'private-credit': 'bg-purple-500/10 text-purple-500',
  alternatives: 'bg-orange-500/10 text-orange-500',
}

const typeLabels: Record<string, string> = {
  'fixed-income': 'Fixed Income',
  'real-estate': 'Real Estate',
  'private-credit': 'Private Credit',
  alternatives: 'Alternatives',
}

type SortField = 'name' | 'apy' | 'riskScore' | 'aumUsd' | 'price'
type SortDirection = 'asc' | 'desc'
type ViewMode = 'grid' | 'list'

export default function MarketplacePage() {
  const router = useRouter()
  const { isConnected, connect } = useWallet()
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('apy')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const [compareMode, setCompareMode] = useState(false)
  const [compareAssets, setCompareAssets] = useState<Asset[]>([])
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch('/api/assets')
        if (!response.ok) throw new Error('Failed to fetch assets')
        const data = await response.json()
        setAssets(data.assets || [])
      } catch (err) {
        console.error('Error fetching assets:', err)
        setError('Failed to load assets')
      } finally {
        setIsLoading(false)
      }
    }
    fetchAssets()

    const savedFavorites = localStorage.getItem('assetFavorites')
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('assetFavorites', JSON.stringify([...favorites]))
  }, [favorites])

  const filteredAssets = useMemo(() => {
    let result = [...assets]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (asset) =>
          asset.name.toLowerCase().includes(query) ||
          asset.type.toLowerCase().includes(query),
      )
    }

    if (typeFilter !== 'all') {
      result = result.filter((asset) => asset.type === typeFilter)
    }

    if (statusFilter !== 'all') {
      result = result.filter((asset) => asset.status === statusFilter)
    }

    if (riskFilter !== 'all') {
      if (riskFilter === 'low')
        result = result.filter((asset) => asset.riskScore <= 30)
      else if (riskFilter === 'medium')
        result = result.filter(
          (asset) => asset.riskScore > 30 && asset.riskScore <= 60,
        )
      else if (riskFilter === 'high')
        result = result.filter((asset) => asset.riskScore > 60)
    }

    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'apy':
          comparison = a.apy - b.apy
          break
        case 'riskScore':
          comparison = a.riskScore - b.riskScore
          break
        case 'aumUsd':
          comparison = a.aumUsd - b.aumUsd
          break
        case 'price':
          comparison = a.price - b.price
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [
    assets,
    searchQuery,
    typeFilter,
    statusFilter,
    riskFilter,
    sortField,
    sortDirection,
  ])

  const handleSort = (field: SortField) => {
    if (sortField === field)
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleRowClick = (assetId: string) => router.push(`/assets/${assetId}`)

  const handleInvestClick = (e: React.MouseEvent, asset: Asset) => {
    e.stopPropagation()
    if (!isConnected) {
      connect()
      return
    }
    setSelectedAsset(asset)
  }

  const toggleFavorite = (e: React.MouseEvent, assetId: string) => {
    e.stopPropagation()
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(assetId)) newFavorites.delete(assetId)
      else newFavorites.add(assetId)
      return newFavorites
    })
  }

  const toggleCompareAsset = (e: React.MouseEvent, asset: Asset) => {
    e.stopPropagation()
    setCompareAssets((prev) => {
      if (prev.find((a) => a.id === asset.id))
        return prev.filter((a) => a.id !== asset.id)
      if (prev.length >= 3) return prev
      return [...prev, asset]
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 h-full">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-600 h-full">
        <AlertTriangle className="w-8 h-8 mb-2" />
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b border-border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">RWA Marketplace</h1>
            <p className="text-slate-600 text-sm mt-1">
              Explore and invest in tokenized real-world assets
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={compareMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCompareMode(!compareMode)}
            >
              <GitCompare className="w-4 h-4 mr-2" />
              Compare
              {compareAssets.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-primary-foreground text-primary rounded-full text-xs">
                  {compareAssets.length}
                </span>
              )}
            </Button>
            {compareAssets.length >= 2 && (
              <Button size="sm" onClick={() => setShowCompareModal(true)}>
                View Comparison
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="fixed-income">Fixed Income</SelectItem>
              <SelectItem value="real-estate">Real Estate</SelectItem>
              <SelectItem value="private-credit">Private Credit</SelectItem>
              <SelectItem value="alternatives">Alternatives</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Maturing">Maturing</SelectItem>
              <SelectItem value="Paused">Paused</SelectItem>
            </SelectContent>
          </Select>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk</SelectItem>
              <SelectItem value="low">Low (0-30)</SelectItem>
              <SelectItem value="medium">Medium (31-60)</SelectItem>
              <SelectItem value="high">High (61+)</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
          <span className="text-sm text-slate-600 ml-auto">
            {filteredAssets.length} assets
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {viewMode === 'list' ? (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {compareMode && <TableHead className="w-10"></TableHead>}
                  <TableHead className="w-10"></TableHead>
                  <TableHead>
                    <button
                      className="flex items-center gap-1 hover:text-slate-900"
                      onClick={() => handleSort('name')}
                    >
                      Asset{' '}
                      {sortField === 'name' && (
                        <ArrowUpDown className="w-3 h-3" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">
                    <button
                      className="flex items-center gap-1 hover:text-slate-900 ml-auto"
                      onClick={() => handleSort('apy')}
                    >
                      APY{' '}
                      {sortField === 'apy' && (
                        <ArrowUpDown className="w-3 h-3" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      className="flex items-center gap-1 hover:text-slate-900 ml-auto"
                      onClick={() => handleSort('riskScore')}
                    >
                      Risk{' '}
                      {sortField === 'riskScore' && (
                        <ArrowUpDown className="w-3 h-3" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      className="flex items-center gap-1 hover:text-slate-900 ml-auto"
                      onClick={() => handleSort('aumUsd')}
                    >
                      AUM{' '}
                      {sortField === 'aumUsd' && (
                        <ArrowUpDown className="w-3 h-3" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      className="flex items-center gap-1 hover:text-slate-900 ml-auto"
                      onClick={() => handleSort('price')}
                    >
                      Price{' '}
                      {sortField === 'price' && (
                        <ArrowUpDown className="w-3 h-3" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow
                    key={asset.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(asset.id)}
                  >
                    {compareMode && (
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={
                            !!compareAssets.find((a) => a.id === asset.id)
                          }
                          onChange={(e) =>
                            toggleCompareAsset(
                              e as unknown as React.MouseEvent,
                              asset,
                            )
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-border"
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <button
                        onClick={(e) => toggleFavorite(e, asset.id)}
                        className="p-1 hover:bg-secondary rounded"
                      >
                        <Heart
                          className={`w-4 h-4 ${favorites.has(asset.id) ? 'fill-red-500 text-red-500' : 'text-slate-600'}`}
                        />
                      </button>
                    </TableCell>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[asset.type] || 'bg-gray-500/10 text-gray-500'}`}
                      >
                        {typeLabels[asset.type] || asset.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 text-green-500">
                        <TrendingUp className="w-3 h-3" />
                        {asset.apy.toFixed(2)}%
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          asset.riskScore < 30
                            ? 'text-green-500'
                            : asset.riskScore < 60
                              ? 'text-yellow-500'
                              : 'text-red-500'
                        }
                      >
                        {asset.riskScore}/100
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(asset.aumUsd)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(asset.price)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${asset.status === 'Active' ? 'bg-green-500/10 text-green-500' : asset.status === 'Maturing' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-500/10 text-gray-500'}`}
                      >
                        {asset.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={(e) => handleInvestClick(e, asset)}
                        disabled={asset.status !== 'Active'}
                      >
                        {!isConnected ? (
                          <>
                            <Wallet className="w-3 h-3 mr-1" />
                            Connect
                          </>
                        ) : (
                          'Invest'
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="border border-border rounded-lg p-4 hover:bg-secondary/50 cursor-pointer transition-colors"
                onClick={() => handleRowClick(asset.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium truncate">{asset.name}</h3>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[asset.type]}`}
                    >
                      {typeLabels[asset.type]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {compareMode && (
                      <input
                        type="checkbox"
                        checked={!!compareAssets.find((a) => a.id === asset.id)}
                        onChange={(e) =>
                          toggleCompareAsset(
                            e as unknown as React.MouseEvent,
                            asset,
                          )
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-border"
                      />
                    )}
                    <button
                      onClick={(e) => toggleFavorite(e, asset.id)}
                      className="p-1 hover:bg-secondary rounded"
                    >
                      <Heart
                        className={`w-4 h-4 ${favorites.has(asset.id) ? 'fill-red-500 text-red-500' : 'text-slate-600'}`}
                      />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">APY</span>
                    <span className="text-green-500 font-medium">
                      {asset.apy.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Risk</span>
                    <span
                      className={`font-medium ${asset.riskScore < 30 ? 'text-green-500' : asset.riskScore < 60 ? 'text-yellow-500' : 'text-red-500'}`}
                    >
                      {asset.riskScore}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Price</span>
                    <span>{formatCurrency(asset.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">AUM</span>
                    <span>{formatCurrency(asset.aumUsd)}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${asset.status === 'Active' ? 'bg-green-500/10 text-green-500' : asset.status === 'Maturing' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-500/10 text-gray-500'}`}
                  >
                    {asset.status}
                  </span>
                  <Button
                    size="sm"
                    onClick={(e) => handleInvestClick(e, asset)}
                    disabled={asset.status !== 'Active'}
                  >
                    {!isConnected ? (
                      <>
                        <Wallet className="w-3 h-3 mr-1" />
                        Connect
                      </>
                    ) : (
                      'Invest'
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedAsset && (
        <AddPositionModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}
      {showCompareModal && compareAssets.length >= 2 && (
        <AssetCompareModal
          assets={compareAssets}
          onClose={() => setShowCompareModal(false)}
        />
      )}
    </div>
  )
}
