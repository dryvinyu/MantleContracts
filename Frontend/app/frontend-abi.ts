// ============ Chain Configuration ============
export const CHAIN_CONFIG = {
  chainId: 5003,
  chainName: 'Mantle Sepolia Testnet',
  nativeCurrency: {
    name: 'MNT',
    symbol: 'MNT',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.sepolia.mantle.xyz'],
  blockExplorerUrls: ['https://sepolia.mantlescan.xyz'],
}

// ============ Contract Addresses ============
export const CONTRACT_ADDRESSES = {
  // YieldDistributor
  YIELD_DISTRIBUTOR: '0x15861980cf5868b713D11bBB65256afEcA938802',

  // RWA Tokens
  TOKENS: {
    // Bonds
    mUSTB2Y: '0x3AE279dDbd01C05C7FB694625E589107B514a51b', // US Treasury 2Y Tokenized
    mIGCORP: '0xdC6bDc094386940036e15831780F99892a17FEBF', // Investment Grade Corporate
    // Real Estate
    mMHTCOM: '0x1a673b34D2762Ac2082802f2412e38Ede99c7603', // Manhattan Commercial Complex
    mMIAWFR: '0x81ABa1F88991481a8BbEc7a6179a1e94530F8526', // Miami Waterfront Residences
    // Cash Flow
    mMUSICRF: '0x1598D2E485E4efB48288e09f0178Fd5425e30a2e', // Music Royalties Fund
    mSAASRP: '0x171F5a9630ee860420F6E1C0767d92a996c755df', // SaaS Revenue Pool
    // Invoices
    mSCFACT: '0x8e7bcD2e47d381DAc2bd82e346DBF50DFb93f4ba', // Supply Chain Factoring
    mTRDFIN: '0xd274680b8DeFD99068D698afbe22Ed87F738ad54', // Trade Finance Pool
  },
} as const

// ============ Asset Metadata ============
export const ASSETS = [
  {
    name: 'US Treasury 2Y Tokenized',
    symbol: 'mUSTB2Y',
    address: '0x3AE279dDbd01C05C7FB694625E589107B514a51b',
    type: 'Bonds',
    apy: 4.8, // Percentage
    risk: 5, // 0-100
    duration: 63072000, // 2 years in seconds
    aum: 25000000, // $25M
    status: 'Active',
    yieldComponents: [
      {
        name: 'US Treasury Yield',
        value: 5.1,
        description: '2-year US Treasury note yield',
      },
      {
        name: 'Management Fee',
        value: -0.2,
        description: 'Annual management fee',
      },
      {
        name: 'Platform Fee',
        value: -0.1,
        description: 'Mantle RealFi platform fee',
      },
    ],
  },
  {
    name: 'Investment Grade Corporate',
    symbol: 'mIGCORP',
    address: '0xdC6bDc094386940036e15831780F99892a17FEBF',
    type: 'Bonds',
    apy: 6.2,
    risk: 18,
    duration: 31536000, // 1 year
    aum: 15000000,
    status: 'Active',
    yieldComponents: [
      {
        name: 'Corporate Bond Yield',
        value: 6.8,
        description: 'Investment grade corporate bond yield',
      },
      {
        name: 'Credit Spread',
        value: -0.3,
        description: 'Credit risk premium',
      },
      {
        name: 'Management Fee',
        value: -0.2,
        description: 'Annual management fee',
      },
      { name: 'Platform Fee', value: -0.1, description: 'Platform fee' },
    ],
  },
  {
    name: 'Manhattan Commercial Complex',
    symbol: 'mMHTCOM',
    address: '0x1a673b34D2762Ac2082802f2412e38Ede99c7603',
    type: 'RealEstate',
    apy: 8.2,
    risk: 25,
    duration: 31536000, // 1 year
    aum: 12500000,
    status: 'Active',
    yieldComponents: [
      {
        name: 'Rental Income',
        value: 7.2,
        description: 'Commercial property rental yield',
      },
      {
        name: 'Capital Appreciation',
        value: 1.8,
        description: 'Expected property value growth',
      },
      {
        name: 'Property Management',
        value: -0.5,
        description: 'Property management fee',
      },
      { name: 'Platform Fee', value: -0.3, description: 'Platform fee' },
    ],
  },
  {
    name: 'Miami Waterfront Residences',
    symbol: 'mMIAWFR',
    address: '0x81ABa1F88991481a8BbEc7a6179a1e94530F8526',
    type: 'RealEstate',
    apy: 9.5,
    risk: 35,
    duration: 15552000, // 180 days
    aum: 8200000,
    status: 'Active',
    yieldComponents: [
      {
        name: 'Rental Income',
        value: 8.5,
        description: 'Luxury residential rental yield',
      },
      {
        name: 'Capital Appreciation',
        value: 2.0,
        description: 'Miami real estate appreciation',
      },
      {
        name: 'Property Management',
        value: -0.6,
        description: 'Property management fee',
      },
      { name: 'Platform Fee', value: -0.4, description: 'Platform fee' },
    ],
  },
  {
    name: 'Music Royalties Fund',
    symbol: 'mMUSICRF',
    address: '0x1598D2E485E4efB48288e09f0178Fd5425e30a2e',
    type: 'CashFlow',
    apy: 7.5,
    risk: 30,
    duration: 31536000, // 1 year
    aum: 6500000,
    status: 'Active',
    yieldComponents: [
      {
        name: 'Streaming Royalties',
        value: 6.0,
        description: 'Music streaming platform royalties',
      },
      {
        name: 'Sync Licensing',
        value: 2.2,
        description: 'TV/Film sync licensing income',
      },
      {
        name: 'Management Fee',
        value: -0.5,
        description: 'Royalty management fee',
      },
      { name: 'Platform Fee', value: -0.2, description: 'Platform fee' },
    ],
  },
  {
    name: 'SaaS Revenue Pool',
    symbol: 'mSAASRP',
    address: '0x171F5a9630ee860420F6E1C0767d92a996c755df',
    type: 'CashFlow',
    apy: 12.8,
    risk: 55,
    duration: 15552000, // 180 days
    aum: 3800000,
    status: 'Active',
    yieldComponents: [
      {
        name: 'Subscription Revenue',
        value: 14.0,
        description: 'SaaS subscription income',
      },
      {
        name: 'Churn Reserve',
        value: -0.6,
        description: 'Customer churn provision',
      },
      {
        name: 'Management Fee',
        value: -0.4,
        description: 'Fund management fee',
      },
      { name: 'Platform Fee', value: -0.2, description: 'Platform fee' },
    ],
  },
  {
    name: 'Supply Chain Factoring',
    symbol: 'mSCFACT',
    address: '0x8e7bcD2e47d381DAc2bd82e346DBF50DFb93f4ba',
    type: 'Invoices',
    apy: 11.5,
    risk: 45,
    duration: 7776000, // 90 days
    aum: 5500000,
    status: 'Active',
    yieldComponents: [
      {
        name: 'Factoring Income',
        value: 12.5,
        description: 'Invoice factoring discount yield',
      },
      {
        name: 'Default Reserve',
        value: -0.5,
        description: 'Bad debt provision',
      },
      {
        name: 'Management Fee',
        value: -0.35,
        description: 'Credit management fee',
      },
      { name: 'Platform Fee', value: -0.15, description: 'Platform fee' },
    ],
  },
  {
    name: 'Trade Finance Pool',
    symbol: 'mTRDFIN',
    address: '0xd274680b8DeFD99068D698afbe22Ed87F738ad54',
    type: 'Invoices',
    apy: 10.2,
    risk: 40,
    duration: 5184000, // 60 days
    aum: 4200000,
    status: 'Active',
    yieldComponents: [
      {
        name: 'Trade Finance Yield',
        value: 11.0,
        description: 'International trade finance yield',
      },
      {
        name: 'FX Hedging Cost',
        value: -0.3,
        description: 'Currency hedging cost',
      },
      {
        name: 'Default Reserve',
        value: -0.3,
        description: 'Default provision',
      },
      { name: 'Platform Fee', value: -0.2, description: 'Platform fee' },
    ],
  },
] as const

// ============ RWAToken ABI ============
export const RWA_TOKEN_ABI = [
  // ============ Read Functions ============
  {
    inputs: [],
    name: 'name',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'assetType',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'expectedAPY',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'riskScore',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'duration',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'maturityDate',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nextPayoutDate',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'yieldConfidence',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalAUM',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'minimumInvestment',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'status',
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paymentToken',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },

  // getAssetInfo
  {
    inputs: [],
    name: 'getAssetInfo',
    outputs: [
      { name: '_assetType', type: 'string' },
      { name: '_expectedAPY', type: 'uint256' },
      { name: '_riskScore', type: 'uint256' },
      { name: '_duration', type: 'uint256' },
      { name: '_nextPayoutDate', type: 'uint256' },
      { name: '_status', type: 'uint8' },
    ],
    stateMutability: 'view',
    type: 'function',
  },

  // getExtendedInfo
  {
    inputs: [],
    name: 'getExtendedInfo',
    outputs: [
      { name: '_yieldConfidence', type: 'uint256' },
      { name: '_totalAUM', type: 'uint256' },
      { name: '_minimumInvestment', type: 'uint256' },
      { name: '_payoutCount', type: 'uint256' },
      { name: '_maturityDate', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },

  // getUserInvestment
  {
    inputs: [{ name: '_user', type: 'address' }],
    name: 'getUserInvestment',
    outputs: [
      { name: '_balance', type: 'uint256' },
      { name: '_investmentTime', type: 'uint256' },
      { name: '_investmentAmount', type: 'uint256' },
      { name: '_canRedeem', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },

  // Yield components
  {
    inputs: [],
    name: 'getYieldComponentsCount',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'index', type: 'uint256' }],
    name: 'getYieldComponent',
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'value', type: 'int256' },
      { name: 'description', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },

  // Payout history
  {
    inputs: [],
    name: 'getPayoutHistoryCount',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'index', type: 'uint256' }],
    name: 'getPayoutRecord',
    outputs: [
      { name: 'date', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'recipientCount', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },

  // Utility views
  {
    inputs: [],
    name: 'calculateNetAPY',
    outputs: [{ type: 'int256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'isMatured',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getRiskLevel',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },

  // ============ Write Functions ============
  {
    inputs: [{ name: '_amount', type: 'uint256' }],
    name: 'invest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '_tokenAmount', type: 'uint256' }],
    name: 'redeem',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // ============ Events ============
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: 'oldAPY', type: 'uint256' },
      { indexed: false, name: 'newAPY', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
    name: 'APYUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: 'date', type: 'uint256' },
      { indexed: false, name: 'estimatedAmount', type: 'uint256' },
    ],
    name: 'PayoutScheduled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: 'date', type: 'uint256' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'recipientCount', type: 'uint256' },
    ],
    name: 'PayoutExecuted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: 'oldStatus', type: 'uint8' },
      { indexed: false, name: 'newStatus', type: 'uint8' },
    ],
    name: 'StatusUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'paymentAmount', type: 'uint256' },
      { indexed: false, name: 'tokenAmount', type: 'uint256' },
    ],
    name: 'Invested',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'tokenAmount', type: 'uint256' },
      { indexed: false, name: 'paymentAmount', type: 'uint256' },
    ],
    name: 'Redeemed',
    type: 'event',
  },
] as const

