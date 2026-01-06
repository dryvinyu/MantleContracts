## 1. Setup Dependencies
- [x] 1.1 Install `wagmi` package for React wallet hooks
- [x] 1.2 Install `viem` package for Ethereum interaction
- [x] 1.3 Install `@tanstack/react-query` (peer dependency for wagmi)
- [x] 1.4 Install `@web3modal/wagmi` for WalletConnect integration (optional, can add later)

## 2. Network Configuration
- [x] 2.1 Create network configuration file with Mantle Mainnet (5000) and Testnet (5003) details
- [x] 2.2 Define RPC URLs, chain IDs, currency symbols, and block explorer URLs
- [x] 2.3 Export network configurations as constants

## 3. Wallet Provider Implementation
- [x] 3.1 Create wagmi configuration with Mantle networks
- [x] 3.2 Set up WalletConnect project (get project ID from walletconnect.com)
- [x] 3.3 Configure wagmi with MetaMask and WalletConnect connectors
- [x] 3.4 Create new WalletProvider component using wagmi hooks
- [x] 3.5 Implement connect/disconnect functionality
- [x] 3.6 Implement network switching functionality
- [x] 3.7 Add error handling for connection failures and wrong network scenarios
- [x] 3.8 Update WalletContext to expose new methods (switchNetwork, addNetwork, etc.)

## 4. User Preferences Storage
- [x] 4.1 Create utility functions for localStorage wallet preferences
- [x] 4.2 Store preferred network (mainnet/testnet)
- [x] 4.3 Store last connected wallet address
- [x] 4.4 Load preferences on wallet provider initialization
- [x] 4.5 Update preferences when user changes network or connects wallet

## 5. UI Updates
- [x] 5.1 Update Header component to show real wallet connection status
- [x] 5.2 Update network display to show current connected network
- [x] 5.3 Add network switching dropdown/button in Header
- [x] 5.4 Update "View on Explorer" link to use correct explorer URL based on network
- [x] 5.5 Add error messages for wallet connection failures
- [x] 5.6 Add prompt for network switching when user is on wrong network
- [x] 5.7 Update wallet connection button to trigger real wallet connection

## 6. Testing
- [ ] 6.1 Test MetaMask connection on Mantle Mainnet
- [ ] 6.2 Test MetaMask connection on Mantle Testnet
- [ ] 6.3 Test WalletConnect connection (if implemented)
- [ ] 6.4 Test network switching functionality
- [ ] 6.5 Test error handling (no wallet installed, user rejection, wrong network)
- [ ] 6.6 Test preference persistence across page reloads
- [ ] 6.7 Verify existing components still work with new wallet provider

## 7. Cleanup
- [x] 7.1 Remove mock wallet implementation code
- [x] 7.2 Remove hardcoded testnet chain ID references
- [x] 7.3 Update any remaining mock wallet references

## 8. Documentation
- [x] 8.1 Update README with wallet setup instructions
- [x] 8.2 Document environment variables needed (WalletConnect project ID)
- [x] 8.3 Add developer notes about network configuration

