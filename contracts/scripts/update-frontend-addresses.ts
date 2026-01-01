import * as fs from "fs";
import * as path from "path";

/**
 * This script reads the deployment.json file and updates the contract addresses
 * in the frontend configuration.
 *
 * Run after deployment with:
 * npx tsx scripts/update-frontend-addresses.ts
 */

interface DeploymentInfo {
  network: string;
  chainId: number;
  deployer: string;
  timestamp: string;
  contracts: {
    tokens: {
      name: string;
      symbol: string;
      type: string;
      address: string;
      apy: number;
      risk: number;
    }[];
    yieldDistributor: string;
  };
}

async function main() {
  console.log("Updating frontend contract addresses...\n");

  // Read deployment file
  const deploymentPath = path.join(__dirname, "..", "deployment.json");

  if (!fs.existsSync(deploymentPath)) {
    console.error("deployment.json not found. Run deploy.ts first.");
    process.exit(1);
  }

  const deployment: DeploymentInfo = JSON.parse(
    fs.readFileSync(deploymentPath, "utf-8")
  );

  console.log("Network:", deployment.network);
  console.log("Chain ID:", deployment.chainId);
  console.log("Deployer:", deployment.deployer);
  console.log("Timestamp:", deployment.timestamp);
  console.log("");

  // Create token address mapping
  const tokenAddresses: Record<string, string> = {};
  for (const token of deployment.contracts.tokens) {
    tokenAddresses[token.symbol] = token.address;
    console.log(`${token.symbol}: ${token.address}`);
  }
  console.log(`YieldDistributor: ${deployment.contracts.yieldDistributor}`);

  // Generate TypeScript file for frontend
  const frontendContractsPath = path.join(
    __dirname,
    "..",
    "..",
    "src",
    "lib",
    "deployed-contracts.ts"
  );

  const fileContent = `// Auto-generated file - DO NOT EDIT MANUALLY
// Generated on: ${new Date().toISOString()}
// From deployment: ${deployment.timestamp}

export const DEPLOYED_CONTRACTS = {
  // Chain ID: ${deployment.chainId}
  chainId: ${deployment.chainId},
  network: "${deployment.network}",
  deployer: "${deployment.deployer}",

  // YieldDistributor
  yieldDistributor: "${deployment.contracts.yieldDistributor}",

  // RWA Tokens
  tokens: {
${deployment.contracts.tokens
  .map(
    (t) => `    "${t.symbol}": {
      address: "${t.address}",
      name: "${t.name}",
      type: "${t.type}",
      apy: ${t.apy},
      risk: ${t.risk},
    }`
  )
  .join(",\n")}
  },
} as const;

// Helper function to get token address by symbol
export function getTokenAddress(symbol: string): string | undefined {
  return DEPLOYED_CONTRACTS.tokens[symbol as keyof typeof DEPLOYED_CONTRACTS.tokens]?.address;
}

// Helper function to get all token addresses
export function getAllTokenAddresses(): string[] {
  return Object.values(DEPLOYED_CONTRACTS.tokens).map((t) => t.address);
}

// Export for easy import
export const YIELD_DISTRIBUTOR_ADDRESS = DEPLOYED_CONTRACTS.yieldDistributor;
`;

  // Ensure directory exists
  const frontendDir = path.dirname(frontendContractsPath);
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  fs.writeFileSync(frontendContractsPath, fileContent);
  console.log(`\nUpdated: ${frontendContractsPath}`);

  // Also create a JSON version for other uses
  const jsonOutput = {
    chainId: deployment.chainId,
    network: deployment.network,
    yieldDistributor: deployment.contracts.yieldDistributor,
    tokens: tokenAddresses,
  };

  const jsonPath = path.join(frontendDir, "deployed-contracts.json");
  fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2));
  console.log(`Updated: ${jsonPath}`);

  console.log("\nFrontend addresses updated successfully!");
}

main().catch(console.error);
