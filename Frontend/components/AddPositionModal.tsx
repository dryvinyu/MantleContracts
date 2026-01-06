'use client'

import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { useAccount, useChainId, useReadContract } from 'wagmi'
import { AlertCircle, X, Loader2, CheckCircle2, ArrowRight } from 'lucide-react'
import { formatUnits } from 'viem'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/lib/hooks/useWallet'
import usePortfolio from '@/lib/hooks/usePortfolio'
import { useInvest } from '@/lib/hooks/useContractWrite'
import { usePaymentTokenAddress } from '@/lib/hooks/useContract'
import { type Asset, formatRwa } from '@/lib/mockData'
import { mantleTestnet } from '@/lib/config/networks'
import { getTxExplorerUrl } from '@/app/frontend-abi'

// ERC20 ABI for balance check
const ERC20_BALANCE_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

interface AddPositionModalProps {
  asset: Asset
  onClose: () => void
}

// Transaction step indicator
function TransactionSteps({
  currentStep,
  needsApproval,
}: {
  currentStep: 'idle' | 'approving' | 'investing' | 'success'
  needsApproval: boolean
}) {
  if (currentStep === 'idle') return null

  const steps = needsApproval
    ? [
        { key: 'approve', label: 'Approve Token' },
        { key: 'invest', label: 'Invest' },
        { key: 'done', label: 'Complete' },
      ]
    : [
        { key: 'invest', label: 'Invest' },
        { key: 'done', label: 'Complete' },
      ]

  const getStepStatus = (stepKey: string) => {
    if (currentStep === 'success') return 'complete'
    if (needsApproval) {
      if (stepKey === 'approve')
        return currentStep === 'approving' ? 'active' : 'complete'
      if (stepKey === 'invest')
        return currentStep === 'investing' ? 'active' : 'pending'
      return 'pending'
    } else {
      if (stepKey === 'invest')
        return currentStep === 'investing' ? 'active' : 'pending'
      return 'pending'
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 py-3 bg-secondary/50 rounded-lg">
      {steps.map((step, index) => {
        const status = getStepStatus(step.key)
        return (
          <div key={step.key} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              {status === 'complete' ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : status === 'active' ? (
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-muted-foreground" />
              )}
              <span
                className={`text-xs ${status === 'active' ? 'text-blue-400 font-medium' : status === 'complete' ? 'text-green-500' : 'text-slate-600'}`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <ArrowRight className="w-3 h-3 text-slate-600" />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function AddPositionModal({
  asset,
  onClose,
}: AddPositionModalProps) {
  const { portfolio, refreshPortfolio, isRefreshing } = usePortfolio()
  const { isConnected, connect } = useWallet()
  const { address } = useAccount()
  const chainId = useChainId()
  const [shares, setShares] = useState(1)

  const handleRefresh = async () => {
    try {
      await refreshPortfolio()
    } catch (err) {
      console.error('Failed to refresh portfolio:', err)
      toast.error('Failed to refresh', {
        description: 'Please refresh the page manually',
      })
    }
  }

  // Get payment token address for balance check
  const { paymentTokenAddress } = usePaymentTokenAddress({
    id: asset.id,
    name: asset.name,
  })

  // Read payment token balance
  const { data: paymentTokenBalance, isLoading: isLoadingBalance } =
    useReadContract({
      address: paymentTokenAddress || undefined,
      abi: ERC20_BALANCE_ABI,
      functionName: 'balanceOf',
      args: address ? [address] : undefined,
      query: {
        enabled: !!paymentTokenAddress && !!address,
      },
    })

  // Read payment token symbol
  const { data: paymentTokenSymbol } = useReadContract({
    address: paymentTokenAddress || undefined,
    abi: ERC20_BALANCE_ABI,
    functionName: 'symbol',
    query: {
      enabled: !!paymentTokenAddress,
    },
  })

  const formattedBalance = paymentTokenBalance
    ? Number(formatUnits(paymentTokenBalance, 18))
    : 0
  const tokenSymbol = paymentTokenSymbol || 'RWA'

  const {
    invest,
    reset,
    status,
    hash,
    error,
    isPending,
    isSuccess,
    needsApproval,
    isLoadingApproval,
    allowance,
    minimumInvestment,
    isLoadingMinimum,
  } = useInvest(
    {
      id: asset.id,
      name: asset.name,
      price: asset.price,
      onchainAssetId: asset.onchainAssetId,
    },
    handleRefresh,
  )

  const cost = shares * asset.price
  const isCorrectNetwork = chainId === mantleTestnet.id
  const hasEnoughBalance = formattedBalance >= cost
  const isValidAmount =
    shares > 0 &&
    (!isLoadingMinimum && minimumInvestment > 0
      ? cost >= minimumInvestment
      : true)
  const canInvest =
    isConnected &&
    isCorrectNetwork &&
    !isPending &&
    isValidAmount &&
    hasEnoughBalance

  // Determine current step for progress indicator
  const getCurrentStep = (): 'idle' | 'approving' | 'investing' | 'success' => {
    if (isSuccess) return 'success'
    if (isPending && needsApproval) return 'approving'
    if (isPending && !needsApproval) return 'investing'
    return 'idle'
  }

  // Close modal on successful transaction
  useEffect(() => {
    if (isSuccess) {
      // Portfolio refresh is handled by onSuccess callback
      setTimeout(() => {
        onClose()
      }, 1500)
    }
  }, [isSuccess, onClose])

  const handleSubmit = async () => {
    if (!isConnected) {
      toast.error('Wallet not connected', {
        description: 'Please connect your wallet to invest',
        action: {
          label: 'Connect',
          onClick: () => connect(),
        },
      })
      return
    }

    if (!isCorrectNetwork) {
      toast.error('Wrong network', {
        description: `Please switch to ${mantleTestnet.name}`,
      })
      return
    }

    if (shares <= 0) {
      toast.error('Invalid amount', {
        description: 'Please enter a valid number of shares',
      })
      return
    }

    if (!hasEnoughBalance) {
      toast.error('Insufficient balance', {
        description: `You need ${formatRwa(cost)} ${tokenSymbol} but only have ${formatRwa(formattedBalance)}`,
      })
      return
    }

    try {
      await invest(shares)
    } catch (err) {
      // Error handling is done in useInvest hook
      console.error('Invest error:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">Add Position</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            disabled={isPending}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <div className="text-lg font-medium">{asset.name}</div>
            <div className="text-sm text-slate-600">
              {asset.apy}% APY - {formatRwa(asset.price)}/unit
            </div>
          </div>

          {/* Transaction Progress */}
          <TransactionSteps
            currentStep={getCurrentStep()}
            needsApproval={needsApproval || false}
          />

          <div className="space-y-2">
            <label className="text-sm text-slate-600">Number of Units</label>
            <Input
              type="number"
              min={1}
              value={shares}
              onChange={(event) =>
                setShares(
                  Math.max(1, Number.parseInt(event.target.value, 10) || 1),
                )
              }
              className="bg-secondary"
              disabled={isPending}
            />
          </div>

          <div className="flex justify-between items-center py-3 border-t border-b border-border">
            <span className="text-slate-600">Total Cost (RWA)</span>
            <span className="font-semibold">{formatRwa(cost)}</span>
          </div>

          {/* Payment Token Balance */}
          {isConnected && paymentTokenAddress && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Your {tokenSymbol} Balance</span>
              <span
                className={`${!hasEnoughBalance && cost > 0 ? 'text-destructive' : 'text-slate-900'}`}
              >
                {isLoadingBalance ? (
                  <Loader2 className="w-4 h-4 animate-spin inline" />
                ) : (
                  formatRwa(formattedBalance)
                )}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Available RWA</span>
            <span className="text-slate-900">
              {formatRwa(portfolio.cashUsd)}
            </span>
          </div>

          {isLoadingMinimum && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading minimum investment...</span>
            </div>
          )}

          {!isLoadingMinimum && minimumInvestment > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Minimum Investment (RWA)</span>
              <span className="text-slate-900">
                {formatRwa(minimumInvestment)}
              </span>
            </div>
          )}

          {isLoadingApproval && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Checking approval status...</span>
            </div>
          )}

          {needsApproval && !isLoadingApproval && !isPending && (
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <AlertCircle className="w-4 h-4" />
              <span>Payment token approval required (Step 1 of 2)</span>
            </div>
          )}

          {!isConnected && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>Please connect your wallet to invest</span>
            </div>
          )}

          {isConnected && !isCorrectNetwork && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>Please switch to {mantleTestnet.name}</span>
            </div>
          )}

          {!isLoadingMinimum &&
            minimumInvestment > 0 &&
            cost < minimumInvestment && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>
                  Amount must be at least {formatRwa(minimumInvestment)}
                </span>
              </div>
            )}

          {isConnected &&
            !isLoadingBalance &&
            !hasEnoughBalance &&
            cost > 0 && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>
                  Insufficient {tokenSymbol} balance. Need{' '}
                  {formatRwa(cost - formattedBalance)} more.
                </span>
              </div>
            )}

          {isRefreshing && (
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Refreshing portfolio...</span>
            </div>
          )}

          {status === 'pending' && (
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {needsApproval
                  ? 'Approving token...'
                  : 'Confirming transaction...'}
              </span>
              {hash && (
                <a
                  href={getTxExplorerUrl(hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View on Explorer
                </a>
              )}
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-center gap-2 text-sm text-green-500">
              <CheckCircle2 className="w-4 h-4" />
              <span>Investment successful!</span>
              {hash && (
                <a
                  href={getTxExplorerUrl(hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View on Explorer
                </a>
              )}
            </div>
          )}

          {status === 'error' && error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>{error.message || 'Transaction failed'}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canInvest || shares <= 0}
              className="flex-1"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {needsApproval ? 'Approving...' : 'Investing...'}
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Done
                </>
              ) : needsApproval ? (
                'Approve & Invest'
              ) : (
                'Invest'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
