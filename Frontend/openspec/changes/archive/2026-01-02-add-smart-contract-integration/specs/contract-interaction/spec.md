# contract-interaction Specification

## Purpose
The contract-interaction capability enables the RealFi application to read data from and execute transactions on deployed smart contracts on Mantle Sepolia Testnet. It provides hooks and services for interacting with RWA token contracts and the YieldDistributor contract, enabling users to invest in and redeem tokenized real-world assets.

## ADDED Requirements

### Requirement: Contract Address Resolution
The system SHALL provide a service to resolve contract addresses from asset identifiers (ID or symbol).

#### Scenario: Resolve contract address by asset symbol
- **WHEN** an asset symbol (e.g., `mUSTB2Y`) is provided
- **THEN** the system MUST return the corresponding contract address from `CONTRACT_ADDRESSES.TOKENS`
- **AND** if the symbol is not found, the system MUST return null or throw an error

#### Scenario: Resolve contract address by asset ID
- **WHEN** an asset ID from the database is provided
- **THEN** the system MUST map the asset ID to its symbol
- **AND** the system MUST return the corresponding contract address
- **AND** if the asset ID cannot be mapped to a symbol, the system MUST return null or throw an error

### Requirement: Contract State Reading
The system SHALL provide hooks to read contract state including asset metadata, token balances, and user investment details.

#### Scenario: Read asset metadata from contract
- **WHEN** a contract address is provided
- **THEN** the system MUST read asset metadata using `getAssetInfo()` function
- **AND** the response MUST include asset type, expected APY, risk score, duration, next payout date, and status
- **AND** the hook MUST handle loading and error states
- **AND** the hook MUST automatically refetch when the contract address or wallet connection changes

#### Scenario: Read user token balance
- **WHEN** a contract address and user wallet address are provided
- **THEN** the system MUST read the user's token balance using `balanceOf()` function
- **AND** the balance MUST be returned as a number (converted from BigInt)
- **AND** the hook MUST handle loading and error states
- **AND** the hook MUST automatically refetch when the wallet address or contract address changes

#### Scenario: Read user investment details
- **WHEN** a contract address and user wallet address are provided
- **THEN** the system MUST read user investment details using `getUserInvestment()` function
- **AND** the response MUST include balance, investment time, investment amount, and canRedeem flag
- **AND** the hook MUST handle loading and error states

#### Scenario: Read yield components from contract
- **WHEN** a contract address is provided
- **THEN** the system MUST read yield components using `getYieldComponentsCount()` and `getYieldComponent(index)`
- **AND** the response MUST include all yield components with name, value, and description
- **AND** the hook MUST handle loading and error states

### Requirement: Contract Transaction Execution
The system SHALL provide hooks to execute invest and redeem transactions on RWA token contracts.

#### Scenario: Execute invest transaction
- **WHEN** user provides contract address and investment amount
- **AND** wallet is connected
- **AND** user has sufficient balance
- **THEN** the system MUST call the contract's `invest(amount)` function
- **AND** the system MUST track transaction status (pending, success, error)
- **AND** the system MUST return transaction hash upon submission
- **AND** the system MUST wait for transaction confirmation
- **AND** upon success, the system MUST update portfolio state

#### Scenario: Execute redeem transaction
- **WHEN** user provides contract address and token amount to redeem
- **AND** wallet is connected
- **AND** user has sufficient token balance
- **AND** redemption is allowed (canRedeem is true)
- **THEN** the system MUST call the contract's `redeem(tokenAmount)` function
- **AND** the system MUST track transaction status (pending, success, error)
- **AND** the system MUST return transaction hash upon submission
- **AND** the system MUST wait for transaction confirmation
- **AND** upon success, the system MUST update portfolio state

#### Scenario: Handle transaction rejection
- **WHEN** user rejects the transaction in their wallet
- **THEN** the system MUST detect the rejection
- **AND** the system MUST update transaction status to error
- **AND** the system MUST display a user-friendly error message
- **AND** the system MUST NOT update portfolio state

