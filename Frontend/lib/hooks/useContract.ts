'use client'

import { useReadContract, useAccount } from 'wagmi'
import { type Address, formatUnits } from 'viem'
import {
  ASSET_REGISTRY_ABI,
  ASSET_REGISTRY_ADDRESS,
  ASSET_VAULT_ABI,
  ASSET_VAULT_ADDRESS,
  RWA_EXCHANGE_ADDRESS,
} from '@/lib/contracts'

// ERC20 ABI for payment token operations
const ERC20_ABI = [
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

/**
 * Hook to read asset info from contract
 */
export function useAssetInfo(asset: {
  id: string
  name: string
  onchainAssetId?: string | null
}) {
  const onchainAssetId = asset.onchainAssetId

  const { data, isLoading, error, refetch } = useReadContract({
    address: ASSET_REGISTRY_ADDRESS || undefined,
    abi: ASSET_REGISTRY_ABI,
    functionName: 'assets',
    args: onchainAssetId ? [onchainAssetId as `0x${string}`] : undefined,
    query: {
      enabled: !!ASSET_REGISTRY_ADDRESS && !!onchainAssetId,
    },
  })

  return {
    assetInfo: data
      ? {
          assetType: data[1] as string,
          expectedAPY: Number(data[2]) / 100,
          riskScore: Number(data[7]),
          duration: Number(data[5]),
          nextPayoutDate: null,
          status: data[11] ? 0 : 3,
        }
      : null,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to read user's token balance
 */
export function useTokenBalance(
  asset: {
    id: string
    name: string
    onchainAssetId?: string | null
  },
  userAddress?: Address | null,
) {
  const onchainAssetId = asset.onchainAssetId

  const { address } = useAccount()
  const effectiveAddress = userAddress || address

  const { data, isLoading, error, refetch } = useReadContract({
    address: ASSET_VAULT_ADDRESS || undefined,
    abi: ASSET_VAULT_ABI,
    functionName: 'getPosition',
    args:
      onchainAssetId && effectiveAddress
        ? [onchainAssetId as `0x${string}`, effectiveAddress]
        : undefined,
    query: {
      enabled: !!ASSET_VAULT_ADDRESS && !!onchainAssetId && !!effectiveAddress,
    },
  })

  return {
    balance: data ? Number(formatUnits(data, 18)) : 0,
    balanceRaw: data || BigInt(0),
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to read user's investment details
 */
export function useUserInvestment(
  asset: {
    id: string
    name: string
    price?: number
    onchainAssetId?: string | null
  },
  userAddress?: Address | null,
) {
  const onchainAssetId = asset.onchainAssetId

  const { address } = useAccount()
  const effectiveAddress = userAddress || address

  const { data, isLoading, error, refetch } = useReadContract({
    address: ASSET_VAULT_ADDRESS || undefined,
    abi: ASSET_VAULT_ABI,
    functionName: 'getPosition',
    args:
      onchainAssetId && effectiveAddress
        ? [onchainAssetId as `0x${string}`, effectiveAddress]
        : undefined,
    query: {
      enabled: !!ASSET_VAULT_ADDRESS && !!onchainAssetId && !!effectiveAddress,
    },
  })

  const units = data ? Number(formatUnits(data, 18)) : 0
  const investmentAmount = asset.price ? units * asset.price : units

  return {
    investment: data
      ? {
          balance: units,
          investmentTime: 0,
          investmentAmount,
          canRedeem: true,
        }
      : null,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to read yield components from contract
 */
export function useYieldComponents(asset: { id: string; name: string }) {
  return {
    count: 0,
    isLoading: false,
    componentIndices: [],
  }
}

/**
 * Hook to read payment token address from RWA contract
 */
export function usePaymentTokenAddress(asset: { id: string; name: string }) {
  return {
    paymentTokenAddress: RWA_EXCHANGE_ADDRESS,
    isLoading: false,
    error: null,
    refetch: async () => {},
  }
}

/**
 * Hook to read payment token allowance
 */
export function usePaymentTokenAllowance(
  paymentTokenAddress: Address | null,
  ownerAddress: Address | null,
  spenderAddress: Address | null,
) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: paymentTokenAddress || undefined,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args:
      ownerAddress && spenderAddress
        ? [ownerAddress, spenderAddress]
        : undefined,
    query: {
      enabled: !!paymentTokenAddress && !!ownerAddress && !!spenderAddress,
    },
  })

  return {
    allowance: data ? Number(formatUnits(data, 18)) : 0,
    allowanceRaw: data || BigInt(0),
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to read minimum investment from contract
 */
export function useMinimumInvestment(asset: {
  id: string
  name: string
  onchainAssetId?: string | null
}) {
  const onchainAssetId = asset.onchainAssetId

  const { data, isLoading, error, refetch } = useReadContract({
    address: ASSET_REGISTRY_ADDRESS || undefined,
    abi: ASSET_REGISTRY_ABI,
    functionName: 'assets',
    args: onchainAssetId ? [onchainAssetId as `0x${string}`] : undefined,
    query: {
      enabled: !!ASSET_REGISTRY_ADDRESS && !!onchainAssetId,
    },
  })

  const minimumInvestmentCents = data ? Number(data[4]) : 0

  return {
    minimumInvestment: minimumInvestmentCents / 100,
    minimumInvestmentRaw: BigInt(minimumInvestmentCents),
    isLoading,
    error,
    refetch,
  }
}
