import { ethers } from 'hardhat';

async function main() {
  const gatewayUrl = process.env.CCIP_GATEWAY_URL;
  if (!gatewayUrl) {
    process.stderr.write('CCIP_GATEWAY_URL is not set in .env\n');
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();

  const AegisCCIPResolver = await ethers.getContractFactory('AegisCCIPResolver');
  const resolver = await AegisCCIPResolver.deploy(
    `${gatewayUrl.replace(/\/$/, '')}/{sender}/{data}.json`
  );
  await resolver.waitForDeployment();
  const resolverAddress = await resolver.getAddress();

  const aegisNode = ethers.namehash('aegis.eth');

  process.stdout.write(`Deployer:             ${deployer.address}\n`);
  process.stdout.write(`AegisCCIPResolver:    ${resolverAddress}\n`);
  process.stdout.write(`\nNext step — set aegis.eth resolver on Sepolia:\n`);
  process.stdout.write(
    `  ENS_REGISTRY.setResolver(${aegisNode}, ${resolverAddress})\n`
  );
  process.stdout.write(
    `  Or use app.ens.domains on Sepolia to set the custom resolver to ${resolverAddress}\n`
  );
}

main().catch((err) => {
  process.stderr.write(`${err}\n`);
  process.exit(1);
});
