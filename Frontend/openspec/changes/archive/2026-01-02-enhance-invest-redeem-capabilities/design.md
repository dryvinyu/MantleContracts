## Context
The current invest and redeem implementation provides basic transaction execution but lacks several critical capabilities:
- Payment token approval handling (ERC20 tokens require approval before transfer)
- Pre-transaction validations (minimum investment, canRedeem checks)
- Proper portfolio synchronization (currently uses page reload)
- Transaction amount extraction from blockchain events

This change enhances the existing contract interaction hooks and UI components to provide a complete, production-ready investment flow.

## Goals / Non-Goals

### Goals
- Implement payment token approval flow before invest transactions
- Add pre-transaction validations to prevent failed transactions
- Replace page reload with programmatic portfolio refresh
- Extract actual transaction amounts from blockchain events
- Improve error handling with contract-specific messages

### Non-Goals
- Changing the core contract interaction patterns (wagmi hooks remain)
- Implementing batch transactions or multi-asset operations
- Adding transaction queuing or retry mechanisms
- Changing the database schema for transactions

## Decisions

### Decision: Payment Token Approval Flow
**What**: Check and request payment token approval before invest transactions.

**Why**: ERC20 tokens require explicit approval before a contract can transfer tokens on behalf of the user. The RWA contract's `invest()` function will fail if the user hasn't approved the contract to spend their payment tokens.

**Implementation**:
1. Read `paymentToken()` from RWA contract to get payment token address
2. Read `allowance(owner, spender)` from payment token contract
3. If allowance < investment amount, execute `approve(spender, amount)` transaction
4. Wait for approval confirmation, then proceed with invest

**Alternatives considered**:
- Infinite approval (approve max uint256): Simpler UX but less secure, users may prefer per-transaction approval
- Approval in separate step: More explicit but worse UX
- **Chosen**: Check and request approval automatically, but allow user to see approval status

### Decision: Portfolio Refresh Without Page Reload
**What**: Programmatically refresh portfolio state after successful transactions.

**Why**: `window.location.reload()` is a poor user experience and loses application state. We should update portfolio data programmatically.

**Implementation**:
1. After transaction success, read updated token balances from contracts
2. Update portfolio holdings state in `usePortfolio` hook
3. Trigger UI re-render with new data
4. Show loading indicator during refresh

**Alternatives considered**:
- Keep page reload: Simple but poor UX
- Optimistic updates: Fast but may show incorrect data if transaction fails
- **Chosen**: Read from blockchain after confirmation, then update state

### Decision: Transaction Amount Extraction from Events
**What**: Parse blockchain events to get actual transaction amounts.

**Why**: The actual amounts transferred may differ from input amounts due to rounding, fees, or contract logic. Events provide the source of truth.

**Implementation**:
1. Parse transaction receipt for `Invested` or `Redeemed` events
2. Extract `paymentAmount` and `tokenAmount` from event logs
3. Use these amounts when storing transaction records
4. Fallback to input amount if events not found

**Alternatives considered**:
- Use input amounts: Simple but may be inaccurate
- Read balances before/after: More complex, requires multiple reads
- **Chosen**: Parse events (most accurate, single source of truth)

### Decision: Pre-Transaction Validations
**What**: Validate minimum investment and canRedeem before submitting transactions.

**Why**: Failed transactions waste gas fees and provide poor UX. We should validate conditions before submission.

**Implementation**:
1. Read `minimumInvestment` from contract before invest
2. Read `getUserInvestment()` to get `canRedeem` flag before redeem
3. Display validation errors in UI if conditions not met
4. Prevent transaction submission until valid

**Alternatives considered**:
- Let contract handle validation: Simple but wastes gas on failures
- **Chosen**: Validate in UI before submission (better UX, saves gas)

## Risks / Trade-offs

### Risk: Approval Transaction Adds Extra Step
**Mitigation**: Show approval status clearly in UI, auto-proceed after approval, combine approval and invest in single flow where possible.

### Risk: Portfolio Refresh May Fail
**Mitigation**: Handle errors gracefully, provide manual refresh button, don't block user from continuing.

### Risk: Event Parsing May Fail
**Mitigation**: Fallback to input amounts if events not found, log warnings for debugging.

### Risk: Multiple Contract Reads May Slow UI
**Mitigation**: Use React Query caching, batch reads where possible, show loading states.

## Migration Plan

### Steps
1. Implement payment token approval hooks (non-breaking)
2. Add pre-transaction validations to existing hooks (non-breaking)
3. Replace `window.location.reload()` with programmatic refresh (breaking change to UX flow)
4. Add event parsing to transaction storage (non-breaking, improves accuracy)

### Rollback
- If approval flow causes issues, can temporarily disable and require manual approval
- If portfolio refresh fails, can fall back to page reload
- Event parsing is additive, can be disabled if causing issues

## Open Questions
- Should we implement infinite approval option for power users?
- Should we cache approval status to avoid repeated reads?
- Should we batch multiple contract reads for better performance?
- Should we add transaction retry mechanism for failed transactions?

