# Design: Smart Contract Integration

## Context
The RealFi application needs to interact with deployed smart contracts on Mantle Sepolia Testnet. Contracts are already deployed with addresses and ABIs defined in `app/frontend-abi.ts`. The application uses wagmi v3 and viem v2 for wallet integration, which provides hooks for contract interactions.

## Goals
- Enable real blockchain transactions (invest, redeem) via smart contracts
- Read contract state (balances, asset info) to display accurate data
- Provide seamless UX with transaction status tracking and error handling
- Sync blockchain state with UI and database

## Non-Goals
- Implementing new smart contracts (contracts are already deployed)
- Modifying contract ABIs (using existing ABIs from `frontend-abi.ts`)
- Supporting multiple networks simultaneously (focus on Mantle Sepolia Testnet)
- Implementing contract event listeners (can be added later if needed)

## Decisions

### Decision: Use wagmi hooks for contract interactions
**Rationale**: The project already uses wagmi v3 for wallet integration. Wagmi provides `useReadContract` and `useWriteContract` hooks that integrate seamlessly with the existing wallet setup and provide automatic caching, error handling, and TypeScript support.

**Alternatives considered**:
- Direct viem calls: More verbose, requires manual state management
- ethers.js: Would require additional dependency, less modern than viem

### Decision: Create service layer for contract address resolution
**Rationale**: Contract addresses are stored in `CONTRACT_ADDRESSES.TOKENS` keyed by symbol (e.g., `mUSTB2Y`). Assets in the database use IDs. A service layer abstracts the mapping between asset IDs/symbols and contract addresses.

**Alternatives considered**:
- Inline address resolution: Would scatter address lookup logic throughout components
- Database storage: Adds complexity, addresses are already defined in code

### Decision: Sync blockchain state with database after transactions
**Rationale**: After successful invest/redeem transactions, we need to update the database to reflect new token balances. This allows the portfolio API to continue working while also maintaining blockchain as source of truth.

**Alternatives considered**:
- Blockchain-only state: Would require refactoring all portfolio queries to read from contracts
- Database-only state: Would lose blockchain as source of truth

### Decision: Store transaction records in database
**Rationale**: Transaction records (txHash, status, timestamp) should be stored in the database for history tracking and UI display. The blockchain provides the source of truth, but database storage enables faster queries and offline access to transaction history.

**Alternatives considered**:
- Blockchain-only: Would require scanning blockchain for transaction history (slow, expensive)
- No storage: Would lose transaction history

### Decision: Use wagmi's transaction status hooks
**Rationale**: Wagmi provides `useWaitForTransactionReceipt` hook that automatically tracks transaction status (pending, success, error). This eliminates manual polling and provides better UX.

**Alternatives considered**:
- Manual polling: More code, less efficient
- Event listeners: More complex, not needed for simple transaction tracking

## Risks / Trade-offs

### Risk: Transaction failures not handled gracefully
**Mitigation**: Implement comprehensive error handling with user-friendly messages. Check wallet connection, network, and balance before allowing transactions.

### Risk: State desynchronization between blockchain and database
**Mitigation**: Always read token balances from contracts when displaying portfolio. Use database as cache, but blockchain as source of truth.

### Risk: High gas costs or slow transaction confirmation
**Mitigation**: Display transaction pending state clearly. Consider adding transaction timeout handling. For testnet, this is less of a concern.

### Risk: User on wrong network
**Mitigation**: Validate network before allowing contract interactions. Show clear error message if user is on wrong network with option to switch.

## Migration Plan

1. **Phase 1**: Add contract read hooks and display contract data in UI (non-breaking)
2. **Phase 2**: Update invest/redeem modals to use contract transactions (breaking change - requires wallet connection)
3. **Phase 3**: Sync portfolio state with blockchain (may require database migration if schema changes)

**Rollback**: If issues arise, can temporarily disable contract integration and revert to mock data by feature flag.

## Open Questions

- Should we implement contract event listeners for real-time balance updates? (Deferred - can add later)
- How should we handle multiple wallet addresses? (Use connected wallet address from WalletProvider)
- Should we cache contract reads? (Wagmi handles this automatically with react-query)
- How to handle contract calls when wallet is disconnected? (Show error, require connection)

