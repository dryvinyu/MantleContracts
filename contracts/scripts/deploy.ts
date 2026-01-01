import { ethers } from "hardhat";
import * as fs from "fs";

interface AssetConfig {
  name: string;
  symbol: string;
  type: string;  // "Bonds", "RealEstate", "Invoices", "CashFlow"
  apy: number;   // in basis points (480 = 4.80%)
  risk: number;  // 0-100
  duration: number; // in seconds
  aum: number;   // in USD (will be scaled by 1e18)
  status: number; // 0=Active, 1=Maturing, 2=Matured, 3=Paused
  yieldComponents: {
    name: string;
    value: number; // basis points, can be negative
    description: string;
  }[];
}

// 匹配前端界面的 8 种资产
const ASSETS: AssetConfig[] = [
  // ============ Bonds (债券) ============
  {
    name: "US Treasury 2Y Tokenized",
    symbol: "mUSTB2Y",
    type: "Bonds",
    apy: 480,  // 4.8%
    risk: 5,   // Low (5)
    duration: 2 * 365 * 24 * 60 * 60, // 2 years
    aum: 25_000_000, // $25.00M
    status: 0, // Active
    yieldComponents: [
      { name: "US Treasury Yield", value: 510, description: "2-year US Treasury note yield" },
      { name: "Management Fee", value: -20, description: "Annual management fee" },
      { name: "Platform Fee", value: -10, description: "Mantle RealFi platform fee" },
    ],
  },
  {
    name: "Investment Grade Corporate",
    symbol: "mIGCORP",
    type: "Bonds",
    apy: 620,  // 6.2%
    risk: 18,  // Low (18)
    duration: 365 * 24 * 60 * 60, // 1 year
    aum: 15_000_000, // $15.00M
    status: 0, // Active
    yieldComponents: [
      { name: "Corporate Bond Yield", value: 680, description: "Investment grade corporate bond yield" },
      { name: "Credit Spread", value: -30, description: "Credit risk premium" },
      { name: "Management Fee", value: -20, description: "Annual management fee" },
      { name: "Platform Fee", value: -10, description: "Platform fee" },
    ],
  },

  // ============ Real Estate (房地产) ============
  {
    name: "Manhattan Commercial Complex",
    symbol: "mMHTCOM",
    type: "RealEstate",
    apy: 820,  // 8.2%
    risk: 25,  // Medium (25)
    duration: 365 * 24 * 60 * 60, // 1 year
    aum: 12_500_000, // $12.50M
    status: 0, // Active
    yieldComponents: [
      { name: "Rental Income", value: 720, description: "Commercial property rental yield" },
      { name: "Capital Appreciation", value: 180, description: "Expected property value growth" },
      { name: "Property Management", value: -50, description: "Property management fee" },
      { name: "Platform Fee", value: -30, description: "Platform fee" },
    ],
  },
  {
    name: "Miami Waterfront Residences",
    symbol: "mMIAWFR",
    type: "RealEstate",
    apy: 950,  // 9.5%
    risk: 35,  // Medium (35)
    duration: 180 * 24 * 60 * 60, // 180 days
    aum: 8_200_000, // $8.20M
    status: 0, // Active
    yieldComponents: [
      { name: "Rental Income", value: 850, description: "Luxury residential rental yield" },
      { name: "Capital Appreciation", value: 200, description: "Miami real estate appreciation" },
      { name: "Property Management", value: -60, description: "Property management fee" },
      { name: "Platform Fee", value: -40, description: "Platform fee" },
    ],
  },

  // ============ Cash Flow (现金流) ============
  {
    name: "Music Royalties Fund",
    symbol: "mMUSICRF",
    type: "CashFlow",
    apy: 750,  // 7.5%
    risk: 30,  // Medium (30)
    duration: 365 * 24 * 60 * 60, // 1 year
    aum: 6_500_000, // $6.50M
    status: 0, // Active
    yieldComponents: [
      { name: "Streaming Royalties", value: 600, description: "Music streaming platform royalties" },
      { name: "Sync Licensing", value: 220, description: "TV/Film sync licensing income" },
      { name: "Management Fee", value: -50, description: "Royalty management fee" },
      { name: "Platform Fee", value: -20, description: "Platform fee" },
    ],
  },
  {
    name: "SaaS Revenue Pool",
    symbol: "mSAASRP",
    type: "CashFlow",
    apy: 1280, // 12.8%
    risk: 55,  // High (55)
    duration: 180 * 24 * 60 * 60, // 180 days
    aum: 3_800_000, // $3.80M
    status: 0, // Active
    yieldComponents: [
      { name: "Subscription Revenue", value: 1400, description: "SaaS subscription income" },
      { name: "Churn Reserve", value: -60, description: "Customer churn provision" },
      { name: "Management Fee", value: -40, description: "Fund management fee" },
      { name: "Platform Fee", value: -20, description: "Platform fee" },
    ],
  },

  // ============ Invoices (发票融资) ============
  {
    name: "Supply Chain Factoring",
    symbol: "mSCFACT",
    type: "Invoices",
    apy: 1150, // 11.5%
    risk: 45,  // Medium (45)
    duration: 90 * 24 * 60 * 60, // 90 days
    aum: 5_500_000, // $5.50M
    status: 0, // Active
    yieldComponents: [
      { name: "Factoring Income", value: 1250, description: "Invoice factoring discount yield" },
      { name: "Default Reserve", value: -50, description: "Bad debt provision" },
      { name: "Management Fee", value: -35, description: "Credit management fee" },
      { name: "Platform Fee", value: -15, description: "Platform fee" },
    ],
  },
  {
    name: "Trade Finance Pool",
    symbol: "mTRDFIN",
    type: "Invoices",
    apy: 1020, // 10.2%
    risk: 40,  // Medium (40)
    duration: 60 * 24 * 60 * 60, // 60 days
    aum: 4_200_000, // $4.20M
    status: 0, // Active (changed from Maturing due to gas issues on Mantle Sepolia)
    yieldComponents: [
      { name: "Trade Finance Yield", value: 1100, description: "International trade finance yield" },
      { name: "FX Hedging Cost", value: -30, description: "Currency hedging cost" },
      { name: "Default Reserve", value: -30, description: "Default provision" },
      { name: "Platform Fee", value: -20, description: "Platform fee" },
    ],
  },
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("========================================");
  console.log("  Mantle RealFi Console - Deployment");
  console.log("========================================");
  console.log("");
  console.log("Deployer address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "MNT");
  console.log("");

  const deployedTokens: {
    name: string;
    symbol: string;
    type: string;
    address: string;
    apy: number;
    risk: number;
    duration: number;
    aum: number;
    status: number;
  }[] = [];

  // Deploy RWA Tokens
  console.log("Deploying RWA Tokens...");
  console.log("------------------------");

  for (const asset of ASSETS) {
    console.log(`\nDeploying ${asset.name}...`);

    const RWAToken = await ethers.getContractFactory("RWAToken");
    const token = await RWAToken.deploy(
      asset.name,
      asset.symbol,
      asset.type,
      asset.apy,
      asset.risk,
      asset.duration,
      ethers.parseEther(asset.aum.toString()) // AUM scaled by 1e18
    );

    await token.waitForDeployment();
    const address = await token.getAddress();

    console.log(`  Address: ${address}`);
    console.log(`  Type: ${asset.type}`);
    console.log(`  APY: ${asset.apy / 100}%`);
    console.log(`  Risk: ${asset.risk}/100`);
    console.log(`  AUM: $${(asset.aum / 1_000_000).toFixed(2)}M`);
    console.log(`  Status: Active`);
    // Yield component data is stored in deployment.json for reference

    deployedTokens.push({
      name: asset.name,
      symbol: asset.symbol,
      type: asset.type,
      address: address,
      apy: asset.apy,
      risk: asset.risk,
      duration: asset.duration,
      aum: asset.aum,
      status: asset.status,
    });

    console.log(`  Done!`);
  }

  // Deploy YieldDistributor
  console.log("\n------------------------");
  console.log("Deploying YieldDistributor...");

  const YieldDistributor = await ethers.getContractFactory("YieldDistributor");
  const distributor = await YieldDistributor.deploy();
  await distributor.waitForDeployment();
  const distributorAddress = await distributor.getAddress();

  console.log(`  Address: ${distributorAddress}`);

  // Skip mock distributions - can cause gas issues on Mantle Sepolia
  console.log("\n------------------------");
  console.log("Skipping mock distributions (gas optimization)");
  console.log("You can add distributions later via separate transactions");

  // Save deployment info with yield components data for reference
  const deployment = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      tokens: deployedTokens.map((token, index) => ({
        ...token,
        yieldComponents: ASSETS[index].yieldComponents,
      })),
      yieldDistributor: distributorAddress,
    },
  };

  const deploymentPath = "./deployment.json";
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log(`\nDeployment info saved to ${deploymentPath}`);

  // Summary
  console.log("\n========================================");
  console.log("  Deployment Summary");
  console.log("========================================");
  console.log("");
  console.log("RWA Tokens (8 assets):");
  console.log("-------------------------------------------------------------");
  console.log("Symbol      | Type         | APY    | Risk | AUM      | Status");
  console.log("-------------------------------------------------------------");
  for (const token of deployedTokens) {
    const statusStr = token.status === 0 ? "Active" : token.status === 1 ? "Maturing" : "Other";
    console.log(
      `${token.symbol.padEnd(11)} | ${token.type.padEnd(12)} | ${(token.apy / 100).toFixed(1).padStart(5)}% | ${token.risk.toString().padStart(4)} | $${(token.aum / 1_000_000).toFixed(2).padStart(5)}M | ${statusStr}`
    );
  }
  console.log("-------------------------------------------------------------");
  console.log("");
  console.log(`YieldDistributor: ${distributorAddress}`);
  console.log("");
  console.log("Contract Addresses:");
  for (const token of deployedTokens) {
    console.log(`  ${token.symbol}: ${token.address}`);
  }
  console.log("");
  console.log("View on Explorer:");
  console.log(`  https://sepolia.mantlescan.xyz/address/${distributorAddress}`);
  console.log("");
  console.log("Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
