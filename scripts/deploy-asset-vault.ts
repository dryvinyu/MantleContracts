import { ethers } from 'hardhat'

function requireEnv(name: string, fallback?: string) {
  const value = process.env[name] || fallback
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

async function main() {
  const [deployer] = await ethers.getSigners()

  console.log('========================================')
  console.log('  Mantle RealFi - AssetVault Deploy')
  console.log('========================================')
  console.log('')
  console.log('Deployer address:', deployer.address)

  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('Deployer balance:', ethers.formatEther(balance), 'MNT')
  console.log('')

  const registryAddress =
    process.env.ASSET_REGISTRY_ADDRESS ||
    process.env.NEXT_PUBLIC_ASSET_REGISTRY_ADDRESS
  const rwaTokenAddress =
    process.env.RWA_TOKEN_ADDRESS || process.env.NEXT_PUBLIC_RWA_TOKEN_ADDRESS

  const resolvedRegistry = requireEnv('ASSET_REGISTRY_ADDRESS', registryAddress)
  const resolvedRwaToken = requireEnv('RWA_TOKEN_ADDRESS', rwaTokenAddress)

  console.log('AssetRegistry address:', resolvedRegistry)
  console.log('RWA token address:', resolvedRwaToken)
  console.log('')

  const AssetVault = await ethers.getContractFactory('AssetVault')
  const vault = await AssetVault.deploy(
    resolvedRwaToken,
    resolvedRegistry,
    deployer.address,
  )
  await vault.waitForDeployment()

  const vaultAddress = await vault.getAddress()

  console.log('AssetVault deployed to:', vaultAddress)
  console.log('')
  console.log('Next steps:')
  console.log(`1) Set env: NEXT_PUBLIC_ASSET_VAULT_ADDRESS=${vaultAddress}`)
  console.log('2) Restart frontend dev server')
  console.log('')
  console.log('Explorer:')
  console.log(`https://sepolia.mantlescan.xyz/address/${vaultAddress}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
