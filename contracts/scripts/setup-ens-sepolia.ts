import { ethers } from 'hardhat';
import { ethers as ethersLib } from 'ethers';

const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const ETH_REGISTRAR_CONTROLLER = '0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B16';
const NAME_WRAPPER = '0x0635513f179D50A207757E05759CbD106d7dFbe8';
const PUBLIC_RESOLVER = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD';

const REGISTRY_ABI = [
  'function owner(bytes32 node) view returns (address)',
  'function resolver(bytes32 node) view returns (address)',
  'function setResolver(bytes32 node, address resolver) external',
];

const NAME_WRAPPER_ABI = [
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function setResolver(bytes32 node, address resolver) external',
  'function isWrapped(bytes32 node) view returns (bool)',
];

const CONTROLLER_ABI = [
  'function available(string name) view returns (bool)',
  'function rentPrice(string name, uint256 duration) view returns (tuple(uint256 base, uint256 premium))',
  'function makeCommitment(string name, address owner, uint256 duration, bytes32 secret, address resolver, bytes[] data, bool reverseRecord, uint16 ownerControlledFuses) view returns (bytes32)',
  'function commit(bytes32 commitment) external',
  'function register(string name, address owner, uint256 duration, bytes32 secret, address resolver, bytes[] data, bool reverseRecord, uint16 ownerControlledFuses) external payable',
  'function minCommitmentAge() view returns (uint256)',
];

async function main() {
  const gatewayUrl = process.env.CCIP_GATEWAY_URL;
  if (!gatewayUrl) {
    process.stderr.write('CCIP_GATEWAY_URL is not set in .env\n');
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  const provider = deployer.provider!;

  const balance = await provider.getBalance(deployer.address);
  process.stdout.write(`Deployer: ${deployer.address}\n`);
  process.stdout.write(`Balance:  ${ethersLib.formatEther(balance)} ETH\n`);

  if (balance < ethersLib.parseEther('0.05')) {
    process.stderr.write(
      `Insufficient Sepolia ETH. Fund ${deployer.address} with at least 0.05 ETH from:\n` +
      `  https://cloud.google.com/application/web3/faucet/ethereum/sepolia\n`
    );
    process.exit(1);
  }

  const aegisNode = ethersLib.namehash('aegis.eth');
  const registry = new ethersLib.Contract(ENS_REGISTRY, REGISTRY_ABI, deployer);
  const nameWrapper = new ethersLib.Contract(NAME_WRAPPER, NAME_WRAPPER_ABI, deployer);
  const controller = new ethersLib.Contract(ETH_REGISTRAR_CONTROLLER, CONTROLLER_ABI, deployer);

  const currentOwner: string = await registry.owner(aegisNode);
  process.stdout.write(`Current aegis.eth owner: ${currentOwner}\n`);

  if (currentOwner === ethersLib.ZeroAddress) {
    process.stdout.write('Registering aegis.eth on Sepolia...\n');

    const available: boolean = await controller.available('aegis');
    if (!available) {
      process.stderr.write('aegis.eth is not available for registration\n');
      process.exit(1);
    }

    const duration = 365 * 24 * 60 * 60;
    const secret = ethersLib.randomBytes(32);
    const price = await controller.rentPrice('aegis', duration);
    const value = price.base + price.premium + ethersLib.parseEther('0.001');

    const commitment = await controller.makeCommitment(
      'aegis',
      deployer.address,
      duration,
      secret,
      PUBLIC_RESOLVER,
      [],
      false,
      0
    );

    const commitTx = await controller.commit(commitment);
    await commitTx.wait();
    process.stdout.write('Commitment submitted — waiting 65s for minCommitmentAge...\n');

    await new Promise((resolve) => setTimeout(resolve, 65000));

    const registerTx = await controller.register(
      'aegis',
      deployer.address,
      duration,
      secret,
      PUBLIC_RESOLVER,
      [],
      false,
      0,
      { value }
    );
    await registerTx.wait();
    process.stdout.write('aegis.eth registered\n');
  }

  const AegisCCIPResolver = await ethers.getContractFactory('AegisCCIPResolver');
  const resolver = await AegisCCIPResolver.deploy(
    `${gatewayUrl.replace(/\/$/, '')}/{sender}/{data}.json`
  );
  await resolver.waitForDeployment();
  const resolverAddress = await resolver.getAddress();
  process.stdout.write(`AegisCCIPResolver deployed: ${resolverAddress}\n`);

  const isWrapped: boolean = await nameWrapper.isWrapped(aegisNode);
  if (isWrapped) {
    const wrapTx = await nameWrapper.setResolver(aegisNode, resolverAddress);
    await wrapTx.wait();
  } else {
    const setTx = await registry.setResolver(aegisNode, resolverAddress);
    await setTx.wait();
  }

  process.stdout.write(`Resolver set for aegis.eth → ${resolverAddress}\n`);
  process.stdout.write('\naegis.eth CCIP resolution is live on Sepolia.\n');
  process.stdout.write('Any ENS-aware app can now resolve *.aegis.eth via the CCIP gateway.\n');
}

main().catch((err) => {
  process.stderr.write(`${err}\n`);
  process.exit(1);
});
