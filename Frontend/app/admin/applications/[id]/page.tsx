'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Percent,
  Shield,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useAdmin, hasPermission } from '@/lib/hooks/useAdmin'
import type { ApplicationStatus, AssetType } from '@/lib/supabase'

interface ApplicationDetail {
  id: string
  name: string
  type: AssetType
  description: string | null
  expected_apy: number
  target_aum: number
  minimum_investment: number
  duration_days: number
  price: number
  risk_score: number
  token_address: string | null
  token_symbol: string | null
  distributor_address: string | null
  metadata: Record<string, string> | null
  onchain_asset_id: string | null
  onchain_tx_hash: string | null
  status: ApplicationStatus
  review_comments: string | null
  submitted_at: string
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

const statusConfig: Record<
  ApplicationStatus,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
    icon: typeof Clock
  }
> = {
  draft: { label: 'Draft', variant: 'secondary', icon: Clock },
  pending: { label: 'Pending Review', variant: 'outline', icon: Clock },
  reviewing: { label: 'Under Review', variant: 'default', icon: Clock },
  approved: { label: 'Approved', variant: 'default', icon: CheckCircle },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
  changes_requested: {
    label: 'Changes Requested',
    variant: 'secondary',
    icon: Clock,
  },
}

const typeLabels: Record<AssetType, string> = {
  'fixed-income': 'Fixed Income',
  'real-estate': 'Real Estate',
  'private-credit': 'Private Credit',
  alternatives: 'Alternatives',
}

const detailLabelMap: Record<string, string> = {
  issuer: 'Issuer',
  couponRate: 'Coupon Rate (%)',
  payoutFrequency: 'Payout Frequency',
  maturityDate: 'Maturity Date',
  collateral: 'Collateral',
  rating: 'Rating',
  callTerms: 'Call / Prepayment Terms',
  propertyName: 'Property Name',
  location: 'Location',
  propertyType: 'Property Type',
  occupancyRate: 'Occupancy Rate (%)',
  valuation: 'Valuation (RWA)',
  manager: 'Property Manager',
  ltv: 'Loan to Value (%)',
  borrower: 'Borrower',
  loanType: 'Loan Type',
  repaymentSchedule: 'Repayment Schedule',
  creditEnhancement: 'Credit Enhancement',
  covenants: 'Covenants',
  useOfFunds: 'Use of Funds',
  assetSubtype: 'Asset Subtype',
  valuationMethod: 'Valuation Method',
  liquidityTerms: 'Liquidity Terms',
  custody: 'Custody',
  insurance: 'Insurance',
  volatilityNotes: 'Volatility Notes',
}

