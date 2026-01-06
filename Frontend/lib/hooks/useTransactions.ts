'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAccount } from 'wagmi'
import type { DbUserTransaction, TransactionType } from '@/lib/supabase'

interface UseTransactionsReturn {
  transactions: DbUserTransaction[]
  isLoading: boolean
  error: string | null
  fetchTransactions: () => Promise<void>
  recordTransaction: (
    params: RecordTransactionParams,
  ) => Promise<DbUserTransaction | null>
  updateTransactionStatus: (
    txHash: string,
    status: 'confirmed' | 'failed',
    blockNumber?: number,
  ) => Promise<void>
}

interface RecordTransactionParams {
  assetId: string
  assetName: string
  type: TransactionType
  amount: number
  valueUsd: number
  pricePerUnit: number
  txHash?: string
  chainId?: number
}

export function useTransactions(): UseTransactionsReturn {
  const { address } = useAccount()
  const [transactions, setTransactions] = useState<DbUserTransaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    if (!address) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/transactions?wallet=${address}`)
      const data = await response.json()

      if (data.transactions) {
        setTransactions(data.transactions)
      } else if (data.error) {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to fetch transactions')
    } finally {
      setIsLoading(false)
    }
  }, [address])

  const recordTransaction = useCallback(
    async (
      params: RecordTransactionParams,
    ): Promise<DbUserTransaction | null> => {
      if (!address) return null

      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: address,
            ...params,
          }),
        })

        const data = await response.json()

        if (data.transaction) {
          // Add to local state
          setTransactions((prev) => [data.transaction, ...prev])
          return data.transaction
        }

        return null
      } catch (err) {
        console.error('Failed to record transaction:', err)
        return null
      }
    },
    [address],
  )

  const updateTransactionStatus = useCallback(
    async (
      txHash: string,
      status: 'confirmed' | 'failed',
      blockNumber?: number,
    ) => {
      try {
        const response = await fetch(`/api/transactions/${txHash}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, blockNumber }),
        })

        if (response.ok) {
          // Update local state
          setTransactions((prev) =>
            prev.map((tx) =>
              tx.tx_hash === txHash
                ? {
                    ...tx,
                    status,
                    confirmed_at:
                      status === 'confirmed' ? new Date().toISOString() : null,
                  }
                : tx,
            ),
          )
        }
      } catch (err) {
        console.error('Failed to update transaction status:', err)
      }
    },
    [],
  )

  // Fetch transactions on mount
  useEffect(() => {
    if (address) {
      fetchTransactions()
    }
  }, [address, fetchTransactions])

  return {
    transactions,
    isLoading,
    error,
    fetchTransactions,
    recordTransaction,
    updateTransactionStatus,
  }
}

// Helper to format transaction for display
export function formatTransaction(tx: DbUserTransaction) {
  return {
    id: tx.id,
    type: tx.type,
    typeLabel:
      tx.type === 'invest'
        ? 'Investment'
        : tx.type === 'redeem'
          ? 'Redemption'
          : 'Yield Payout',
    assetName: tx.asset_name,
    amount: tx.amount,
    valueUsd: tx.value_usd,
    status: tx.status,
    statusLabel:
      tx.status === 'confirmed'
        ? 'Confirmed'
        : tx.status === 'pending'
          ? 'Pending'
          : 'Failed',
    txHash: tx.tx_hash,
    createdAt: new Date(tx.created_at),
    confirmedAt: tx.confirmed_at ? new Date(tx.confirmed_at) : null,
  }
}
