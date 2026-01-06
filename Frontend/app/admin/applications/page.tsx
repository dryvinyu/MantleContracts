'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle,
  Clock,
  Eye,
  Filter,
  MoreHorizontal,
  Search,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

interface Application {
  id: string
  name: string
  type: string
  expected_apy: number
  target_aum: number
  risk_score: number
  status: string
  submitted_at: string
  description: string | null
  minimum_investment: number
  duration_days: number
  price: number
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: {
    label: 'Pending',
    color: 'text-yellow-500 bg-yellow-500/10',
    icon: Clock,
  },
  reviewing: {
    label: 'Reviewing',
    color: 'text-blue-500 bg-blue-500/10',
    icon: Eye,
  },
  approved: {
    label: 'Approved',
    color: 'text-green-500 bg-green-500/10',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-500 bg-red-500/10',
    icon: XCircle,
  },
}

const typeLabels: Record<string, string> = {
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

const REJECTION_REASONS = [
  'Incomplete documentation',
  'Risk assessment too high',
  'Insufficient collateral',
  'Regulatory compliance issues',
  'Valuation concerns',
  'Other',
]

export default function ApplicationsPage() {
  const { address } = useAccount()
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status') || 'all'

  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = useState<
    Application[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState(statusFilter)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const fetchApplications = async () => {
      if (!address) return

      try {
        const response = await fetch('/api/admin/applications', {
          headers: { 'x-wallet-address': address },
        })
        const data = await response.json()
        setApplications(data.applications || [])
      } catch (error) {
        console.error('Failed to fetch applications:', error)
        toast.error('Failed to load applications')
      } finally {
        setIsLoading(false)
      }
    }

    fetchApplications()
  }, [address])

  useEffect(() => {
    let filtered = applications

    // Filter by status
    if (activeFilter !== 'all') {
      filtered = filtered.filter((app) => app.status === activeFilter)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (app) =>
          app.name.toLowerCase().includes(term) ||
          app.type.toLowerCase().includes(term),
      )
    }

    setFilteredApplications(filtered)
  }, [applications, activeFilter, searchTerm])

  const handleApprove = async (app: Application) => {
    if (!address) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/applications/${app.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address,
        },
        body: JSON.stringify({ action: 'approve' }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`"${app.name}" has been approved`)
        if (data.application) {
          setApplications((prev) =>
            prev.map((a) => (a.id === app.id ? data.application : a)),
          )
        }
      } else {
        throw new Error('Failed to approve')
      }
    } catch (error) {
      toast.error('Failed to approve application')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!address || !selectedApp) return

    const reason = rejectReason === 'Other' ? customReason : rejectReason
    if (!reason) {
      toast.error('Please select or enter a rejection reason')
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch(
        `/api/admin/applications/${selectedApp.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-wallet-address': address,
          },
          body: JSON.stringify({ action: 'reject', comments: reason }),
        },
      )

      if (response.ok) {
        const data = await response.json()
        toast.success(`"${selectedApp.name}" has been rejected`)
        if (data.application) {
          setApplications((prev) =>
            prev.map((a) => (a.id === selectedApp.id ? data.application : a)),
          )
        }
        setShowRejectModal(false)
        setSelectedApp(null)
        setRejectReason('')
        setCustomReason('')
      } else {
        throw new Error('Failed to reject')
      }
    } catch (error) {
      toast.error('Failed to reject application')
    } finally {
      setIsProcessing(false)
    }
  }

  const openRejectModal = (app: Application) => {
    setSelectedApp(app)
    setShowRejectModal(true)
  }

  const filterTabs = [
    { key: 'all', label: 'All', count: applications.length },
    {
      key: 'pending',
      label: 'Pending',
      count: applications.filter((a) => a.status === 'pending').length,
    },
    {
      key: 'approved',
      label: 'Approved',
      count: applications.filter((a) => a.status === 'approved').length,
    },
    {
      key: 'rejected',
      label: 'Rejected',
      count: applications.filter((a) => a.status === 'rejected').length,
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Application Review</h1>
          <p className="text-slate-600">
            Review and manage asset listing applications
          </p>
        </div>
        <Button
          onClick={() => window.location.assign('/admin/applications/new')}
        >
          New Application
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <Input
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {filterTabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activeFilter === tab.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(tab.key)}
              className="gap-2"
            >
              {tab.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeFilter === tab.key
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

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>Applications ({filteredApplications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-slate-600">
              Loading applications...
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No applications found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApplications.map((app) => {
                const status = statusConfig[app.status] || statusConfig.pending
                const StatusIcon = status.icon

                return (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${status.color}`}
                      >
                        <StatusIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{app.name}</h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span>{typeLabels[app.type] || app.type}</span>
                          <span>•</span>
                          <span>{app.expected_apy}% APY</span>
                          <span>•</span>
                          <span>Target: {formatRWA(app.target_aum)}</span>
                          <span>•</span>
                          <span>Risk: {app.risk_score}/100</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 mr-4">
                        {new Date(app.submitted_at).toLocaleDateString()}
                      </span>

                      {app.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-500 border-green-500/50 hover:bg-green-500/10"
                            onClick={() => handleApprove(app)}
                            disabled={isProcessing}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 border-red-500/50 hover:bg-red-500/10"
                            onClick={() => openRejectModal(app)}
                            disabled={isProcessing}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/applications/${app.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {app.status === 'approved' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/admin/assets/list?application=${app.id}`}
                                >
                                  List Asset
                                </Link>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Select a reason for rejecting &quot;{selectedApp?.name}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              {REJECTION_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    rejectReason === reason
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-secondary/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    value={reason}
                    checked={rejectReason === reason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{reason}</span>
                </label>
              ))}
            </div>

            {rejectReason === 'Other' && (
              <div>
                <Input
                  placeholder="Enter custom reason..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleReject}
                disabled={
                  isProcessing ||
                  !rejectReason ||
                  (rejectReason === 'Other' && !customReason)
                }
              >
                {isProcessing ? 'Processing...' : 'Confirm Reject'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
