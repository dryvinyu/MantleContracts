# Change: Enhance Invest and Redeem Capabilities

## Why
The current invest and redeem implementation provides basic transaction execution but lacks several important capabilities:
- Payment token approval handling (ERC20 approval required before invest)
- Pre-transaction validations (minimum investment amount, canRedeem flag check)
- Proper portfolio synchronization after transactions (currently uses page reload)
- Reading actual transaction amounts from blockchain events/receipts
- Enhanced error handling for contract-specific revert reasons

These enhancements will provide a more robust and user-friendly investment experience with proper validations, approvals, and state management.

## What Changes
- **ADDED**: Payment token approval flow before invest transactions
- **ADDED**: Pre-transaction validation for minimum investment amount
- **ADDED**: Pre-transaction validation for canRedeem flag before redeem
- **ADDED**: Portfolio state refresh mechanism without page reload
- **ADDED**: Transaction amount extraction from blockchain events/receipts
- **MODIFIED**: Enhanced error handling with contract-specific error messages
- **MODIFIED**: Improved transaction status tracking and user feedback

## Impact
- Affected specs: `contract-interaction`
- Affected code:
  - `lib/hooks/useContractWrite.ts` - Enhanced invest/redeem hooks
  - `components/AddPositionModal.tsx` - Added approval flow and validations
  - `components/RedeemModal.tsx` - Added canRedeem validation
  - `lib/hooks/usePortfolio.ts` - Portfolio refresh mechanism
  - `lib/services/contractService.ts` - Payment token contract interactions

