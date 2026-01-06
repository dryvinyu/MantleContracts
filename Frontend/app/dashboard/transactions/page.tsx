'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
  ExternalLink,
  Filter,
  Gift,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { getTxExplorerUrl } from '@/app/frontend-abi'
import type {
  DbUserTransaction,
  TransactionType,
  TransactionStatus,
} from '@/lib/supabase'

const typeConfig: Record<
  TransactionType,
  { label: string; icon: typeof ArrowUpRight; color: string }
> = {
  invest: { label: 'Investment', icon: ArrowUpRight, color: 'text-green-500' },
  redeem: { label: 'Redemption', icon: ArrowDownLeft, color: 'text-blue-500' },
  yield_payout: { label: 'Yield Payout', icon: Gift, color: 'text-yellow-500' },
}

const statusConfig: Record<
  TransactionStatus,
  {
    label: string
    icon: typeof CheckCircle
    variant: 'default' | 'secondary' | 'destructive'
  }
> = {
  pending: { label: 'Pending', icon: Clock, variant: 'secondary' },
  confirmed: { label: 'Confirmed', icon: CheckCircle, variant: 'default' },
  failed: { label: 'Failed', icon: XCircle, variant: 'destructive' },
}

export default function TransactionsPage() {
  const { address, isConnected } = useAccount()
  const [transactions, setTransactions] = useState<DbUserTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!address) return

      setIsLoading(true)
      try {
        const url =
          filter === 'all'
            ? `/api/transactions?wallet=${address}`
            : `/api/transactions?wallet=${address}&type=${filter}`

        const response = await fetch(url)
        const data = await response.json()

        if (data.transactions) {
          setTransactions(data.transactions)
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [address, filter])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'RWA',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const shortenHash = (hash: string | null) => {
    if (!hash) return '-'
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`
  }

  if (!isConnected) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Connect Wallet</h2>
          <p className="text-slate-600">
            Please connect your wallet to view transaction history.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <p className="text-slate-600">
            View your investment and redemption history
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              {filter === 'all'
                ? 'All Types'
                : typeConfig[filter as TransactionType]?.label || filter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilter('all')}>
              All Types
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('invest')}>
              Investments
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('redeem')}>
              Redemptions
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('yield_payout')}>
              Yield Payouts
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Invested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(
                transactions
                  .filter(
                    (tx) => tx.type === 'invest' && tx.status === 'confirmed',
                  )
                  .reduce((sum, tx) => sum + tx.value_usd, 0),
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Redeemed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {formatCurrency(
                transactions
                  .filter(
                    (tx) => tx.type === 'redeem' && tx.status === 'confirmed',
                  )
                  .reduce((sum, tx) => sum + tx.value_usd, 0),
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Yield Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {formatCurrency(
                transactions
                  .filter(
                    (tx) =>
                      tx.type === 'yield_payout' && tx.status === 'confirmed',
                  )
                  .reduce((sum, tx) => sum + tx.value_usd, 0),
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({transactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-600">
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-slate-600">
              No transactions found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Tx Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => {
                  const typeInfo = typeConfig[tx.type]
                  const statusInfo = statusConfig[tx.status]
                  const TypeIcon = typeInfo.icon
                  const StatusIcon = statusInfo.icon

                  return (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TypeIcon className={`w-4 h-4 ${typeInfo.color}`} />
                          <span>{typeInfo.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {tx.asset_name}
                      </TableCell>
                      <TableCell>{tx.amount.toFixed(4)}</TableCell>
                      <TableCell>{formatCurrency(tx.value_usd)}</TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant} className="gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {formatDate(tx.created_at)}
                      </TableCell>
                      <TableCell>
                        {tx.tx_hash ? (
                          <a
                            href={getTxExplorerUrl(tx.tx_hash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            {shortenHash(tx.tx_hash)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
