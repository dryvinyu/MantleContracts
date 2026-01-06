## MODIFIED Requirements

### Requirement: Contract Transaction Execution
The system SHALL provide hooks to execute invest and redeem transactions on RWA token contracts with proper payment token approval, pre-transaction validations, and enhanced error handling.

#### Scenario: Execute invest transaction with payment token approval
- **WHEN** user provides contract address and investment amount
- **AND** wallet is connected
- **AND** user has sufficient payment token balance
- **THEN** the system MUST read the payment token address from the contract using `paymentToken()`
- **AND** the system MUST check the current allowance using `allowance(owner, spender)` where spender is the RWA contract address
- **AND** if allowance is insufficient, the system MUST prompt user to approve the payment token
- **AND** the system MUST execute an `approve(spender, amount)` transaction on the payment token contract
- **AND** after approval is confirmed, the system MUST call the contract's `invest(amount)` function
- **AND** the system MUST track transaction status (pending, success, error) for both approval and invest transactions
- **AND** the system MUST return transaction hash upon submission
- **AND** the system MUST wait for transaction confirmation
- **AND** upon success, the system MUST update portfolio state

#### Scenario: Validate minimum investment before invest
- **WHEN** user attempts to invest
- **THEN** the system MUST read `minimumInvestment` from the contract
- **AND** the system MUST validate that the investment amount is greater than or equal to the minimum investment
- **AND** if the amount is below minimum, the system MUST prevent the transaction
- **AND** the system MUST display an error message indicating the minimum investment requirement
- **AND** the system MUST show the minimum investment amount in the error message

#### Scenario: Execute redeem transaction with canRedeem validation
- **WHEN** user provides contract address and token amount to redeem
- **AND** wallet is connected
- **AND** user has sufficient token balance
- **THEN** the system MUST read user investment details using `getUserInvestment(userAddress)`
- **AND** the system MUST check that `canRedeem` flag is true
- **AND** if `canRedeem` is false, the system MUST prevent the transaction
- **AND** the system MUST display an error message explaining why redemption is not allowed
- **AND** if `canRedeem` is true, the system MUST call the contract's `redeem(tokenAmount)` function
- **AND** the system MUST track transaction status (pending, success, error)
- **AND** the system MUST return transaction hash upon submission
- **AND** the system MUST wait for transaction confirmation
- **AND** upon success, the system MUST update portfolio state

#### Scenario: Extract transaction amounts from blockchain events
- **WHEN** an invest transaction succeeds
- **THEN** the system MUST parse the transaction receipt for `Invested` event
- **AND** the system MUST extract `paymentAmount` and `tokenAmount` from the event
- **AND** the system MUST use these actual amounts when storing transaction records
- **AND** if the event is not found, the system MUST fall back to the input amount

- **WHEN** a redeem transaction succeeds
- **THEN** the system MUST parse the transaction receipt for `Redeemed` event
- **AND** the system MUST extract `tokenAmount` and `paymentAmount` from the event
- **AND** the system MUST use these actual amounts when storing transaction records
- **AND** if the event is not found, the system MUST fall back to the input amount

#### Scenario: Handle transaction rejection
- **WHEN** user rejects the transaction in their wallet
- **THEN** the system MUST detect the rejection
- **AND** the system MUST update transaction status to error
- **AND** the system MUST display a user-friendly error message
- **AND** the system MUST NOT update portfolio state

#### Scenario: Handle transaction failure with contract-specific errors
- **WHEN** a transaction fails due to insufficient allowance
- **THEN** the system MUST detect the failure
- **AND** the system MUST update transaction status to error
- **AND** the system MUST display an error message prompting user to approve payment token
- **AND** the system MUST provide a button to trigger approval transaction

- **WHEN** a transaction fails due to amount below minimum investment
- **THEN** the system MUST detect the failure
- **AND** the system MUST update transaction status to error
- **AND** the system MUST display an error message indicating minimum investment requirement

- **WHEN** a transaction fails due to redemption not allowed (canRedeem false)
- **THEN** the system MUST detect the failure
- **AND** the system MUST update transaction status to error
- **AND** the system MUST display an error message explaining redemption restrictions

- **WHEN** a transaction fails due to insufficient balance
- **THEN** the system MUST detect the failure
- **AND** the system MUST update transaction status to error
- **AND** the system MUST display a user-friendly error message explaining the failure
- **AND** the system MUST NOT update portfolio state

## ADDED Requirements

### Requirement: Payment Token Approval Management
The system SHALL manage payment token approvals for RWA token investments, checking and requesting approvals as needed.

#### Scenario: Read payment token address from contract
- **WHEN** an asset contract address is provided
- **THEN** the system MUST read the payment token address using `paymentToken()` function
- **AND** the payment token address MUST be returned as a string
- **AND** the hook MUST handle loading and error states

#### Scenario: Check payment token allowance
- **WHEN** a payment token address, owner address, and spender address (RWA contract) are provided
- **THEN** the system MUST read the current allowance using `allowance(owner, spender)` function
- **AND** the allowance MUST be returned as a number (converted from BigInt)
- **AND** the hook MUST handle loading and error states
- **AND** the hook MUST automatically refetch when addresses change

#### Scenario: Execute payment token approval
- **WHEN** user provides payment token address, spender address, and approval amount
- **AND** wallet is connected
- **THEN** the system MUST call the payment token's `approve(spender, amount)` function
- **AND** the system MUST track approval transaction status (pending, success, error)
- **AND** the system MUST return transaction hash upon submission
- **AND** the system MUST wait for transaction confirmation
- **AND** upon success, the system MUST automatically proceed with invest transaction if pending

### Requirement: Portfolio State Refresh
The system SHALL refresh portfolio state after successful transactions without requiring a page reload.

#### Scenario: Refresh portfolio after invest transaction
- **WHEN** an invest transaction succeeds
- **THEN** the system MUST read updated token balance from the contract using `balanceOf(userAddress)`
- **AND** the system MUST update portfolio holdings state with the new balance
- **AND** the system MUST update the UI to reflect the new balance
- **AND** the system MUST NOT reload the page
- **AND** the system MUST show a loading indicator during refresh

#### Scenario: Refresh portfolio after redeem transaction
- **WHEN** a redeem transaction succeeds
- **THEN** the system MUST read updated token balance from the contract using `balanceOf(userAddress)`
- **AND** the system MUST read updated payment token balance
- **AND** the system MUST update portfolio holdings state with the new balances
- **AND** the system MUST update portfolio cash balance
- **AND** the system MUST update the UI to reflect the new balances
- **AND** the system MUST NOT reload the page
- **AND** the system MUST show a loading indicator during refresh

#### Scenario: Handle refresh errors gracefully
- **WHEN** portfolio refresh fails after a successful transaction
- **THEN** the system MUST log the error
- **AND** the system MUST display a warning message to the user
- **AND** the system MUST provide a manual refresh button
- **AND** the system MUST NOT block the user from continuing to use the application

