# wallet-integration Specification

## Purpose
The wallet-integration capability enables users to connect their Web3 wallets (MetaMask, WalletConnect) to interact with the Mantle Network blockchain. It provides wallet connection management, network switching, and preference persistence for seamless blockchain interactions.

## ADDED Requirements

### Requirement: Real Wallet Connection
The system SHALL provide real wallet connection functionality using MetaMask and WalletConnect-compatible wallets.

#### Scenario: Connect MetaMask wallet
- **WHEN** user clicks "Connect Wallet" button
- **THEN** the system MUST prompt user to connect their MetaMask wallet
- **AND** if MetaMask is installed, it MUST request account access
- **AND** if user approves, the system MUST store the connected wallet address
- **AND** the wallet connection status MUST be updated to connected
- **AND** the connected address MUST be displayed in the UI

#### Scenario: Connect WalletConnect wallet
- **WHEN** user selects WalletConnect option
- **THEN** the system MUST display a QR code for scanning with mobile wallet
- **AND** the system MUST support WalletConnect-compatible wallets
- **AND** upon successful connection, the wallet address MUST be stored and displayed

#### Scenario: Wallet not installed
- **WHEN** user attempts to connect wallet but MetaMask is not installed
- **THEN** the system MUST display an error message
- **AND** the error message MUST include a link to install MetaMask
- **AND** the system MUST offer WalletConnect as an alternative connection method

#### Scenario: User rejects connection
- **WHEN** user rejects the wallet connection request
- **THEN** the system MUST handle the rejection gracefully
- **AND** the system MUST display a user-friendly error message
- **AND** the wallet connection status MUST remain disconnected
- **AND** the user MUST be able to retry the connection

### Requirement: Mantle Network Support
The system SHALL support Mantle Mainnet (chain ID 5000) and Mantle Testnet (chain ID 5003) with proper network configuration.

#### Scenario: Default to Mantle Mainnet
- **WHEN** the application initializes
- **THEN** the system MUST default to Mantle Mainnet (chain ID 5000)
- **AND** the network configuration MUST include RPC URL `https://rpc.mantle.xyz`
- **AND** the network configuration MUST include currency symbol `MNT`
- **AND** the network configuration MUST include block explorer URL `https://explorer.mantle.xyz`

#### Scenario: Support Mantle Testnet
- **WHEN** user switches to testnet
- **THEN** the system MUST support Mantle Testnet (chain ID 5003)
- **AND** the testnet configuration MUST include RPC URL `https://rpc.testnet.mantle.xyz`
- **AND** the testnet configuration MUST include currency symbol `MNT`
- **AND** the testnet configuration MUST include block explorer URL `https://explorer.testnet.mantle.xyz`

#### Scenario: Display current network
- **WHEN** wallet is connected
- **THEN** the UI MUST display the current network name (Mantle Mainnet or Mantle Testnet)
- **AND** the UI MUST display the chain ID
- **AND** the network indicator MUST show connection status

### Requirement: Network Switching
The system SHALL allow users to switch between Mantle Mainnet and Testnet networks.

#### Scenario: Switch to different network
- **WHEN** user selects a different network from the network selector
- **THEN** the system MUST prompt the user's wallet to switch networks
- **AND** if user approves, the wallet MUST switch to the selected network
- **AND** the application MUST update to reflect the new network
- **AND** the network preference MUST be saved to localStorage

#### Scenario: Detect wrong network
- **WHEN** user's wallet is connected to a network other than Mantle Mainnet or Testnet
- **THEN** the system MUST detect the network mismatch
- **AND** the system MUST display a warning message
- **AND** the system MUST provide a button to switch to the correct network
- **AND** clicking the switch button MUST prompt the wallet to add/switch to Mantle network

#### Scenario: Add Mantle network to wallet
- **WHEN** user's wallet does not have Mantle network configured
- **THEN** the system MUST provide functionality to add Mantle network to the wallet
- **AND** the system MUST use the correct network parameters (chain ID, RPC URL, currency symbol, explorer URL)
- **AND** upon successful addition, the wallet MUST switch to Mantle network

### Requirement: Wallet State Management
The system SHALL maintain wallet connection state and provide it to components via React Context.

#### Scenario: Wallet context provides connection state
- **WHEN** components access wallet context
- **THEN** the context MUST provide `isConnected` boolean
- **AND** the context MUST provide `address` (string or null)
- **AND** the context MUST provide `chainId` (number)
- **AND** the context MUST provide `connect` function
- **AND** the context MUST provide `disconnect` function
- **AND** the context MUST provide `switchNetwork` function

#### Scenario: Wallet state updates on connection
- **WHEN** wallet connection succeeds
- **THEN** `isConnected` MUST be set to true
- **AND** `address` MUST be set to the connected wallet address
- **AND** `chainId` MUST be set to the current network chain ID
- **AND** all components using wallet context MUST receive updated state

#### Scenario: Wallet state updates on disconnection
- **WHEN** user disconnects wallet
- **THEN** `isConnected` MUST be set to false
- **AND** `address` MUST be set to null
- **AND** all components using wallet context MUST receive updated state

### Requirement: User Preference Persistence
The system SHALL persist user wallet preferences in browser localStorage.

#### Scenario: Save preferred network
- **WHEN** user switches networks
- **THEN** the preferred network (mainnet or testnet) MUST be saved to localStorage
- **AND** the preference MUST be keyed as `mantle-wallet-preferred-network`

#### Scenario: Load preferred network on initialization
- **WHEN** application initializes
- **THEN** the system MUST load preferred network from localStorage
- **AND** if a preference exists, the system MUST attempt to use that network
- **AND** if no preference exists, the system MUST default to Mantle Mainnet

#### Scenario: Save last connected address
- **WHEN** wallet successfully connects
- **THEN** the wallet address MUST be saved to localStorage
- **AND** the address MUST be keyed as `mantle-wallet-last-address`
- **AND** this address MAY be used to pre-fill or suggest reconnection

### Requirement: Error Handling
The system SHALL handle wallet connection errors gracefully with user-friendly messages.

#### Scenario: Handle connection errors
- **WHEN** wallet connection fails for any reason
- **THEN** the system MUST catch the error
- **AND** the system MUST display a user-friendly error message
- **AND** the error message MUST explain what went wrong
- **AND** the system MUST provide actionable next steps (e.g., "Install MetaMask" or "Try again")

#### Scenario: Handle network errors
- **WHEN** RPC endpoint fails or network is unavailable
- **THEN** the system MUST display an error message
- **AND** the system MUST suggest checking network connection
- **AND** the system MAY attempt to use fallback RPC endpoints if configured

#### Scenario: Handle wallet disconnection
- **WHEN** user disconnects wallet from wallet provider UI
- **THEN** the application MUST detect the disconnection
- **AND** the application MUST update wallet state to disconnected
- **AND** the UI MUST reflect the disconnected state

### Requirement: Block Explorer Integration
The system SHALL provide links to view wallet addresses and transactions on the appropriate block explorer.

#### Scenario: View address on explorer
- **WHEN** user clicks "View on Explorer" for their wallet address
- **THEN** the system MUST open the correct block explorer URL
- **AND** the URL MUST use the explorer for the current network (mainnet or testnet)
- **AND** the URL MUST include the wallet address as a parameter
- **AND** the link MUST open in a new tab

#### Scenario: Explorer URL changes with network
- **WHEN** user switches networks
- **THEN** explorer links MUST use the explorer URL for the current network
- **AND** mainnet MUST use `https://explorer.mantle.xyz`
- **AND** testnet MUST use `https://explorer.testnet.mantle.xyz`

