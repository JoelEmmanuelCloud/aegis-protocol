import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const [deployer] = await ethers.getSigners();

  const AegisCourt = await ethers.getContractFactory('AegisCourt');
  const court = await AegisCourt.deploy(deployer.address);
  await court.waitForDeployment();
  const courtAddress = await court.getAddress();

  const AgentRegistry = await ethers.getContractFactory('AgentRegistry');
  const registry = await AgentRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();

  const envPath = path.resolve(__dirname, '../../.env');
  let env = fs.readFileSync(envPath, 'utf-8');
  env = env.replace(/^AEGIS_COURT_ADDRESS=.*/m, `AEGIS_COURT_ADDRESS=${courtAddress}`);
  env = env.replace(/^AGENT_REGISTRY_ADDRESS=.*/m, `AGENT_REGISTRY_ADDRESS=${registryAddress}`);
  fs.writeFileSync(envPath, env);

  process.stdout.write(`Deployer:        ${deployer.address}\n`);
  process.stdout.write(`AegisCourt:      ${courtAddress}\n`);
  process.stdout.write(`AgentRegistry:   ${registryAddress}\n`);
  process.stdout.write(`.env updated with contract addresses\n`);
}

main().catch((err) => {
  process.stderr.write(`${err}\n`);
  process.exit(1);
});
