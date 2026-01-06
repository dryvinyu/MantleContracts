import {
  createPublicClient,
  http,
  type Address,
  type Hex,
  parseAbi,
} from 'viem'
import { mantleTestnet, mantleMainnet } from './config/networks'

// ============ Contract Addresses ============
export const RWA_EXCHANGE_ADDRESS = (process.env
  .NEXT_PUBLIC_RWA_TOKEN_ADDRESS || '') as Address
export const ASSET_REGISTRY_ADDRESS = (process.env
  .NEXT_PUBLIC_ASSET_REGISTRY_ADDRESS || '') as Address
export const ASSET_VAULT_ADDRESS = (process.env
  .NEXT_PUBLIC_ASSET_VAULT_ADDRESS || '') as Address

// ============ RWA Exchange ABI ============
export const RWA_EXCHANGE_ABI = parseAbi([
  // Read functions
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function rwaTokenPriceUSD() view returns (uint256)',
  'function treasury() view returns (address)',
  'function getTokenId(string symbol) pure returns (bytes32)',
  'function getTokenInfo(bytes32 tokenId) view returns (address tokenAddress, uint256 priceInUSD, uint8 decimals, bool isActive, string symbol)',
  'function getSupportedTokenIds() view returns (bytes32[])',
  'function calculateRWAAmount(bytes32 tokenId, uint256 paymentAmount) view returns (uint256)',
  'function calculatePaymentAmount(bytes32 tokenId, uint256 rwaAmount) view returns (uint256)',
  'function getStats() view returns (uint256 totalSupply, uint256 totalVolumeUSD, uint256 totalExchanges, uint256 rwaPrice)',
  // Write functions
  'function exchangeMNT() payable',
  'function exchangeToken(bytes32 tokenId, uint256 amount)',
  'function redeemToken(bytes32 tokenId, uint256 rwaAmount)',
])

// ============ Asset Registry ABI ============
export const ASSET_REGISTRY_ABI = parseAbi([
  'function registerAsset(string name,string assetType,uint256 expectedApyBps,uint256 targetAumUsdCents,uint256 minimumInvestmentUsdCents,uint256 durationDays,uint256 priceUsdCents,uint256 riskScore,bytes32 metadataHash) returns (bytes32)',
  'function assets(bytes32 assetId) view returns (string name,string assetType,uint256 expectedApyBps,uint256 targetAumUsdCents,uint256 minimumInvestmentUsdCents,uint256 durationDays,uint256 priceUsdCents,uint256 riskScore,bytes32 metadataHash,address creator,uint256 createdAt,bool active)',
  'function assetCount() view returns (uint256)',
  'event AssetRegistered(bytes32 indexed assetId,string name,string assetType,uint256 expectedApyBps,uint256 targetAumUsdCents,uint256 minimumInvestmentUsdCents,uint256 durationDays,uint256 priceUsdCents,uint256 riskScore,bytes32 metadataHash,address indexed creator)',
])

// ============ Asset Vault ABI ============
export const ASSET_VAULT_ABI = parseAbi([
  'function invest(bytes32 assetId,uint256 units)',
  'function redeem(bytes32 assetId,uint256 units)',
  'function quoteRwa(bytes32 assetId,uint256 units) view returns (uint256)',
  'function getPosition(bytes32 assetId,address user) view returns (uint256)',
  'event Invested(bytes32 indexed assetId,address indexed user,uint256 units,uint256 amountRwa)',
  'event Redeemed(bytes32 indexed assetId,address indexed user,uint256 units,uint256 amountRwa)',
])

// RWAToken ABI - only the functions we need
export const RWA_TOKEN_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function getAssetInfo() view returns (string assetType, uint256 expectedAPY, uint256 riskScore, uint256 duration, uint256 nextPayoutDate, uint8 status)',
  'function getExtendedInfo() view returns (uint256 yieldConfidence, uint256 totalAUM, uint256 minimumInvestment, uint256 payoutCount, uint256 maturityDate)',
  'function getUserInvestment(address user) view returns (uint256 balance, uint256 investmentTime, uint256 investmentAmount, bool canRedeem)',
  'function invest(uint256 amount) external',
  'function redeem(uint256 tokenAmount) external',
])

// ERC20 ABI for payment token (USDC/USDT)
export const ERC20_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
])

// Create public clients for reading from chain
export const testnetClient = createPublicClient({
  chain: mantleTestnet,
  transport: http(),
})

export const mainnetClient = createPublicClient({
  chain: mantleMainnet,
  transport: http(),
})

// Get client based on chain ID
export const getClient = (chainId: number) => {
  if (chainId === mantleMainnet.id) {
    return mainnetClient
  }
  return testnetClient
}

// Read token balance
export async function getTokenBalance(
  tokenAddress: Address,
  userAddress: Address,
  chainId: number = mantleTestnet.id,
): Promise<bigint> {
  const client = getClient(chainId)
  try {
    const balance = await client.readContract({
      address: tokenAddress,
      abi: RWA_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    })
    return balance
  } catch (error) {
    console.error('Error reading token balance:', error)
    return BigInt(0)
  }
}

