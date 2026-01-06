# Change: Add Real Mantle Network Wallet Integration

## Why
The current wallet implementation uses mock data with a hardcoded testnet chain ID (5003). To enable real-world asset transactions and interactions with the Mantle blockchain, the application needs to integrate with actual wallet providers (MetaMask, WalletConnect) and support Mantle Mainnet (chain ID 5000) as the primary network. Users should be able to connect their wallets, switch between networks, and have their preferences persisted.

## What Changes
- **BREAKING**: Replace mock wallet connection with real MetaMask/WalletConnect integration
- Add Mantle Mainnet (chain ID 5000) as the default network with proper RPC configuration
- Add Mantle Testnet (chain ID 5003) as an optional network for testing
- Implement network switching functionality
- Add wallet connection state management with proper error handling
- Store user wallet preferences (preferred network, last connected address) in browser storage
- Update UI components to reflect real wallet connection status and network information
- Add automatic network switching prompts when user's wallet is on wrong network

## Impact
- Affected specs: New capability `wallet-integration`
- Affected code:
  - `lib/providers/WalletProvider.tsx` - Complete rewrite for real wallet integration
  - `lib/hooks/useWallet.ts` - Update to expose new wallet methods
  - `components/business/Header.tsx` - Update network display and wallet connection UI
  - New dependencies: `ethers` or `viem` for Ethereum interaction, `@web3modal/wagmi` or `wagmi` for wallet connection
- Breaking changes: Wallet connection API changes from mock to real implementation

