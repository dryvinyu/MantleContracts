'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  TrendingUp,
  AlertTriangle,
  ArrowDownToLine,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import RedeemModal from '@/components/RedeemModal'
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

interface Holding {
  asset: Asset
  shares: number
  value: number
}

export default function PortfolioHoldings() {
  const router = useRouter()
  const { isConnected, address } = useWallet()
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Handle hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    if (!isConnected || !address) {
      setHoldings([])
      setIsLoading(false)
      return
    }

    const fetchHoldings = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/portfolio?wallet=${address}`)
        if (!response.ok) throw new Error('Failed to fetch holdings')
        const data = await response.json()
        setHoldings(data.holdings || [])
      } catch (err) {
        console.error('Error fetching holdings:', err)
        setError('Failed to load holdings')
      } finally {
        setIsLoading(false)
      }
    }

    fetchHoldings()
  }, [isMounted, isConnected, address])

  const handleRowClick = (assetId: string) => {
    router.push(`/assets/${assetId}`)
  }

  const handleRedeemClick = (e: React.MouseEvent, asset: Asset) => {
    e.stopPropagation()
    setSelectedAsset(asset)
  }

  // Show loading state during hydration and initial load
  if (!isMounted || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-600">
        <AlertTriangle className="w-8 h-8 mb-2" />
        <p>Connect wallet to view your holdings</p>
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

  if (holdings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-600">
        <p className="mb-4">You don&apos;t have any holdings yet</p>
        <Button onClick={() => router.push('/')}>Browse Marketplace</Button>
      </div>
    )
  }

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">My Holdings</h2>
          <p className="text-sm text-slate-600">
            Total Value: {formatCurrency(totalValue)}
          </p>
        </div>
        <span className="text-sm text-slate-600">
          {holdings.length} positions
        </span>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Asset</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">APY</TableHead>
              <TableHead className="text-right">Shares</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.map(({ asset, shares, value }) => (
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
                <TableCell className="text-right">{shares}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(value)}
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
                    onClick={(e) => handleRedeemClick(e, asset)}
                    disabled={asset.status !== 'Active'}
                  >
                    <ArrowDownToLine className="w-3 h-3 mr-1" />
                    Redeem
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedAsset && (
        <RedeemModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  )
}
