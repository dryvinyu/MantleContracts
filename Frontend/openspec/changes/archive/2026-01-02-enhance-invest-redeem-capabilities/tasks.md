## 1. Payment Token Approval Flow
- [x] 1.1 Create hook to read payment token address from RWA contract (`paymentToken()`)
- [x] 1.2 Create hook to read payment token allowance (`allowance(owner, spender)`)
- [x] 1.3 Create hook to execute approval transaction (`approve(spender, amount)`)
- [x] 1.4 Integrate approval check and execution in `useInvest` hook
- [x] 1.5 Update `AddPositionModal` to show approval status and trigger approval if needed

## 2. Pre-Transaction Validations
- [x] 2.1 Read `minimumInvestment` from contract in invest flow
- [x] 2.2 Validate investment amount meets minimum requirement
- [x] 2.3 Read `getUserInvestment()` to get `canRedeem` flag before redeem
- [x] 2.4 Validate `canRedeem` is true before allowing redeem transaction
- [x] 2.5 Display validation errors in UI modals

## 3. Transaction Amount Extraction
- [x] 3.1 Parse `Invested` event from transaction receipt to get actual amounts
- [x] 3.2 Parse `Redeemed` event from transaction receipt to get actual amounts
- [x] 3.3 Update transaction storage API to use actual amounts from events
- [x] 3.4 Handle cases where events are not found (fallback to input amount)

## 4. Portfolio Synchronization
- [x] 4.1 Create `refreshPortfolio` function in `usePortfolio` hook
- [x] 4.2 Read token balances from contracts after successful transactions
- [x] 4.3 Update portfolio holdings state without page reload
- [x] 4.4 Replace `window.location.reload()` with programmatic refresh
- [x] 4.5 Add loading state during portfolio refresh

## 5. Enhanced Error Handling
- [x] 5.1 Map common contract revert reasons to user-friendly messages
- [x] 5.2 Handle "Insufficient allowance" error with approval prompt
- [x] 5.3 Handle "Below minimum investment" error
- [x] 5.4 Handle "Redemption not allowed" error (canRedeem false)
- [x] 5.5 Handle "Insufficient balance" errors for both invest and redeem
- [x] 5.6 Display contract-specific error messages in UI

## 6. Testing and Validation
- [ ] 6.1 Test invest flow with insufficient allowance (should prompt approval)
- [ ] 6.2 Test invest flow with amount below minimum
- [ ] 6.3 Test redeem flow when canRedeem is false
- [ ] 6.4 Test portfolio refresh after successful transactions
- [ ] 6.5 Test error handling for various contract revert scenarios

