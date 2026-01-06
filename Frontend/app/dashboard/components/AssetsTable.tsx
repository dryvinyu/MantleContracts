'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, TrendingUp, AlertTriangle, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import AddPositionModal from '@/components/AddPositionModal'
import { type Asset, formatCurrency } from '@/lib/mockData'

// Asset type colors
const typeColors: Record<string, string> = {
  'fixed-income': 'bg-blue-500/10 text-blue-500',
  'real-estate': 'bg-green-500/10 text-green-500',
  'private-credit': 'bg-purple-500/10 text-purple-500',
  alternatives: 'bg-orange-500/10 text-orange-500',
}

// Asset type labels
const typeLabels: Record<string, string> = {
  'fixed-income': 'Fixed Income',
  'real-estate': 'Real Estate',
  'private-credit': 'Private Credit',
  alternatives: 'Alternatives',
}

export default function AssetsTable() {
  const router = useRouter()
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch('/api/assets')
        if (!response.ok) {
          throw new Error('Failed to fetch assets')
        }
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
  }, [])

  const handleRowClick = (assetId: string) => {
    router.push(`/assets/${assetId}`)
  }

  const handleInvestClick = (e: React.MouseEvent, asset: Asset) => {
    e.stopPropagation()
    setSelectedAsset(asset)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-600">
        <AlertTriangle className="w-8 h-8 mb-2" />
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Available Assets</h2>
        <span className="text-sm text-slate-600">{assets.length} assets</span>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Asset</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">APY</TableHead>
              <TableHead className="text-right">Risk</TableHead>
              <TableHead className="text-right">AUM</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => (
              <TableRow
                key={asset.id}
                className="cursor-pointer"
                onClick={() => handleRowClick(asset.id)}
              >
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
                    className={`${
                      asset.riskScore < 30
                        ? 'text-green-500'
                        : asset.riskScore < 60
                          ? 'text-yellow-500'
                          : 'text-red-500'
                    }`}
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
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      asset.status === 'Active'
                        ? 'bg-green-500/10 text-green-500'
                        : asset.status === 'Maturing'
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-gray-500/10 text-gray-500'
                    }`}
                  >
                    {asset.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => handleInvestClick(e, asset)}
                    disabled={asset.status !== 'Active'}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Invest
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedAsset && (
        <AddPositionModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  )
}
