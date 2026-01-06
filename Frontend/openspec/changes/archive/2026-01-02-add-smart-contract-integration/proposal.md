# Change: Add Smart Contract Integration

## Why
The RealFi application currently uses mock data for portfolio management. The smart contracts have been deployed to Mantle Sepolia Testnet with addresses and ABIs defined in `app/frontend-abi.ts`. To enable real blockchain interactions, we need to integrate wagmi/viem hooks to read contract state and execute transactions (invest, redeem) directly on-chain.

## What Changes
- Add contract read hooks using wagmi's `useReadContract` for fetching asset data, balances, and user positions
- Add contract write hooks using wagmi's `useWriteContract` for executing invest and redeem transactions
- Create a contract interaction service layer to abstract contract calls
- Update `AddPositionModal` and `RedeemModal` to use real contract transactions instead of mock data
- Add transaction status tracking and error handling for contract interactions
- Sync blockchain state (token balances) with the UI and database
- Add transaction confirmation UI with block explorer links

## Impact
- Affected specs: 
  - New capability: `contract-interaction` (reading contract state, executing transactions)
  - May modify: `wallet-integration` (extend to include contract interaction requirements)
- Affected code:
  - `components/AddPositionModal.tsx` - Replace mock `addPosition` with contract `invest` call
  - `components/RedeemModal.tsx` - Replace mock `redeemPosition` with contract `redeem` call
  - `lib/providers/PortfolioProvider.tsx` - Sync with blockchain state
  - `lib/hooks/usePortfolio.ts` - May need updates for contract integration
  - New: `lib/hooks/useContract.ts` - Contract interaction hooks
  - New: `lib/services/contractService.ts` - Contract service layer
  - `app/frontend-abi.ts` - Already exists, will be used

