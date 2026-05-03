import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const [deployer] = await ethers.getSigners();

  const aegisEthNode = ethers.namehash('aegis.eth');

  const AegisCourt = await ethers.getContractFactory('AegisCourt.sol:AegisCourt');
  const court = await AegisCourt.deploy(deployer.address);
  await court.waitForDeployment();
  const courtAddress = await court.getAddress();

  const AegisNameRegistry = await ethers.getContractFactory('AegisNameRegistry.sol:AegisNameRegistry');
  const nameRegistry = await AegisNameRegistry.deploy(aegisEthNode);
  await nameRegistry.waitForDeployment();
  const nameRegistryAddress = await nameRegistry.getAddress();

  const AgentRegistry = await ethers.getContractFactory('AgentRegistry.sol:AgentRegistry');
  const registry = await AgentRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();

  const authTx = await nameRegistry.setAuthorized(registryAddress, true);
  await authTx.wait();

  const wireTx = await registry.setNameRegistry(nameRegistryAddress);
  await wireTx.wait();

  const envPath = path.resolve(__dirname, '../../.env');
  let env = fs.readFileSync(envPath, 'utf-8');
  env = env.replace(/^AEGIS_COURT_ADDRESS=.*/m, `AEGIS_COURT_ADDRESS=${courtAddress}`);
  env = env.replace(/^AGENT_REGISTRY_ADDRESS=.*/m, `AGENT_REGISTRY_ADDRESS=${registryAddress}`);
  if (/^AEGIS_NAME_REGISTRY_ADDRESS=.*/m.test(env)) {
    env = env.replace(
      /^AEGIS_NAME_REGISTRY_ADDRESS=.*/m,
      `AEGIS_NAME_REGISTRY_ADDRESS=${nameRegistryAddress}`
    );
  } else {
    env += `\nAEGIS_NAME_REGISTRY_ADDRESS=${nameRegistryAddress}`;
  }
  fs.writeFileSync(envPath, env);

  process.stdout.write(`Deployer:              ${deployer.address}\n`);
  process.stdout.write(`AegisCourt:            ${courtAddress}\n`);
  process.stdout.write(`AegisNameRegistry:     ${nameRegistryAddress}\n`);
  process.stdout.write(`AgentRegistry:         ${registryAddress}\n`);
  process.stdout.write(`.env updated\n`);
}

main().catch((err) => {
  process.stderr.write(`${err}\n`);
  process.exit(1);
});
