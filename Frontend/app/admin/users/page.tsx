'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import {
  Ban,
  CheckCircle,
  ExternalLink,
  Eye,
  MoreHorizontal,
  Search,
  Shield,
  ShieldCheck,
  User,
  Users,
  Wallet,
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
import { useAdmin, hasPermission } from '@/lib/hooks/useAdmin'

interface UserData {
  id: string
  wallet_address: string
  created_at: string
  rwa_balance: number
  total_invested: number
  investment_count: number
  kyc_status: 'pending' | 'verified' | 'rejected'
  is_frozen: boolean
}

const formatRWA = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M RWA`
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K RWA`
  return `${value.toFixed(2)} RWA`
}

const formatAddress = (addr: string) =>
  `${addr.slice(0, 6)}...${addr.slice(-4)}`

export default function UsersPage() {
  const { address } = useAccount()
  const { admin } = useAdmin()
  const [users, setUsers] = useState<UserData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [kycFilter, setKycFilter] = useState<string>('all')
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      if (!address) return

      setIsLoading(true)
      try {
        const response = await fetch('/api/admin/users', {
          headers: { 'x-wallet-address': address },
        })

        if (response.ok) {
          const data = await response.json()
          setUsers(data.users || [])
        } else {
          console.error('Failed to fetch users')
          setUsers([])
        }
      } catch (error) {
        console.error('Failed to fetch users:', error)
        setUsers([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [address])

  useEffect(() => {
    let filtered = users

    if (kycFilter !== 'all') {
      if (kycFilter === 'frozen') {
        filtered = filtered.filter((user) => user.is_frozen)
      } else {
        filtered = filtered.filter((user) => user.kyc_status === kycFilter)
      }
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((user) =>
        user.wallet_address.toLowerCase().includes(term),
      )
    }

    setFilteredUsers(filtered)
  }, [users, kycFilter, searchTerm])

  const handleVerifyKYC = async (user: UserData) => {
    if (!address) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}/kyc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address,
        },
        body: JSON.stringify({ status: 'verified' }),
      })

      if (response.ok) {
        toast.success('KYC verified successfully')
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, kyc_status: 'verified' as const } : u,
          ),
        )
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to verify KYC')
      }
    } catch (error) {
      toast.error('Failed to verify KYC')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleToggleFreeze = async (user: UserData) => {
    if (!address) return

    const newStatus = !user.is_frozen
    setIsProcessing(true)

    try {
      const response = await fetch(`/api/admin/users/${user.id}/freeze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address,
        },
        body: JSON.stringify({ frozen: newStatus }),
      })

      if (response.ok) {
        toast.success(
          `Account ${newStatus ? 'frozen' : 'unfrozen'} successfully`,
        )
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, is_frozen: newStatus } : u,
          ),
        )
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update account status')
      }
    } catch (error) {
      toast.error('Failed to update account status')
    } finally {
      setIsProcessing(false)
    }
  }

  const openUserModal = (user: UserData) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const filterTabs = [
    { key: 'all', label: 'All Users', count: users.length },
    {
      key: 'verified',
      label: 'Verified',
      count: users.filter((u) => u.kyc_status === 'verified').length,
    },
    {
      key: 'pending',
      label: 'Pending KYC',
      count: users.filter((u) => u.kyc_status === 'pending').length,
    },
    {
      key: 'frozen',
      label: 'Frozen',
      count: users.filter((u) => u.is_frozen).length,
    },
  ]

  // Calculate stats
  const totalBalance = users.reduce((sum, u) => sum + u.rwa_balance, 0)
  const totalInvested = users.reduce((sum, u) => sum + u.total_invested, 0)

  const getKYCBadge = (status: string, isFrozen: boolean) => {
    if (isFrozen) {
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-500">
          Frozen
        </span>
      )
    }
    switch (status) {
      case 'verified':
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500">
            Verified
          </span>
        )
      case 'pending':
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500">
            Pending
          </span>
        )
      case 'rejected':
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-500">
            Rejected
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-slate-600">
          Manage user accounts, KYC verification, and access control
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Users</p>
                <p className="text-xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <ShieldCheck className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Verified</p>
                <p className="text-xl font-bold">
                  {users.filter((u) => u.kyc_status === 'verified').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Wallet className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Balance</p>
                <p className="text-xl font-bold">{formatRWA(totalBalance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Shield className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Invested</p>
                <p className="text-xl font-bold">{formatRWA(totalInvested)}</p>
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
            placeholder="Search by wallet address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {filterTabs.map((tab) => (
            <Button
              key={tab.key}
              variant={kycFilter === tab.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setKycFilter(tab.key)}
              className="gap-2"
            >
              {tab.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  kycFilter === tab.key
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

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-slate-600">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    user.is_frozen
                      ? 'border-red-500/30 bg-red-500/5'
                      : 'border-border hover:bg-secondary/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        user.is_frozen ? 'bg-red-500/10' : 'bg-primary/10'
                      }`}
                    >
                      <User
                        className={`w-5 h-5 ${user.is_frozen ? 'text-red-500' : 'text-primary'}`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {formatAddress(user.wallet_address)}
                        </span>
                        {getKYCBadge(user.kyc_status, user.is_frozen)}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span>Balance: {formatRWA(user.rwa_balance)}</span>
                        <span>•</span>
                        <span>Invested: {formatRWA(user.total_invested)}</span>
                        <span>•</span>
                        <span>{user.investment_count} investments</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 mr-4">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </span>

                    {user.kyc_status === 'pending' &&
                      hasPermission(admin?.role, 'admin') && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-500 border-green-500/50 hover:bg-green-500/10"
                          onClick={() => handleVerifyKYC(user)}
                          disabled={isProcessing}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Verify KYC
                        </Button>
                      )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openUserModal(user)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(
                              `https://explorer.mantle.xyz/address/${user.wallet_address}`,
                              '_blank',
                            )
                          }
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View on Explorer
                        </DropdownMenuItem>
                        {hasPermission(admin?.role, 'admin') && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className={
                                user.is_frozen
                                  ? 'text-green-500'
                                  : 'text-red-500'
                              }
                              onClick={() => handleToggleFreeze(user)}
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              {user.is_frozen
                                ? 'Unfreeze Account'
                                : 'Freeze Account'}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Account information and activity
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-mono text-sm">
                    {selectedUser.wallet_address}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {getKYCBadge(
                      selectedUser.kyc_status,
                      selectedUser.is_frozen,
                    )}
                    <span className="text-xs text-slate-600">
                      Member since{' '}
                      {new Date(selectedUser.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-secondary/30">
                  <p className="text-sm text-slate-600">RWA Balance</p>
                  <p className="text-xl font-bold">
                    {formatRWA(selectedUser.rwa_balance)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30">
                  <p className="text-sm text-slate-600">Total Invested</p>
                  <p className="text-xl font-bold">
                    {formatRWA(selectedUser.total_invested)}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-secondary/30">
                <p className="text-sm text-slate-600 mb-2">
                  Investment Summary
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Active Investments</span>
                    <span className="font-medium">
                      {selectedUser.investment_count}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available Balance</span>
                    <span className="font-medium">
                      {formatRWA(
                        selectedUser.rwa_balance - selectedUser.total_invested,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {hasPermission(admin?.role, 'admin') && (
                <div className="flex gap-3 pt-4">
                  {selectedUser.kyc_status === 'pending' && (
                    <Button
                      className="flex-1"
                      onClick={() => {
                        handleVerifyKYC(selectedUser)
                        setShowUserModal(false)
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify KYC
                    </Button>
                  )}
                  <Button
                    variant={selectedUser.is_frozen ? 'default' : 'destructive'}
                    className="flex-1"
                    onClick={() => {
                      handleToggleFreeze(selectedUser)
                      setShowUserModal(false)
                    }}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    {selectedUser.is_frozen
                      ? 'Unfreeze Account'
                      : 'Freeze Account'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
