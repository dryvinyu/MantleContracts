## 1. Contract Service Layer
- [x] 1.1 Create `lib/services/contractService.ts` with helper functions for contract address resolution
- [x] 1.2 Add functions to get contract address by asset symbol/ID
- [x] 1.3 Add type-safe contract interaction utilities using viem

## 2. Contract Read Hooks
- [x] 2.1 Create `lib/hooks/useContract.ts` with custom hooks for contract reads
- [x] 2.2 Implement `useAssetInfo` hook to read asset metadata (APY, risk, duration, etc.)
- [x] 2.3 Implement `useTokenBalance` hook to read user's token balance for an asset
- [x] 2.4 Implement `useUserInvestment` hook to read user's investment details (balance, investment time, canRedeem)
- [x] 2.5 Implement `useYieldComponents` hook to read yield breakdown from contract
- [x] 2.6 Add error handling and loading states for all read hooks

## 3. Contract Write Hooks
- [x] 3.1 Implement `useInvest` hook using wagmi's `useWriteContract` for invest transactions
- [x] 3.2 Implement `useRedeem` hook using wagmi's `useWriteContract` for redeem transactions
- [x] 3.3 Add transaction status tracking (pending, success, error)
- [x] 3.4 Add transaction hash storage and block explorer link generation
- [x] 3.5 Add error handling for transaction failures (user rejection, insufficient funds, etc.)

## 4. Update Investment Modals
- [x] 4.1 Update `components/AddPositionModal.tsx` to use `useInvest` hook
- [x] 4.2 Replace mock `addPosition` call with contract `invest` transaction
- [x] 4.3 Add transaction pending state UI (disable button, show loading)
- [x] 4.4 Add transaction success confirmation with block explorer link
- [x] 4.5 Add transaction error handling with user-friendly messages
- [x] 4.6 Update `components/RedeemModal.tsx` to use `useRedeem` hook
- [x] 4.7 Replace mock `redeemPosition` call with contract `redeem` transaction
- [x] 4.8 Add same transaction UI improvements as invest modal

## 5. Portfolio State Synchronization
- [x] 5.1 Update `lib/providers/PortfolioProvider.tsx` to read token balances from contracts
- [x] 5.2 Sync portfolio holdings with blockchain state on wallet connection
- [x] 5.3 Refresh portfolio data after successful invest/redeem transactions
- [x] 5.4 Handle wallet address changes and update balances accordingly

## 6. Transaction History Integration
- [x] 6.1 Create API endpoint to store transaction records (txHash, status, timestamp)
- [x] 6.2 Update transaction creation API to accept contract transaction data
- [x] 6.3 Store transaction records in database after successful contract calls
- [x] 6.4 Link transaction records to user and asset

## 7. Error Handling and UX
- [x] 7.1 Add wallet connection check before allowing contract interactions
- [x] 7.2 Add network validation (ensure user is on Mantle Sepolia Testnet)
- [x] 7.3 Add insufficient balance checks before invest transactions
- [x] 7.4 Add user-friendly error messages for common failure cases
- [x] 7.5 Add transaction timeout handling (if transaction doesn't confirm)

## 8. Testing and Validation
- [ ] 8.1 Test invest flow with real contract on testnet
- [ ] 8.2 Test redeem flow with real contract on testnet
- [ ] 8.3 Verify token balances update correctly after transactions
- [ ] 8.4 Verify error handling for all failure scenarios
- [ ] 8.5 Verify transaction status tracking works correctly

