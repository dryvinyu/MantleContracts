# Design: Mantle Wallet Integration

## Context
The application currently uses a mock wallet provider that simulates wallet connection without actual blockchain interaction. To enable real transactions and interactions with tokenized assets on Mantle Network, we need to integrate with real wallet providers and support Mantle Mainnet (chain ID 5000) and Testnet (chain ID 5003).

## Goals / Non-Goals

### Goals
- Integrate with MetaMask and WalletConnect-compatible wallets
- Support Mantle Mainnet (5000) as primary network
- Support Mantle Testnet (5003) for development/testing
- Allow users to switch between networks
- Persist user preferences (preferred network, last connected address)
- Provide clear error messages for connection failures and wrong network scenarios
- Maintain backward compatibility with existing UI components using wallet context

### Non-Goals
- Support for non-EVM wallets (Solana, etc.)
- Custom wallet implementation
- Multi-wallet simultaneous connections
- Wallet transaction signing UI (handled by wallet provider)

## Decisions

### Decision: Use wagmi + viem for wallet integration
**Rationale**: 
- `wagmi` provides React hooks for Ethereum wallet integration with excellent TypeScript support
- `viem` is a modern, type-safe alternative to ethers.js with better performance
- Both libraries have excellent MetaMask and WalletConnect support
- Active maintenance and large community adoption
- Works seamlessly with Next.js App Router

**Alternatives considered**:
- `ethers.js` directly: More verbose, less React-friendly, requires manual provider management
- `web3-react`: Less maintained, more complex API
- Custom implementation: Too much work, error-prone

### Decision: Default to Mantle Mainnet (5000)
**Rationale**:
- Production application should default to mainnet
- Users can switch to testnet if needed for testing
- Aligns with real-world asset trading expectations

**Alternatives considered**:
- Default to testnet: Not appropriate for production
- Environment-based default: Adds complexity, mainnet should be default

### Decision: Store preferences in localStorage
**Rationale**:
- Simple, no backend required
- Persists across sessions
- Fast access
- Sufficient for user preferences (network, last address)

**Alternatives considered**:
- Database storage: Overkill for client-side preferences
- Session storage: Lost on tab close, less useful
- Cookies: Unnecessary complexity

### Decision: Auto-prompt network switch
**Rationale**:
- Better UX - automatically prompt user to switch if on wrong network
- Reduces user confusion
- Standard pattern in Web3 applications

**Alternatives considered**:
- Manual switch only: Poor UX, users may not know they're on wrong network
- Auto-switch without prompt: Security risk, should require user approval

## Network Configuration

### Mantle Mainnet
- Chain ID: 5000
- RPC URL: https://rpc.mantle.xyz
- Currency Symbol: MNT
- Block Explorer: https://explorer.mantle.xyz
- Testnet: false

### Mantle Testnet (Sepolia)
- Chain ID: 5003
- RPC URL: https://rpc.testnet.mantle.xyz
- Currency Symbol: MNT
- Block Explorer: https://explorer.testnet.mantle.xyz
- Testnet: true

## Risks / Trade-offs

### Risk: Wallet not installed
**Mitigation**: Show clear error message with link to install MetaMask, provide WalletConnect as alternative

### Risk: User rejects connection
**Mitigation**: Handle rejection gracefully, show user-friendly error message

### Risk: User on wrong network
**Mitigation**: Detect network mismatch, prompt user to switch, provide one-click network addition

### Risk: Network RPC failures
**Mitigation**: Use fallback RPC endpoints, show error message if all fail

### Risk: Breaking changes to existing components
**Mitigation**: Maintain same WalletContext API shape, only change implementation

## Migration Plan

1. Install dependencies (`wagmi`, `viem`, `@tanstack/react-query`)
2. Create new WalletProvider implementation with real wallet integration
3. Update WalletContext to include new methods (switchNetwork, etc.)
4. Update Header component to use new wallet methods
5. Test with MetaMask and WalletConnect
6. Remove mock implementation
7. Update documentation

## Open Questions
- Should we support additional wallet providers beyond MetaMask/WalletConnect? (Answer: Start with these two, expand later if needed)
- Should we add transaction history tracking? (Answer: Out of scope for this change)
- Should we add balance display? (Answer: Future enhancement, not required for initial integration)

