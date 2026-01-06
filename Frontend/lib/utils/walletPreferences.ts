const PREFERRED_NETWORK_KEY = 'mantle-wallet-preferred-network'
const LAST_ADDRESS_KEY = 'mantle-wallet-last-address'

export type PreferredNetwork = 'mainnet' | 'testnet'

export function getPreferredNetwork(): PreferredNetwork | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(PREFERRED_NETWORK_KEY)
  if (stored === 'mainnet' || stored === 'testnet') {
    return stored
  }
  return null
}

export function setPreferredNetwork(network: PreferredNetwork): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PREFERRED_NETWORK_KEY, network)
}

export function getLastAddress(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(LAST_ADDRESS_KEY)
}

export function setLastAddress(address: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LAST_ADDRESS_KEY, address)
}

export function clearPreferences(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(PREFERRED_NETWORK_KEY)
  localStorage.removeItem(LAST_ADDRESS_KEY)
}
