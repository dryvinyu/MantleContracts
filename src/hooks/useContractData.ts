"use client";

import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { RWA_TOKEN_ABI, YIELD_DISTRIBUTOR_ABI, ASSET_STATUS } from "@/lib/contracts";
import { formatUnits, parseUnits } from "viem";
import type { AssetStatus } from "@/types/contracts";

// ============ RWA Token Read Hooks ============

/**
 * Hook to get basic RWA token asset info (includes status)
 */
export function useRWATokenInfo(contractAddress: string | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: RWA_TOKEN_ABI,
    functionName: "getAssetInfo",
    query: {
      enabled: !!contractAddress && contractAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  return {
    assetInfo: data
      ? {
          assetType: data[0] as string,
          expectedAPY: Number(data[1]) / 100, // Convert from basis points
          riskScore: Number(data[2]),
          duration: Number(data[3]),
          nextPayoutDate: new Date(Number(data[4]) * 1000),
          status: ASSET_STATUS[data[5] as keyof typeof ASSET_STATUS] as AssetStatus,
        }
      : null,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get extended RWA token info (includes maturityDate)
 */
export function useRWATokenExtendedInfo(contractAddress: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: RWA_TOKEN_ABI,
    functionName: "getExtendedInfo",
    query: {
      enabled: !!contractAddress && contractAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  return {
    extendedInfo: data
      ? {
          yieldConfidence: Number(data[0]),
          totalAUM: parseFloat(formatUnits(data[1], 18)),
          minimumInvestment: parseFloat(formatUnits(data[2], 18)),
          payoutCount: Number(data[3]),
          maturityDate: new Date(Number(data[4]) * 1000),
        }
      : null,
    isLoading,
    error,
  };
}

/**
 * Hook to get user investment info
 */
export function useUserInvestment(
  contractAddress: string | undefined,
  userAddress: string | undefined
) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: RWA_TOKEN_ABI,
    functionName: "getUserInvestment",
    args: [userAddress as `0x${string}`],
    query: {
      enabled: !!contractAddress && !!userAddress,
    },
  });

  return {
    investment: data
      ? {
          balance: parseFloat(formatUnits(data[0], 18)),
          investmentTime: new Date(Number(data[1]) * 1000),
          investmentAmount: parseFloat(formatUnits(data[2], 18)),
          canRedeem: data[3],
        }
      : null,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to check if asset is matured
 */
export function useIsMatured(contractAddress: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: RWA_TOKEN_ABI,
    functionName: "isMatured",
    query: {
      enabled: !!contractAddress && contractAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  return {
    isMatured: data ?? false,
    isLoading,
    error,
  };
}

/**
 * Hook to get risk level string
 */
export function useRiskLevel(contractAddress: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: RWA_TOKEN_ABI,
    functionName: "getRiskLevel",
    query: {
      enabled: !!contractAddress && contractAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  return {
    riskLevel: data as string | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get yield components count
 */
export function useYieldComponentsCount(contractAddress: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: RWA_TOKEN_ABI,
    functionName: "getYieldComponentsCount",
    query: {
      enabled: !!contractAddress && contractAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  return {
    count: data ? Number(data) : 0,
    isLoading,
    error,
  };
}

/**
 * Hook to get a specific yield component
 */
export function useYieldComponent(
  contractAddress: string | undefined,
  index: number
) {
  const { data, isLoading, error } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: RWA_TOKEN_ABI,
    functionName: "getYieldComponent",
    args: [BigInt(index)],
    query: {
      enabled: !!contractAddress && contractAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  return {
    component: data
      ? {
          name: data[0],
          value: Number(data[1]) / 100, // Convert from basis points
          description: data[2],
        }
      : null,
    isLoading,
    error,
  };
}

/**
 * Hook to get all yield components
 */
export function useAllYieldComponents(
  contractAddress: string | undefined,
  count: number
) {
  const contracts = Array.from({ length: count }, (_, i) => ({
    address: contractAddress as `0x${string}`,
    abi: RWA_TOKEN_ABI,
    functionName: "getYieldComponent" as const,
    args: [BigInt(i)],
  }));

  const { data, isLoading, error } = useReadContracts({
    contracts,
    query: {
      enabled: !!contractAddress && count > 0,
    },
  });

  return {
    components: data
      ? data
          .filter((result) => result.status === "success")
          .map((result) => {
            const [name, value, description] = result.result as [string, bigint, string];
            return {
              name,
              value: Number(value) / 100,
              description,
            };
          })
      : [],
    isLoading,
    error,
  };
}

/**
 * Hook to get user token balance
 */
export function useTokenBalance(
  contractAddress: string | undefined,
  userAddress: string | undefined
) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: RWA_TOKEN_ABI,
    functionName: "balanceOf",
    args: [userAddress as `0x${string}`],
    query: {
      enabled: !!contractAddress && !!userAddress,
    },
  });

  return {
    balance: data ? formatUnits(data, 18) : "0",
    rawBalance: data,
    isLoading,
    error,
    refetch,
  };
}

// ============ RWA Token Write Hooks ============

/**
 * Hook to invest in RWA token
 */
export function useInvest() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const invest = (contractAddress: string, amount: number) => {
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: RWA_TOKEN_ABI,
      functionName: "invest",
      args: [parseUnits(amount.toString(), 18)],
    });
  };

  return {
    invest,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to redeem RWA tokens
 */
export function useRedeem() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const redeem = (contractAddress: string, amount: number) => {
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: RWA_TOKEN_ABI,
      functionName: "redeem",
      args: [parseUnits(amount.toString(), 18)],
    });
  };

  return {
    redeem,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// ============ Yield Distributor Hooks ============

/**
 * Hook to get token distribution stats
 */
export function useTokenDistributionStats(
  distributorAddress: string | undefined,
  tokenAddress: string | undefined
) {
  const { data, isLoading, error } = useReadContract({
    address: distributorAddress as `0x${string}`,
    abi: YIELD_DISTRIBUTOR_ABI,
    functionName: "getTokenStats",
    args: [tokenAddress as `0x${string}`],
    query: {
      enabled: !!distributorAddress && !!tokenAddress,
    },
  });

  return {
    stats: data
      ? {
          totalDistributed: parseFloat(formatUnits(data[0], 18)),
          distributionCount: Number(data[1]),
        }
      : null,
    isLoading,
    error,
  };
}

/**
 * Hook to get recent distributions for a token
 */
export function useRecentDistributions(
  distributorAddress: string | undefined,
  tokenAddress: string | undefined,
  limit: number = 10
) {
  const { data, isLoading, error } = useReadContract({
    address: distributorAddress as `0x${string}`,
    abi: YIELD_DISTRIBUTOR_ABI,
    functionName: "getRecentDistributions",
    args: [tokenAddress as `0x${string}`, BigInt(limit)],
    query: {
      enabled: !!distributorAddress && !!tokenAddress,
    },
  });

  return {
    distributions: data
      ? data[0].map((amount, index) => ({
          amount: parseFloat(formatUnits(amount, 18)),
          timestamp: new Date(Number(data[1][index]) * 1000),
          recipientCount: Number(data[2][index]),
        }))
      : [],
    isLoading,
    error,
  };
}

/**
 * Hook to get total distributions count
 */
export function useDistributionsCount(distributorAddress: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: distributorAddress as `0x${string}`,
    abi: YIELD_DISTRIBUTOR_ABI,
    functionName: "getDistributionsCount",
    query: {
      enabled: !!distributorAddress,
    },
  });

  return {
    count: data ? Number(data) : 0,
    isLoading,
    error,
  };
}

// ============ Combined Hook ============

/**
 * Hook to get complete asset data from chain
 */
export function useCompleteAssetData(contractAddress: string | undefined) {
  const { assetInfo, isLoading: infoLoading } = useRWATokenInfo(contractAddress);
  const { extendedInfo, isLoading: extendedLoading } = useRWATokenExtendedInfo(contractAddress);
  const { count: componentsCount } = useYieldComponentsCount(contractAddress);
  const { components } = useAllYieldComponents(contractAddress, componentsCount);
  const { isMatured } = useIsMatured(contractAddress);

  return {
    data: assetInfo && extendedInfo
      ? {
          ...assetInfo,
          ...extendedInfo,
          yieldComponents: components,
          isMatured,
        }
      : null,
    isLoading: infoLoading || extendedLoading,
  };
}

/**
 * Hook to get complete asset data with user info
 */
export function useCompleteAssetDataWithUser(
  contractAddress: string | undefined,
  userAddress: string | undefined
) {
  const { data: assetData, isLoading: assetLoading } = useCompleteAssetData(contractAddress);
  const { investment, isLoading: investmentLoading } = useUserInvestment(contractAddress, userAddress);
  const { balance } = useTokenBalance(contractAddress, userAddress);

  return {
    data: assetData
      ? {
          ...assetData,
          userBalance: parseFloat(balance),
          userInvestment: investment,
        }
      : null,
    isLoading: assetLoading || investmentLoading,
  };
}