#### Scenario: Handle transaction failure
- **WHEN** a transaction fails (e.g., insufficient balance, contract revert)
- **THEN** the system MUST detect the failure
- **AND** the system MUST update transaction status to error
- **AND** the system MUST display a user-friendly error message explaining the failure
- **AND** the system MUST NOT update portfolio state

### Requirement: Transaction Status Tracking
The system SHALL track transaction status and provide transaction details including block explorer links.

#### Scenario: Track pending transaction
- **WHEN** a transaction is submitted
- **THEN** the system MUST set transaction status to "pending"
- **AND** the system MUST store the transaction hash
- **AND** the UI MUST display a pending indicator
- **AND** the UI MUST disable related actions until transaction completes

#### Scenario: Track successful transaction
- **WHEN** a transaction is confirmed on the blockchain
- **THEN** the system MUST set transaction status to "success"
- **AND** the system MUST store the transaction receipt
- **AND** the system MUST generate a block explorer link using `getTxExplorerUrl()`
- **AND** the UI MUST display success message with explorer link
- **AND** the system MUST refresh portfolio data

#### Scenario: Track failed transaction
- **WHEN** a transaction fails or is rejected
- **THEN** the system MUST set transaction status to "error"
- **AND** the system MUST store error details
- **AND** the UI MUST display error message
- **AND** the UI MUST allow user to retry

### Requirement: Wallet and Network Validation
The system SHALL validate wallet connection and network before allowing contract interactions.

#### Scenario: Require wallet connection for transactions
- **WHEN** user attempts to execute a contract transaction
- **AND** wallet is not connected
- **THEN** the system MUST prevent the transaction
- **AND** the system MUST display an error message prompting user to connect wallet
- **AND** the system MUST provide a button to connect wallet

#### Scenario: Validate network before transactions
- **WHEN** user attempts to execute a contract transaction
- **AND** wallet is connected to wrong network (not Mantle Sepolia Testnet)
- **THEN** the system MUST prevent the transaction
- **AND** the system MUST display an error message indicating wrong network
- **AND** the system MUST provide a button to switch to correct network

#### Scenario: Validate sufficient balance before invest
- **WHEN** user attempts to invest
- **AND** user's payment token balance is insufficient
- **THEN** the system MUST prevent the transaction
- **AND** the system MUST display an error message indicating insufficient balance

#### Scenario: Validate token balance before redeem
- **WHEN** user attempts to redeem
- **AND** user's token balance is insufficient
- **THEN** the system MUST prevent the transaction
- **AND** the system MUST display an error message indicating insufficient token balance

### Requirement: Portfolio State Synchronization
The system SHALL synchronize portfolio state with blockchain token balances.

#### Scenario: Sync balances on wallet connection
- **WHEN** wallet connects
- **THEN** the system MUST read token balances for all assets from contracts
- **AND** the system MUST update portfolio holdings with blockchain balances
- **AND** the system MUST update the UI to reflect current balances

#### Scenario: Refresh balances after transaction
- **WHEN** an invest or redeem transaction succeeds
- **THEN** the system MUST read updated token balances from contracts
- **AND** the system MUST update portfolio holdings
- **AND** the system MUST update the UI
- **AND** the system MAY update the database to cache balances

#### Scenario: Handle wallet address change
- **WHEN** user switches wallet address or disconnects/reconnects
- **THEN** the system MUST read token balances for the new address
- **AND** the system MUST update portfolio holdings
- **AND** the system MUST update the UI

### Requirement: Transaction History Storage
The system SHALL store transaction records in the database for history tracking.

#### Scenario: Store transaction record after success
- **WHEN** a contract transaction succeeds
- **THEN** the system MUST create a transaction record in the database
- **AND** the record MUST include transaction hash, status, timestamp, user address, asset ID, and transaction type
- **AND** the record MUST be immediately queryable

#### Scenario: Store transaction record on failure
- **WHEN** a contract transaction fails
- **THEN** the system MAY create a transaction record with error status
- **AND** the record MUST include error details if available

