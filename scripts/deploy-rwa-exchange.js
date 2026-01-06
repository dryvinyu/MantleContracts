const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying RWA Exchange with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Use deployer as treasury (you can change this)
  const treasuryAddress = deployer.address;

  // Deploy PlatformRWAToken (RWA Exchange)
  const PlatformRWAToken = await hre.ethers.getContractFactory("PlatformRWAToken");
  const rwaExchange = await PlatformRWAToken.deploy(treasuryAddress);
  await rwaExchange.waitForDeployment();

  const rwaAddress = await rwaExchange.getAddress();
  console.log("PlatformRWAToken (RWA Exchange) deployed to:", rwaAddress);

  // Add supported tokens
  console.log("\nAdding supported tokens...");

  // USDT on Mantle Testnet (you need to replace with actual address)
  // For testnet, you might need to deploy a mock USDT first
  const USDT_ADDRESS = "0x0000000000000000000000000000000000000000"; // Replace with actual USDT address
  const USDC_ADDRESS = "0x0000000000000000000000000000000000000000"; // Replace with actual USDC address

  // Add USDT (if address is set)
  if (USDT_ADDRESS !== "0x0000000000000000000000000000000000000000") {
    const usdtTokenId = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("USDT"));
    await rwaExchange.addSupportedToken(
      usdtTokenId,
      USDT_ADDRESS,
      1e8, // $1.00 per USDT
      6,   // USDT has 6 decimals
      "USDT"
    );
    console.log("USDT added as supported token");
  }

  // Add USDC (if address is set)
  if (USDC_ADDRESS !== "0x0000000000000000000000000000000000000000") {
    const usdcTokenId = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("USDC"));
    await rwaExchange.addSupportedToken(
      usdcTokenId,
      USDC_ADDRESS,
      1e8, // $1.00 per USDC
      6,   // USDC has 6 decimals
      "USDC"
    );
    console.log("USDC added as supported token");
  }

  // Add ETH/WETH (wrapped)
  // const WETH_ADDRESS = "0x..."; // Replace with actual WETH address
  // if (WETH_ADDRESS) {
  //   const ethTokenId = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("ETH"));
  //   await rwaExchange.addSupportedToken(
  //     ethTokenId,
  //     WETH_ADDRESS,
  //     3500e8, // $3500 per ETH (adjust based on market)
  //     18,
  //     "ETH"
  //   );
  //   console.log("ETH (WETH) added as supported token");
  // }

  console.log("\n=== Deployment Summary ===");
  console.log("RWA Exchange (PlatformRWAToken):", rwaAddress);
  console.log("Treasury:", treasuryAddress);
  console.log("RWA Price: 1 RWA = $1.00");
  console.log("MNT Price: 1 MNT = $0.50 (default, update as needed)");

  console.log("\n=== Next Steps ===");
  console.log("1. Update MNT price if needed:");
  console.log(`   const mntTokenId = ethers.keccak256(ethers.toUtf8Bytes("MNT"));`);
  console.log(`   await rwaExchange.updateSupportedToken(mntTokenId, newPriceInUSD, true);`);
  console.log("\n2. Add USDT/USDC addresses and call addSupportedToken");
  console.log("\n3. Update frontend with contract address:", rwaAddress);

  // Verify on explorer (if not local)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nWaiting for block confirmations...");
    await rwaExchange.deploymentTransaction().wait(5);

    console.log("Verifying contract on explorer...");
    try {
      await hre.run("verify:verify", {
        address: rwaAddress,
        constructorArguments: [treasuryAddress],
      });
      console.log("Contract verified!");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
