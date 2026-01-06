import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import usePortfolio from '@/lib/hooks/usePortfolio'
import {
  getRiskLevel,
  getAssetTypeLabel,
  type Asset,
  type AssetType,
  type RiskLevel,
} from '@/lib/mockData'

type SortDirection = 'asc' | 'desc'
type SortField = 'name' | 'apy' | 'durationDays' | 'riskScore' | 'aumUsd'
type DurationFilter = 'all' | '0-90' | '91-180' | '181-365' | '365+'
type StatusFilter = 'all' | 'Active' | 'Maturing' | 'Paused'

export default function useAssetsTable() {
  const router = useRouter()
  const { portfolio } = usePortfolio()
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('aumUsd')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [typeFilter, setTypeFilter] = useState<AssetType | 'all'>('all')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all')
  const [minApy, setMinApy] = useState(0)
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [confidenceRange, setConfidenceRange] = useState<[number, number]>([
    0, 100,
  ])
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [modalType, setModalType] = useState<'add' | 'redeem' | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/assets')
      if (!response.ok) {
        console.error('Failed to fetch assets')
        return
      }
      const data = await response.json()
      // Map database type format (real_estate) to frontend format (real-estate)
      const mappedAssets = data.assets.map((asset: any) => ({
        ...asset,
        type: asset.type === 'real_estate' ? 'real-estate' : asset.type,
      }))
      setAssets(mappedAssets)
    } catch (err) {
      console.error('Error fetching assets:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedAssets = useMemo(() => {
    const filtered = assets.filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        getAssetTypeLabel(asset.type)
          .toLowerCase()
          .includes(search.toLowerCase())
      const matchesType = typeFilter === 'all' || asset.type === typeFilter
      const matchesRisk =
        riskFilter === 'all' || getRiskLevel(asset.riskScore) === riskFilter
      const matchesApy = asset.apy >= minApy
      const matchesDuration =
        durationFilter === 'all' ||
        (durationFilter === '0-90'
          ? asset.durationDays <= 90
          : durationFilter === '91-180'
            ? asset.durationDays > 90 && asset.durationDays <= 180
            : durationFilter === '181-365'
              ? asset.durationDays > 180 && asset.durationDays <= 365
              : asset.durationDays > 365)
      const matchesStatus =
        statusFilter === 'all' || asset.status === statusFilter
      const confidence = asset.yieldConfidence ?? 0
      const matchesConfidence =
        confidence >= confidenceRange[0] && confidence <= confidenceRange[1]
      return (
        matchesSearch &&
        matchesType &&
        matchesRisk &&
        matchesApy &&
        matchesDuration &&
        matchesStatus &&
        matchesConfidence
      )
    })

    return filtered.sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      const modifier = sortDirection === 'asc' ? 1 : -1

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * modifier
      }
      return ((aVal as number) - (bVal as number)) * modifier
    })
  }, [
    assets,
    search,
    sortField,
    sortDirection,
    typeFilter,
    riskFilter,
    minApy,
    durationFilter,
    statusFilter,
    confidenceRange,
  ])

  const getRiskBadgeClass = (score: number) => {
    const level = getRiskLevel(score)
    return level === 'Low'
      ? 'risk-low'
      : level === 'Medium'
        ? 'risk-medium'
        : 'risk-high'
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-500/10 text-green-400'
      case 'Maturing':
        return 'bg-yellow-500/10 text-yellow-400'
      case 'Paused':
        return 'bg-muted text-slate-500'
      default:
        return 'bg-muted text-slate-500'
    }
  }

  return {
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
    loading,
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
    refreshAssets: fetchAssets,
  }
}
