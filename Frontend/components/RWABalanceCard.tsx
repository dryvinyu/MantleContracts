'use client'

import { useState, useEffect } from 'react'
import {
  Wallet,
  RefreshCw,
  ArrowRightLeft,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { parseEther, formatEther } from 'viem'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useWallet } from '@/lib/hooks/useWallet'
import {
  RWA_EXCHANGE_ADDRESS,
  RWA_EXCHANGE_ABI,
  getClient,
  formatTokenAmount,
} from '@/lib/contracts'
import { mantleTestnet } from '@/lib/config/networks'

interface RWABalanceCardProps {
  className?: string
}

// MNT price in RWA (adjust based on market)
const MNT_PRICE_RWA = 0.5

export default function RWABalanceCard({ className }: RWABalanceCardProps) {
  const { isConnected, address, chainId } = useWallet()
  const [isMounted, setIsMounted] = useState(false)
  const [rwaBalance, setRwaBalance] = useState<bigint>(BigInt(0))
  const [isLoading, setIsLoading] = useState(false)
  const [showRechargeModal, setShowRechargeModal] = useState(false)
  const [rechargeAmount, setRechargeAmount] = useState('')
  const [isRecharging, setIsRecharging] = useState(false)

  // Contract write hook
  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash,
    })

  // Track mount state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch RWA balance from contract
  const fetchBalance = async () => {
    if (!address) return

    setIsLoading(true)
    try {
      const client = getClient(chainId || mantleTestnet.id)
      const balance = await client.readContract({
        address: RWA_EXCHANGE_ADDRESS,
        abi: RWA_EXCHANGE_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      })
      setRwaBalance(balance as bigint)
    } catch (error) {
      console.error('Failed to fetch balance:', error)
      setRwaBalance(BigInt(0))
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch RWA balance
  useEffect(() => {
    if (!isMounted || !isConnected || !address) {
      setRwaBalance(BigInt(0))
      return
    }

    fetchBalance()
  }, [isMounted, isConnected, address, chainId])

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      toast.success('Exchange successful!')
      fetchBalance()
      setShowRechargeModal(false)
      setRechargeAmount('')
      setIsRecharging(false)
    }
  }, [isConfirmed])

  const handleRefresh = async () => {
    if (!address) return
    await fetchBalance()
    toast.success('Balance updated')
  }

  const handleRecharge = async () => {
    if (!address || !rechargeAmount) return

    const amount = parseFloat(rechargeAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setIsRecharging(true)
    try {
      // Convert MNT amount to wei
      const mntAmountWei = parseEther(rechargeAmount)

      // Call exchangeMNT function on contract
      writeContract({
        address: RWA_EXCHANGE_ADDRESS,
        abi: RWA_EXCHANGE_ABI,
        functionName: 'exchangeMNT',
        value: mntAmountWei,
      })
    } catch (error: unknown) {
      console.error('Exchange failed:', error)
      toast.error('Exchange failed')
      setIsRecharging(false)
    }
  }

  // Calculate RWA preview (2 MNT = 1 RWA at default rate)
  const mntAmount = parseFloat(rechargeAmount) || 0
  const rwaPreview = mntAmount * MNT_PRICE_RWA // Since 1 RWA = 1 RWA and 1 MNT = 0.5 RWA

  // Format balance for display
  const formattedBalance = formatTokenAmount(rwaBalance, 18)

  // Always render the "not connected" state on server and initial client render
  // to prevent hydration mismatch
  if (!isMounted || !isConnected) {
    return (
      <div className={`glass-panel rounded-2xl p-4 ${className}`}>
        <div className="flex items-center gap-2 text-slate-600">
          <Wallet className="w-4 h-4" />
          <span className="text-sm">Connect wallet to view balance</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={`glass-panel rounded-2xl p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/50 blur" />
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">RWA</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-600">RWA Balance</p>
              <p className="text-lg font-semibold">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  `${formattedBalance.toFixed(2)} RWA`
                )}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>

        <Button
          className="w-full"
          size="sm"
          onClick={() => setShowRechargeModal(true)}
        >
          <ArrowRightLeft className="w-4 h-4 mr-2" />
          Exchange MNT for RWA
        </Button>

        {/* Contract info */}
        <div className="mt-2 pt-2 border-t border-border/50">
          <a
            href={`https://sepolia.mantlescan.xyz/address/${RWA_EXCHANGE_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-600 hover:text-primary flex items-center gap-1"
          >
            View Contract <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <Dialog open={showRechargeModal} onOpenChange={setShowRechargeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exchange MNT for RWA</DialogTitle>
            <DialogDescription>
              Use your MNT to get RWA tokens for investing in assets
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/30 text-sm text-primary">
              This is a real on-chain transaction on Mantle Testnet
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">MNT Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
              />
              <p className="text-xs text-slate-600">
                Enter the amount of MNT you want to exchange
              </p>
            </div>

            <div className="p-3 bg-secondary rounded-xl space-y-2 border border-border">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Exchange Rate</span>
                <span>1 MNT = {MNT_PRICE_RWA} RWA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">You pay</span>
                <span>{mntAmount.toFixed(4)} MNT</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="text-slate-600">You will receive</span>
                <span className="font-medium text-green-500">
                  {rwaPreview.toFixed(2)} RWA
                </span>
              </div>
            </div>

            {txHash && (
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <p className="text-sm text-green-500 mb-1">
                  {isConfirming
                    ? 'Confirming transaction...'
                    : 'Transaction submitted!'}
                </p>
                <a
                  href={`https://sepolia.mantlescan.xyz/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-600 hover:text-primary flex items-center gap-1"
                >
                  View on Explorer <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleRecharge}
              disabled={
                isPending ||
                isConfirming ||
                !rechargeAmount ||
                parseFloat(rechargeAmount) <= 0
              }
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isPending ? 'Confirm in wallet...' : 'Confirming...'}
                </>
              ) : (
                'Exchange MNT for RWA'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