// ============ YieldDistributor ABI ============
export const YIELD_DISTRIBUTOR_ABI = [
  // Read functions
  {
    inputs: [],
    name: 'getDistributionsCount',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_index', type: 'uint256' }],
    name: 'getDistribution',
    outputs: [
      { name: 'token', type: 'address' },
      { name: 'totalAmount', type: 'uint256' },
      { name: 'recipientCount', type: 'uint256' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'distributionType', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getScheduledCount',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_index', type: 'uint256' }],
    name: 'getScheduledDistribution',
    outputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'scheduledDate', type: 'uint256' },
      { name: 'executed', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_token', type: 'address' }],
    name: 'getTokenStats',
    outputs: [
      { name: '_totalDistributed', type: 'uint256' },
      { name: '_distributionCount', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: '_token', type: 'address' },
      { name: '_limit', type: 'uint256' },
    ],
    name: 'getRecentDistributions',
    outputs: [
      { name: 'amounts', type: 'uint256[]' },
      { name: 'timestamps', type: 'uint256[]' },
      { name: 'recipients', type: 'uint256[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },

  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'token', type: 'address' },
      { indexed: false, name: 'totalAmount', type: 'uint256' },
      { indexed: false, name: 'recipientCount', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
      { indexed: false, name: 'distributionType', type: 'string' },
    ],
    name: 'YieldDistributed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'scheduleId', type: 'uint256' },
      { indexed: true, name: 'token', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'scheduledDate', type: 'uint256' },
    ],
    name: 'DistributionScheduled',
    type: 'event',
  },
] as const

