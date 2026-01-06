import { type Address } from 'viem'
import { CONTRACT_ADDRESSES, ASSETS, RWA_TOKEN_ABI } from '@/app/frontend-abi'

/**
 * Get contract address by asset symbol
 * @param symbol Asset symbol (e.g., 'mUSTB2Y')
 * @returns Contract address or null if not found
 */
export function getContractAddressBySymbol(symbol: string): Address | null {
  const address =
    CONTRACT_ADDRESSES.TOKENS[symbol as keyof typeof CONTRACT_ADDRESSES.TOKENS]
  return address ? (address as Address) : null
}

/**
 * Get contract address by asset ID
 * Maps asset ID to symbol, then to contract address
 * @param assetId Asset ID from database
 * @param assetName Optional asset name for fallback lookup
 * @returns Contract address or null if not found
 */
export function getContractAddressByAssetId(
  assetId: string,
  assetName?: string,
): Address | null {
  // First, try to find by matching asset name or ID in ASSETS array
  const asset = ASSETS.find(
    (a) =>
      a.symbol.toLowerCase() === assetId.toLowerCase() ||
      a.name.toLowerCase() === assetId.toLowerCase() ||
      (assetName && a.name.toLowerCase() === assetName.toLowerCase()),
  )

  if (asset) {
    return getContractAddressBySymbol(asset.symbol)
  }

  // If not found, return null
  return null
}

/**
 * Get contract address from asset object
 * Uses tokenAddress field if available, otherwise looks up by symbol
 * @param asset Asset object with id, name, and optional tokenAddress
 * @returns Contract address or null if not found
 */
export function getContractAddress(asset: {
  id: string
  name: string
  tokenAddress?: string | null
}): Address | null {
  // If tokenAddress is already set, use it
  if (asset.tokenAddress) {
    return asset.tokenAddress as Address
  }

  // Otherwise, look up by asset ID/name
  return getContractAddressByAssetId(asset.id, asset.name)
}

/**
 * Get asset symbol from contract address
 * @param address Contract address
 * @returns Asset symbol or null if not found
 */
export function getSymbolByAddress(address: Address): string | null {
  const entry = Object.entries(CONTRACT_ADDRESSES.TOKENS).find(
    ([_, addr]) => addr.toLowerCase() === address.toLowerCase(),
  )
  return entry ? entry[0] : null
}

/**
 * Check if an address is a valid RWA token contract
 * @param address Contract address to check
 * @returns True if address is in CONTRACT_ADDRESSES.TOKENS
 */
export function isValidTokenAddress(address: Address): boolean {
  return Object.values(CONTRACT_ADDRESSES.TOKENS).some(
    (addr) => addr.toLowerCase() === address.toLowerCase(),
  )
}

/**
 * Get RWA Token ABI
 * @returns RWA Token ABI array
 */
export function getRWATokenABI() {
  return RWA_TOKEN_ABI
}

/**
 * Get YieldDistributor contract address
 * @returns YieldDistributor contract address
 */
export function getYieldDistributorAddress(): Address {
  return CONTRACT_ADDRESSES.YIELD_DISTRIBUTOR as Address
}
