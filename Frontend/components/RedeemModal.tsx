'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, X, Loader2, CheckCircle2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useAccount, useChainId } from 'wagmi'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import usePortfolio from '@/lib/hooks/usePortfolio'
import { useWallet } from '@/lib/hooks/useWallet'
import { useRedeem } from '@/lib/hooks/useContractWrite'
import { useTokenBalance, useUserInvestment } from '@/lib/hooks/useContract'
import { type Asset, formatRwa } from '@/lib/mockData'
import { mantleTestnet } from '@/lib/config/networks'
import { getTxExplorerUrl } from '@/app/frontend-abi'

interface RedeemModalProps {
  asset: Asset
  onClose: () => void
}

// Transaction step indicator
function TransactionSteps({
  currentStep,
}: {
  currentStep: 'idle' | 'redeeming' | 'success'
}) {
  if (currentStep === 'idle') return null

  const steps = [
    { key: 'redeem', label: 'Redeem' },
    { key: 'done', label: 'Complete' },
  ]

  const getStepStatus = (stepKey: string) => {
    if (currentStep === 'success') return 'complete'
    if (stepKey === 'redeem')
      return currentStep === 'redeeming' ? 'active' : 'pending'
    return 'pending'
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

export default function RedeemModal({ asset, onClose }: RedeemModalProps) {
  const { portfolio, refreshPortfolio, isRefreshing } = usePortfolio()
  const { isConnected, connect } = useWallet()
  const { address } = useAccount()
  const chainId = useChainId()
  const [shares, setShares] = useState(1)
  const [sliderValue, setSliderValue] = useState([0])

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

  // Read token balance from contract
  const { balance: contractBalance, isLoading: isLoadingBalance } =
    useTokenBalance(
      {
        id: asset.id,
        name: asset.name,
        onchainAssetId: asset.onchainAssetId,
      },
      address,
    )

  // Read user investment details
  const { investment, isLoading: isLoadingInvestment } = useUserInvestment(
    {
      id: asset.id,
      name: asset.name,
      price: asset.price,
      onchainAssetId: asset.onchainAssetId,
    },
    address,
  )

  // Use contract balance if available, otherwise fall back to portfolio holdings
  const currentShares =
    contractBalance > 0 ? contractBalance : portfolio.holdings[asset.id] || 0

  // Update slider when balance loads
  useEffect(() => {
    if (currentShares > 0 && shares > currentShares) {
      setShares(Math.floor(currentShares))
    }
  }, [currentShares, shares])

  // Sync slider with shares
  useEffect(() => {
    if (currentShares > 0) {
      setSliderValue([(shares / currentShares) * 100])
    }
  }, [shares, currentShares])

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value)
    const newShares = Math.max(1, Math.floor((value[0] / 100) * currentShares))
    setShares(newShares)
  }

  const {
    redeem,
    reset,
    status,
    hash,
    error,
    isPending,
    isSuccess,
    canRedeem: canRedeemFromContract,
    isLoadingCanRedeem,
  } = useRedeem(
    {
      id: asset.id,
      name: asset.name,
      price: asset.price,
      onchainAssetId: asset.onchainAssetId,
    },
    handleRefresh,
  )

  const value = shares * asset.price
  const isCorrectNetwork = chainId === mantleTestnet.id
  const canRedeem =
    isConnected &&
    isCorrectNetwork &&
    shares <= currentShares &&
    shares > 0 &&
    !isPending &&
    (isLoadingCanRedeem ? true : canRedeemFromContract)

  // Determine current step for progress indicator
  const getCurrentStep = (): 'idle' | 'redeeming' | 'success' => {
    if (isSuccess) return 'success'
    if (isPending) return 'redeeming'
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
        description: 'Please connect your wallet to redeem',
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

    if (shares <= 0 || shares > currentShares) {
      toast.error('Invalid amount', {
        description: 'Please enter a valid number of shares to redeem',
      })
      return
    }

    try {
      await redeem(shares)
    } catch (err) {
      // Error handling is done in useRedeem hook
      console.error('Redeem error:', err)
    }
  }

  const handleMaxClick = () => {
    setShares(Math.floor(currentShares))
    setSliderValue([100])
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">Redeem Position (RWA)</h3>
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
              {formatRwa(asset.price)}/unit - {asset.apy}% APY
            </div>
          </div>

          {/* Transaction Progress */}
          <TransactionSteps currentStep={getCurrentStep()} />

          {/* Position Info */}
          <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Your Position</span>
              <span className="font-medium">
                {isLoadingBalance ? (
                  <Loader2 className="w-4 h-4 animate-spin inline" />
                ) : (
                  `${currentShares.toFixed(4)} units`
                )}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Position Value</span>
              <span className="font-medium">
                {formatRwa(currentShares * asset.price)}
              </span>
            </div>
            {investment && !isLoadingInvestment && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Original Investment</span>
                <span className="font-medium">
                  {formatRwa(investment.investmentAmount)}
                </span>
              </div>
            )}
          </div>

          {/* Amount Input with Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm text-slate-600">Units to Redeem</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMaxClick}
                className="text-xs h-6 px-2 text-blue-400 hover:text-blue-300"
                disabled={isPending || currentShares <= 0}
              >
                MAX
              </Button>
            </div>
            <Input
              type="number"
              min={1}
              max={currentShares}
              value={shares}
              onChange={(event) => {
                const val = Math.max(
                  1,
                  Math.min(
                    currentShares,
                    Number.parseInt(event.target.value, 10) || 1,
                  ),
                )
                setShares(val)
              }}
              className="bg-secondary"
              disabled={isPending}
            />
            {currentShares > 1 && (
              <Slider
                value={sliderValue}
                onValueChange={handleSliderChange}
                max={100}
                step={1}
                className="w-full"
                disabled={isPending}
              />
            )}
            <div className="flex justify-between text-xs text-slate-600">
              <span>0%</span>
              <span>{sliderValue[0].toFixed(0)}% of position</span>
              <span>100%</span>
            </div>
          </div>

          <div className="flex justify-between items-center py-3 border-t border-b border-border">
            <span className="text-slate-600">You Will Receive</span>
            <span className="font-semibold text-green-400">
              {formatRwa(value)}
            </span>
          </div>

          {!isConnected && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>Please connect your wallet to redeem</span>
            </div>
          )}

          {isConnected && !isCorrectNetwork && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>Please switch to {mantleTestnet.name}</span>
            </div>
          )}

          {isLoadingCanRedeem && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Checking redemption eligibility...</span>
            </div>
          )}

          {!isLoadingCanRedeem && !canRedeemFromContract && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>
                Redemption is not allowed at this time. The lock-up period may
                not have ended yet.
              </span>
            </div>
          )}

          {shares > currentShares && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>Cannot exceed current position</span>
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
              <span>Confirming redemption...</span>
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
              <span>Redemption successful!</span>
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
              disabled={!canRedeem}
              className="flex-1"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Done
                </>
              ) : (
                'Confirm Redemption'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
