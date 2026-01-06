import { defineChain } from 'viem'

export const mantleMainnet = defineChain({
  id: 5000,
  name: 'Mantle Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Mantle',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.mantle.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mantle Explorer',
      url: 'https://explorer.mantle.xyz',
    },
  },
  testnet: false,
})

export const mantleTestnet = defineChain({
  id: 5003,
  name: 'Mantle Sepolia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Mantle',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia.mantle.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mantle Sepolia Explorer',
      url: 'https://sepolia.mantlescan.xyz',
    },
  },
  testnet: true,
})

export const mantleChains = [mantleMainnet, mantleTestnet]

export const defaultChain = mantleMainnet

export function getNetworkName(chainId: number): string {
  switch (chainId) {
    case 5000:
      return 'Mantle Mainnet'
    case 5003:
      return 'Mantle Testnet'
    default:
      return 'Unknown Network'
  }
}

export function getExplorerUrl(chainId: number, address?: string): string {
  const baseUrl =
    chainId === 5000
      ? 'https://explorer.mantle.xyz'
      : 'https://explorer.testnet.mantle.xyz'
  return address ? `${baseUrl}/address/${address}` : baseUrl
}
