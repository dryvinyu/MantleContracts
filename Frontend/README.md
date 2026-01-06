# Mantle RealFi Console App

A portfolio management dashboard for Real-World Assets (RWA) on the Mantle Network.

## Features

- Portfolio analytics and risk assessment
- Real-time asset tracking
- Wallet integration with Mantle Network
- AI-powered copilot assistance
- Transaction capabilities

## Wallet Setup

### Supported Wallets

- **MetaMask** (recommended)
- **WalletConnect** compatible wallets

### Connecting Your Wallet

1. Click the "Connect Wallet" button in the header
2. Select your preferred wallet (MetaMask or WalletConnect)
3. Approve the connection request in your wallet
4. The application will automatically detect your network

### Network Configuration

The application supports two Mantle networks:

- **Mantle Mainnet** (Chain ID: 5000) - Default network for production
- **Mantle Testnet** (Chain ID: 5003) - For testing and development

You can switch between networks using the network selector in the header.

### Adding Mantle Network to MetaMask

If Mantle Network is not configured in your wallet:

1. Click on the network selector in the header
2. Select "Add Mantle Mainnet" or "Add Mantle Testnet"
3. Approve the network addition in MetaMask
4. The application will automatically switch to the added network

### Manual Network Addition

You can also add Mantle Network manually in MetaMask:

**Mantle Mainnet:**
- Network Name: Mantle Mainnet
- RPC URL: https://rpc.mantle.xyz
- Chain ID: 5000
- Currency Symbol: MNT
- Block Explorer: https://explorer.mantle.xyz

**Mantle Testnet:**
- Network Name: Mantle Testnet
- RPC URL: https://rpc.testnet.mantle.xyz
- Chain ID: 5003
- Currency Symbol: MNT
- Block Explorer: https://explorer.testnet.mantle.xyz

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/mantle

# WalletConnect (optional - for WalletConnect support)
WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

### Getting a WalletConnect Project ID

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy your Project ID
4. Add it to `.env.local` as `WALLETCONNECT_PROJECT_ID`

Note: WalletConnect is optional. The application works with MetaMask without a WalletConnect project ID.

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint and format code
pnpm lint
```

## Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **UI**: React 19.2.3, Tailwind CSS 4
- **Wallet**: wagmi, viem
- **Database**: PostgreSQL with Prisma ORM
- **State Management**: React Context API

## Network Configuration

Network configurations are defined in `lib/config/networks.ts`. The application defaults to Mantle Mainnet (chain ID 5000) but supports switching to Testnet (chain ID 5003) for development and testing purposes.

User network preferences are stored in browser localStorage and persist across sessions.
