// Contract ABIs for RWAToken and YieldDistributor
// Updated to match new contract with status, invest/redeem functions

export const RWA_TOKEN_ABI = [
  // ============ Read functions ============
  {
    inputs: [],
    name: "name",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "assetType",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "expectedAPY",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "riskScore",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "duration",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maturityDate",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextPayoutDate",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "yieldConfidence",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalAUM",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "minimumInvestment",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "status",
    outputs: [{ type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "paymentToken",
    outputs: [{ type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  // getAssetInfo - now includes status
  {
    inputs: [],
    name: "getAssetInfo",
    outputs: [
      { name: "_assetType", type: "string" },
      { name: "_expectedAPY", type: "uint256" },
      { name: "_riskScore", type: "uint256" },
      { name: "_duration", type: "uint256" },
      { name: "_nextPayoutDate", type: "uint256" },
      { name: "_status", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // getExtendedInfo - now includes maturityDate
  {
    inputs: [],
    name: "getExtendedInfo",
    outputs: [
      { name: "_yieldConfidence", type: "uint256" },
      { name: "_totalAUM", type: "uint256" },
      { name: "_minimumInvestment", type: "uint256" },
      { name: "_payoutCount", type: "uint256" },
      { name: "_maturityDate", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // getUserInvestment - new function
  {
    inputs: [{ name: "_user", type: "address" }],
    name: "getUserInvestment",
    outputs: [
      { name: "_balance", type: "uint256" },
      { name: "_investmentTime", type: "uint256" },
      { name: "_investmentAmount", type: "uint256" },
      { name: "_canRedeem", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getYieldComponentsCount",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "index", type: "uint256" }],
    name: "getYieldComponent",
    outputs: [
      { name: "name", type: "string" },
      { name: "value", type: "int256" },
      { name: "description", type: "string" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPayoutHistoryCount",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "index", type: "uint256" }],
    name: "getPayoutRecord",
    outputs: [
      { name: "date", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "recipientCount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "calculateNetAPY",
    outputs: [{ type: "int256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isMatured",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getRiskLevel",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  },

  // ============ Write functions ============
  {
    inputs: [{ name: "_amount", type: "uint256" }],
    name: "invest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_tokenAmount", type: "uint256" }],
    name: "redeem",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ============ Events ============
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "oldAPY", type: "uint256" },
      { indexed: false, name: "newAPY", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    name: "APYUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "date", type: "uint256" },
      { indexed: false, name: "estimatedAmount", type: "uint256" },
    ],
    name: "PayoutScheduled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "date", type: "uint256" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "recipientCount", type: "uint256" },
    ],
    name: "PayoutExecuted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "oldStatus", type: "uint8" },
      { indexed: false, name: "newStatus", type: "uint8" },
    ],
    name: "StatusUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "paymentAmount", type: "uint256" },
      { indexed: false, name: "tokenAmount", type: "uint256" },
    ],
    name: "Invested",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "tokenAmount", type: "uint256" },
      { indexed: false, name: "paymentAmount", type: "uint256" },
    ],
    name: "Redeemed",
    type: "event",
  },
] as const;

export const YIELD_DISTRIBUTOR_ABI = [
  // Read functions
  {
    inputs: [],
    name: "getDistributionsCount",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_index", type: "uint256" }],
    name: "getDistribution",
    outputs: [
      { name: "token", type: "address" },
      { name: "totalAmount", type: "uint256" },
      { name: "recipientCount", type: "uint256" },
      { name: "timestamp", type: "uint256" },
      { name: "distributionType", type: "string" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getScheduledCount",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_index", type: "uint256" }],
    name: "getScheduledDistribution",
    outputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "scheduledDate", type: "uint256" },
      { name: "executed", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_token", type: "address" }],
    name: "getTokenStats",
    outputs: [
      { name: "_totalDistributed", type: "uint256" },
      { name: "_distributionCount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "_token", type: "address" },
      { name: "_limit", type: "uint256" },
    ],
    name: "getRecentDistributions",
    outputs: [
      { name: "amounts", type: "uint256[]" },
      { name: "timestamps", type: "uint256[]" },
      { name: "recipients", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "token", type: "address" },
      { indexed: false, name: "totalAmount", type: "uint256" },
      { indexed: false, name: "recipientCount", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
      { indexed: false, name: "distributionType", type: "string" },
    ],
    name: "YieldDistributed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "scheduleId", type: "uint256" },
      { indexed: true, name: "token", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "scheduledDate", type: "uint256" },
    ],
    name: "DistributionScheduled",
    type: "event",
  },
] as const;

// Contract addresses - Deployed on 2026-01-01
// Network: Mantle Sepolia Testnet (Chain ID: 5003)
export const CONTRACT_ADDRESSES = {
  // Mantle Sepolia Testnet
  5003: {
    YIELD_DISTRIBUTOR: "0x15861980cf5868b713D11bBB65256afEcA938802",
    TOKENS: {
      // Bonds
      mUSTB2Y: "0x3AE279dDbd01C05C7FB694625E589107B514a51b",   // US Treasury 2Y Tokenized
      mIGCORP: "0xdC6bDc094386940036e15831780F99892a17FEBF",   // Investment Grade Corporate
      // Real Estate
      mMHTCOM: "0x1a673b34D2762Ac2082802f2412e38Ede99c7603",   // Manhattan Commercial Complex
      mMIAWFR: "0x81ABa1F88991481a8BbEc7a6179a1e94530F8526",   // Miami Waterfront Residences
      // Cash Flow
      mMUSICRF: "0x1598D2E485E4efB48288e09f0178Fd5425e30a2e",  // Music Royalties Fund
      mSAASRP: "0x171F5a9630ee860420F6E1C0767d92a996c755df",   // SaaS Revenue Pool
      // Invoices
      mSCFACT: "0x8e7bcD2e47d381DAc2bd82e346DBF50DFb93f4ba",   // Supply Chain Factoring
      mTRDFIN: "0xd274680b8DeFD99068D698afbe22Ed87F738ad54",   // Trade Finance Pool
    },
  },
  // Mantle Mainnet
  5000: {
    YIELD_DISTRIBUTOR: "0x0000000000000000000000000000000000000000",
    TOKENS: {},
  },
} as const;

export type ChainId = keyof typeof CONTRACT_ADDRESSES;

// Asset status enum (matches contract)
export const ASSET_STATUS = {
  0: "Active",
  1: "Maturing",
  2: "Matured",
  3: "Paused",
} as const;

export type AssetStatusCode = keyof typeof ASSET_STATUS;
