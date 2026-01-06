# Mantle RealFi Console - Smart Contracts

RWA (Real World Assets) tokenization contracts for Mantle RealFi Console.

## Contracts

### RWAToken.sol
ERC20 token representing tokenized real-world assets with:
- Asset metadata (type, APY, risk score, duration)
- Yield breakdown components
- Payout scheduling and history
- Yield confidence tracking

### YieldDistributor.sol
Manages yield distributions to token holders:
- Record and track distributions
- Schedule future distributions
- Distribution statistics per token

## Quick Start

### Install Dependencies
```bash
npm install
```

### Compile Contracts
```bash
npm run compile
# or
npx hardhat compile
```

### Run Tests
```bash
npm run test
# or
npx hardhat test
```

### Deploy to Mantle Sepolia Testnet

1. **Get Testnet MNT**
   - Visit: https://faucet.sepolia.mantle.xyz/

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your PRIVATE_KEY
   ```

3. **Deploy**
   ```bash
   npm run deploy:testnet
   # or
   npx hardhat run scripts/deploy.ts --network mantle-testnet
   ```

4. **Update Frontend Addresses**
   ```bash
   npx tsx scripts/update-frontend-addresses.ts
   ```

## Contract Addresses (Mantle Sepolia)

After deployment, addresses will be saved to `deployment.json`.

## Network Configuration

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Mantle Sepolia | 5003 | https://rpc.sepolia.mantle.xyz |
| Mantle Mainnet | 5000 | https://rpc.mantle.xyz |

## Contract Verification

Contracts are automatically verified on Mantle Explorer after deployment.

View on Explorer:
- Sepolia: https://sepolia.mantlescan.xyz
- Mainnet: https://mantlescan.xyz

## Architecture

```
contracts/
├── RWAToken.sol           # ERC20 + Asset metadata
└── YieldDistributor.sol   # Yield distribution manager

scripts/
├── deploy.ts              # Deployment script
└── update-frontend-addresses.ts  # Update frontend config

test/
├── RWAToken.test.ts       # RWAToken unit tests
└── YieldDistributor.test.ts  # YieldDistributor unit tests
```

## Token Types

| Type | Description | Example |
|------|-------------|---------|
| Treasury | Government bonds | US Treasury 6M Bill |
| RealEstate | Property-backed | Dubai Marina REIT |
| Credit | Lending pools | SME Credit Pool |
| Commodity | Commodity-backed | Gold-Backed Token |

## License

MIT
