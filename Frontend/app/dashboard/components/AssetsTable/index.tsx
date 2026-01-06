'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import {
  ArrowDownToLine,
  ArrowUpDown,
  Eye,
  Plus,
  Search,
  PlusCircle,
} from 'lucide-react'

import useAssetsTable from './service'
import AddPositionModal from '@/components/AddPositionModal'
import RedeemModal from '@/components/RedeemModal'
import AddAssetModal from '@/components/AddAssetModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  formatCurrency,
  formatDuration,
  getAssetTypeColor,
  getAssetTypeLabel,
  getRiskLevel,
  type AssetType,
  type RiskLevel,
} from '@/lib/mockData'

type SortField = 'name' | 'apy' | 'durationDays' | 'riskScore' | 'aumUsd'
type DurationFilter = 'all' | '0-90' | '91-180' | '181-365' | '365+'
type StatusFilter = 'all' | 'Active' | 'Maturing' | 'Paused'

export default function AssetsTable() {
  const {
    router,
    search,
    portfolio,
    sortField,
    typeFilter,
    riskFilter,
    minApy,
    durationFilter,
    statusFilter,
    confidenceRange,
    selectedAsset,
    modalType,
    setSearch,
    handleSort,
    setTypeFilter,
    setRiskFilter,
    setMinApy,
    setDurationFilter,
    setStatusFilter,
    setConfidenceRange,
    setSelectedAsset,
    setModalType,
    sortedAssets,
    getRiskBadgeClass,
    getStatusBadgeClass,
    refreshAssets,
  } = useAssetsTable()
  const [showAddAssetModal, setShowAddAssetModal] = useState(false)

  const SortHeader = ({
    field,
    children,
  }: {
    field: SortField
    children: ReactNode
  }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-slate-900 transition-colors"
    >
      {children}
      <ArrowUpDown
        className={`w-3 h-3 ${sortField === field ? 'text-primary' : ''}`}
      />
    </Button>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-slate-600 uppercase tracking-wider">
            Assets
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddAssetModal(true)}
            className="h-9"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Asset
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <Input
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-60 h-9 bg-secondary border-border"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as AssetType | 'all')}
          >
            <SelectTrigger className="w-36 h-9 bg-secondary border-border">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="fixed-income">Fixed Income</SelectItem>
              <SelectItem value="real-estate">Real Estate</SelectItem>
              <SelectItem value="private-credit">Private Credit</SelectItem>
              <SelectItem value="alternatives">Alternatives</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={riskFilter}
            onValueChange={(value) => setRiskFilter(value as RiskLevel | 'all')}
          >
            <SelectTrigger className="w-32 h-9 bg-secondary border-border">
              <SelectValue placeholder="All Risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={durationFilter}
            onValueChange={(value) =>
              setDurationFilter(value as DurationFilter)
            }
          >
            <SelectTrigger className="w-36 h-9 bg-secondary border-border">
              <SelectValue placeholder="All Duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Duration</SelectItem>
              <SelectItem value="0-90">0-90D</SelectItem>
              <SelectItem value="91-180">91-180D</SelectItem>
              <SelectItem value="181-365">181-365D</SelectItem>
              <SelectItem value="365+">365D+</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger className="w-32 h-9 bg-secondary border-border">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Maturing">Maturing</SelectItem>
              <SelectItem value="Paused">Paused</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 h-9">
            <span className="text-xs text-slate-600">Min APY</span>
            <span className="text-xs font-medium">{minApy.toFixed(1)}%</span>
            <Slider
              value={[minApy]}
              min={0}
              max={15}
              step={0.5}
              onValueChange={(value) => setMinApy(value[0] ?? 0)}
              className="w-24"
            />
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 h-9">
            <span className="text-xs text-slate-600">Confidence</span>
            <span className="text-xs font-medium">
              {confidenceRange[0]}-{confidenceRange[1]}
            </span>
            <Slider
              value={confidenceRange}
              min={0}
              max={100}
              step={5}
              onValueChange={(value) =>
                setConfidenceRange([value[0] ?? 0, value[1] ?? 100])
              }
              className="w-28"
            />
          </div>
          {(typeFilter !== 'all' ||
            riskFilter !== 'all' ||
            durationFilter !== 'all' ||
            statusFilter !== 'all' ||
            minApy > 0 ||
            confidenceRange[0] > 0 ||
            confidenceRange[1] < 100 ||
            search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTypeFilter('all')
                setRiskFilter('all')
                setMinApy(0)
                setDurationFilter('all')
                setStatusFilter('all')
                setConfidenceRange([0, 100])
                setSearch('')
              }}
              className="h-9"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="table-header">
                <SortHeader field="name">Asset</SortHeader>
              </TableHead>
              <TableHead className="table-header text-right">
                <SortHeader field="apy">APY</SortHeader>
              </TableHead>
              <TableHead className="table-header text-right">
                <SortHeader field="durationDays">Duration</SortHeader>
              </TableHead>
              <TableHead className="table-header text-right">
                <SortHeader field="riskScore">Risk</SortHeader>
              </TableHead>
              <TableHead className="table-header text-right">
                Confidence
              </TableHead>
              <TableHead className="table-header text-right">
                <SortHeader field="aumUsd">AUM</SortHeader>
              </TableHead>
              <TableHead className="table-header text-right">
                Your Position
              </TableHead>
              <TableHead className="table-header">Status</TableHead>
              <TableHead className="table-header text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAssets.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-sm text-slate-600 py-8"
                >
                  No assets match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              sortedAssets.map((asset) => {
                const shares = portfolio.holdings[asset.id] || 0
                const positionValue = shares * asset.price
                return (
                  <TableRow
                    key={asset.id}
                    className="border-border hover:bg-muted/30"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium text-sm">
                            {asset.name}
                          </div>
                          <span
                            className={`status-badge text-xs mt-1 ${getAssetTypeColor(asset.type)}`}
                          >
                            {getAssetTypeLabel(asset.type)}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-green-400 font-medium">
                        {asset.apy}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {formatDuration(asset.durationDays)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`status-badge ${getRiskBadgeClass(asset.riskScore)}`}
                      >
                        {getRiskLevel(asset.riskScore)} ({asset.riskScore})
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-medium">
                          {asset.yieldConfidence}%
                        </span>
                        <Progress
                          value={asset.yieldConfidence}
                          className="h-1 w-20"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(asset.aumUsd)}
                    </TableCell>
                    <TableCell className="text-right">
                      {shares > 0 ? (
                        <div className="flex flex-col items-end">
                          <span className="font-medium">
                            {formatCurrency(positionValue)}
                          </span>
                          <span className="text-xs text-slate-600">
                            {shares} units
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`status-badge ${getStatusBadgeClass(asset.status)}`}
                      >
                        {asset.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => router.push(`/assets/${asset.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setSelectedAsset(asset)
                            setModalType('add')
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        {shares > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              setSelectedAsset(asset)
                              setModalType('redeem')
                            }}
                          >
                            <ArrowDownToLine className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {selectedAsset && modalType === 'add' && (
        <AddPositionModal
          asset={selectedAsset}
          onClose={() => {
            setSelectedAsset(null)
            setModalType(null)
          }}
        />
      )}

      {selectedAsset && modalType === 'redeem' && (
        <RedeemModal
          asset={selectedAsset}
          onClose={() => {
            setSelectedAsset(null)
            setModalType(null)
          }}
        />
      )}

      {showAddAssetModal && (
        <AddAssetModal
          onClose={() => setShowAddAssetModal(false)}
          onSuccess={() => {
            refreshAssets()
            setShowAddAssetModal(false)
          }}
        />
      )}
    </div>
  )
}