// Read token decimals
export async function getTokenDecimals(
  tokenAddress: Address,
  chainId: number = mantleTestnet.id,
): Promise<number> {
  const client = getClient(chainId)
  try {
    const decimals = await client.readContract({
      address: tokenAddress,
      abi: RWA_TOKEN_ABI,
      functionName: 'decimals',
    })
    return Number(decimals)
  } catch (error) {
    console.error('Error reading token decimals:', error)
    return 18 // Default to 18 decimals
  }
}

// Read asset info from contract
export async function getAssetInfoFromContract(
  tokenAddress: Address,
  chainId: number = mantleTestnet.id,
) {
  const client = getClient(chainId)
  try {
    const [assetInfo, extendedInfo] = await Promise.all([
      client.readContract({
        address: tokenAddress,
        abi: RWA_TOKEN_ABI,
        functionName: 'getAssetInfo',
      }),
      client.readContract({
        address: tokenAddress,
        abi: RWA_TOKEN_ABI,
        functionName: 'getExtendedInfo',
      }),
    ])

    return {
      assetType: assetInfo[0],
      expectedAPY: Number(assetInfo[1]) / 100, // Convert basis points to percentage
      riskScore: Number(assetInfo[2]),
      duration: Number(assetInfo[3]),
      nextPayoutDate: Number(assetInfo[4]),
      status: assetInfo[5],
      yieldConfidence: Number(extendedInfo[0]),
      totalAUM: extendedInfo[1],
      minimumInvestment: extendedInfo[2],
      payoutCount: Number(extendedInfo[3]),
      maturityDate: Number(extendedInfo[4]),
    }
  } catch (error) {
    console.error('Error reading asset info:', error)
    return null
  }
}

// Get user investment info
export async function getUserInvestment(
  tokenAddress: Address,
  userAddress: Address,
  chainId: number = mantleTestnet.id,
) {
  const client = getClient(chainId)
  try {
    const result = await client.readContract({
      address: tokenAddress,
      abi: RWA_TOKEN_ABI,
      functionName: 'getUserInvestment',
      args: [userAddress],
    })

    return {
      balance: result[0],
      investmentTime: Number(result[1]),
      investmentAmount: result[2],
      canRedeem: result[3],
    }
  } catch (error) {
    console.error('Error reading user investment:', error)
    return null
  }
}

// Format token amount with decimals
export function formatTokenAmount(amount: bigint, decimals: number): number {
  return Number(amount) / Math.pow(10, decimals)
}

// Parse token amount to bigint
export function parseTokenAmount(amount: number, decimals: number): bigint {
  return BigInt(Math.floor(amount * Math.pow(10, decimals)))
}

// Batch read balances for multiple tokens
export async function batchGetBalances(
  tokens: { address: Address; assetId: string }[],
  userAddress: Address,
  chainId: number = mantleTestnet.id,
): Promise<Record<string, bigint>> {
  const client = getClient(chainId)
  const results: Record<string, bigint> = {}

  const calls = tokens.map((token) => ({
    address: token.address,
    abi: RWA_TOKEN_ABI,
    functionName: 'balanceOf' as const,
    args: [userAddress] as const,
  }))

  try {
    const balances = await client.multicall({
      contracts: calls,
    })

    tokens.forEach((token, index) => {
      const result = balances[index]
      if (result.status === 'success') {
        results[token.assetId] = result.result as bigint
      } else {
        results[token.assetId] = BigInt(0)
      }
    })
  } catch (error) {
    console.error('Error batch reading balances:', error)
    tokens.forEach((token) => {
      results[token.assetId] = BigInt(0)
    })
  }

  return results
}

// Batch read AssetVault positions for multiple assets
export async function batchGetPositions(
  assets: { onchainAssetId: Hex; assetId: string }[],
  userAddress: Address,
  chainId: number = mantleTestnet.id,
): Promise<Record<string, bigint>> {
  const client = getClient(chainId)
  const results: Record<string, bigint> = {}

  if (!ASSET_VAULT_ADDRESS) {
    assets.forEach((asset) => {
      results[asset.assetId] = BigInt(0)
    })
    return results
  }

  const calls = assets.map((asset) => ({
    address: ASSET_VAULT_ADDRESS,
    abi: ASSET_VAULT_ABI,
    functionName: 'getPosition' as const,
    args: [asset.onchainAssetId, userAddress] as const,
  }))

  try {
    const positions = await client.multicall({
      contracts: calls,
    })

    assets.forEach((asset, index) => {
      const result = positions[index]
      if (result.status === 'success') {
        results[asset.assetId] = result.result as bigint
      } else {
        results[asset.assetId] = BigInt(0)
      }
    })
  } catch (error) {
    console.error('Error batch reading positions:', error)
    assets.forEach((asset) => {
      results[asset.assetId] = BigInt(0)
    })
  }

  return results
}