export default function ApplicationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { address } = useAccount()
  const { admin } = useAdmin()
  const [application, setApplication] = useState<ApplicationDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [comments, setComments] = useState('')

  const id = params.id as string

  useEffect(() => {
    const fetchApplication = async () => {
      if (!address || !id) return

      setIsLoading(true)
      try {
        const response = await fetch(`/api/admin/applications/${id}`, {
          headers: { 'x-wallet-address': address },
        })
        const data = await response.json()

        if (data.application) {
          setApplication(data.application)
          setComments(data.application.review_comments || '')
        }
      } catch (error) {
        console.error('Failed to fetch application:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchApplication()
  }, [address, id])

  const handleReview = async (
    action: 'approve' | 'reject' | 'request_changes',
  ) => {
    if (!address || !id) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/applications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address,
        },
        body: JSON.stringify({ action, comments }),
      })

      if (response.ok) {
        const data = await response.json()
        setApplication(data.application)
      }
    } catch (error) {
      console.error('Failed to review application:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'RWA',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-slate-600">
          Loading application...
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Application Not Found</h2>
          <Button onClick={() => router.push('/admin/applications')}>
            Back to Applications
          </Button>
        </div>
      </div>
    )
  }

  const config = statusConfig[application.status]
  const StatusIcon = config.icon
  const canReview = ['pending', 'reviewing'].includes(application.status)
  const metadata = (application.metadata || {}) as Record<string, string>

  const typeSpecificFields: Record<AssetType, string[]> = {
    'fixed-income': [
      'issuer',
      'couponRate',
      'payoutFrequency',
      'maturityDate',
      'collateral',
      'rating',
      'callTerms',
    ],
    'real-estate': [
      'propertyName',
      'location',
      'propertyType',
      'occupancyRate',
      'valuation',
      'manager',
      'ltv',
    ],
    'private-credit': [
      'borrower',
      'loanType',
      'repaymentSchedule',
      'creditEnhancement',
      'covenants',
      'useOfFunds',
    ],
    alternatives: [
      'assetSubtype',
      'valuationMethod',
      'liquidityTerms',
      'custody',
      'insurance',
      'volatilityNotes',
    ],
  }

  const detailFields = typeSpecificFields[application.type].filter(
    (field) => metadata[field],
  )

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/applications')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{application.name}</h1>
          <p className="text-slate-600">{typeLabels[application.type]}</p>
        </div>
        <Badge variant={config.variant} className="gap-1">
          <StatusIcon className="w-3 h-3" />
          {config.label}
        </Badge>
      </div>

      {/* Asset Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Financial Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Expected APY</span>
              <span className="font-medium text-green-500">
                {application.expected_apy}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Target AUM</span>
              <span className="font-medium">
                {formatCurrency(application.target_aum)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Minimum Investment</span>
              <span className="font-medium">
                {formatCurrency(application.minimum_investment)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Duration</span>
              <span className="font-medium">
                {application.duration_days} days
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Price per Share</span>
              <span className="font-medium">${application.price}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Risk & Token Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Risk Score</span>
              <span
                className={`font-medium ${
                  application.risk_score <= 30
                    ? 'text-green-500'
                    : application.risk_score <= 60
                      ? 'text-yellow-500'
                      : 'text-red-500'
                }`}
              >
                {application.risk_score}/100
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Token Symbol</span>
              <span className="font-medium">
                {application.token_symbol || 'Not set'}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-slate-600">Token Address</span>
              <span className="font-mono text-xs max-w-[180px] truncate">
                {application.token_address || 'Not deployed'}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-slate-600">Distributor</span>
              <span className="font-mono text-xs max-w-[180px] truncate">
                {application.distributor_address || 'Not set'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {application.description && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 whitespace-pre-wrap">
              {application.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Type-specific Details */}
      {detailFields.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {typeLabels[application.type]} Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {detailFields.map((field) => (
              <div key={field} className="flex flex-col gap-1">
                <span className="text-slate-600">
                  {detailLabelMap[field] || field}
                </span>
                <span className="font-medium">{metadata[field]}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Created</span>
            <span>{formatDate(application.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Submitted</span>
            <span>{formatDate(application.submitted_at)}</span>
          </div>
          {application.reviewed_at && (
            <div className="flex justify-between">
              <span className="text-slate-600">Reviewed</span>
              <span>{formatDate(application.reviewed_at)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {(application.onchain_asset_id || application.onchain_tx_hash) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              On-chain Registration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {application.onchain_asset_id && (
              <div className="flex flex-col gap-1">
                <span className="text-slate-600">Asset Registry ID</span>
                <span className="font-mono break-all">
                  {application.onchain_asset_id}
                </span>
              </div>
            )}
            {application.onchain_tx_hash && (
              <div className="flex flex-col gap-1">
                <span className="text-slate-600">Registration Tx</span>
                <span className="font-mono break-all">
                  {application.onchain_tx_hash}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Review Section */}
      {canReview && hasPermission(admin?.role, 'reviewer') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Review Application</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Review Comments
              </label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add your review comments here..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleReview('approve')}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => handleReview('request_changes')}
                disabled={isSubmitting}
                variant="outline"
              >
                Request Changes
              </Button>
              <Button
                onClick={() => handleReview('reject')}
                disabled={isSubmitting}
                variant="destructive"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Previous Review Comments */}
      {!canReview && application.review_comments && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Review Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 whitespace-pre-wrap">
              {application.review_comments}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