// ============ Asset Status Enum ============
export const ASSET_STATUS = {
  0: 'Active',
  1: 'Maturing',
  2: 'Matured',
  3: 'Paused',
} as const

// ============ Type Definitions ============
export type AssetType = 'Bonds' | 'RealEstate' | 'Invoices' | 'CashFlow'
export type AssetStatus = 'Active' | 'Maturing' | 'Matured' | 'Paused'
export type RiskLevel = 'Low' | 'Medium' | 'High'

// ============ Helper Functions ============

/** Get risk level from score */
export function getRiskLevel(score: number): RiskLevel {
  if (score < 20) return 'Low'
  if (score < 50) return 'Medium'
  return 'High'
}

/** Format APY for display */
export function formatAPY(apy: number): string {
  return `${apy.toFixed(2)}%`
}

/** Format duration for display */
export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  if (days === 0) return 'Flexible'
  if (days < 90) return `${days}D`
  if (days < 365) return `${days}D`
  const years = days / 365
  return years % 1 === 0 ? `${years}Y` : `${years.toFixed(1)}Y`
}

/** Format AUM for display */
export function formatAUM(aum: number): string {
  if (aum >= 1_000_000) return `${(aum / 1_000_000).toFixed(2)}M RWA`
  if (aum >= 1_000) return `${(aum / 1_000).toFixed(2)}K RWA`
  return `${aum} RWA`
}

/** Get explorer URL for address */
export function getExplorerUrl(address: string): string {
  return `https://sepolia.mantlescan.xyz/address/${address}`
}

/** Get explorer URL for transaction */
export function getTxExplorerUrl(txHash: string): string {
  return `https://sepolia.mantlescan.xyz/tx/${txHash}`
}
