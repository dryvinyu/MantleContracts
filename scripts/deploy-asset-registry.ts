import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()

  console.log('========================================')
  console.log('  Mantle RealFi - AssetRegistry Deploy')
  console.log('========================================')
  console.log('')
  console.log('Deployer address:', deployer.address)

  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('Deployer balance:', ethers.formatEther(balance), 'MNT')
  console.log('')

  const AssetRegistry = await ethers.getContractFactory('AssetRegistry')
  const registry = await AssetRegistry.deploy(deployer.address)
  await registry.waitForDeployment()

  const registryAddress = await registry.getAddress()

  console.log('AssetRegistry deployed to:', registryAddress)
  console.log('')
  console.log('Next steps:')
  console.log(`1) Set env: NEXT_PUBLIC_ASSET_REGISTRY_ADDRESS=${registryAddress}`)
  console.log('2) Restart frontend dev server')
  console.log('')
  console.log('Explorer:')
  console.log(`https://sepolia.mantlescan.xyz/address/${registryAddress}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
