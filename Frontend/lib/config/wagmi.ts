import { createConfig, http } from 'wagmi'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'
import { mantleMainnet, mantleTestnet, defaultChain } from './networks'

// WalletConnect project ID - can be set via environment variable
// For now, using a placeholder. Users should get their own from walletconnect.com
const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

export const wagmiConfig = createConfig({
  chains: [mantleMainnet, mantleTestnet],
  connectors: [
    // Use injected connector as fallback for browser extension wallets (MetaMask, etc.)
    injected({
      target: 'metaMask',
    }),
    // MetaMask SDK connector (for mobile/QR code)
    metaMask(),
    // WalletConnect connector (if project ID is provided)
    ...(walletConnectProjectId
      ? [
          walletConnect({
            projectId: walletConnectProjectId,
          }),
        ]
      : []),
  ],
  transports: {
    [mantleMainnet.id]: http(),
    [mantleTestnet.id]: http(),
  },
})

export { defaultChain, mantleMainnet, mantleTestnet }
