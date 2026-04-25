import { ethers } from 'ethers';

const PUBLIC_RESOLVER_ABI = [
  'function setText(bytes32 node, string key, string value) external',
  'function text(bytes32 node, string key) view returns (string)',
];

const NAME_WRAPPER_ABI = [
  'function setSubnodeRecord(bytes32 node, string label, address owner, address resolver, uint64 ttl, uint32 fuses, uint64 expiry) external returns (bytes32)',
];

function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(process.env.ZG_RPC_URL!);
}

function getSigner(): ethers.Wallet {
  return new ethers.Wallet(
    process.env.ENS_PRIVATE_KEY ?? process.env.ZG_PRIVATE_KEY!,
    getProvider()
  );
}

function getResolver(): ethers.Contract {
  return new ethers.Contract(
    process.env.ENS_PUBLIC_RESOLVER_ADDRESS!,
    PUBLIC_RESOLVER_ABI,
    getSigner()
  );
}

function ensNode(ensName: string): string {
  return ethers.namehash(ensName);
}

export async function setTextRecord(
  fullEnsName: string,
  key: string,
  value: string
): Promise<void> {
  const resolver = getResolver();
  const node = ensNode(fullEnsName);
  const tx = await resolver.setText(node, key, value);
  await tx.wait();
}

export async function setTextRecords(
  fullEnsName: string,
  records: Record<string, string>
): Promise<void> {
  const resolver = getResolver();
  const node = ensNode(fullEnsName);

  for (const [key, value] of Object.entries(records)) {
    const tx = await resolver.setText(node, key, value);
    await tx.wait();
  }
}

export async function getTextRecord(fullEnsName: string, key: string): Promise<string> {
  const provider = getProvider();
  const resolver = new ethers.Contract(
    process.env.ENS_PUBLIC_RESOLVER_ADDRESS!,
    PUBLIC_RESOLVER_ABI,
    provider
  );
  const node = ensNode(fullEnsName);
  return resolver.text(node, key) as Promise<string>;
}

export async function getReputationRecords(fullEnsName: string): Promise<Record<string, string>> {
  const keys = [
    'aegis.reputation',
    'aegis.totalDecisions',
    'aegis.lastVerdict',
    'aegis.flaggedCount',
    'aegis.storageIndex',
    'agent.registry',
    'agent.id',
  ];

  const values = await Promise.all(keys.map((k) => getTextRecord(fullEnsName, k)));

  return Object.fromEntries(keys.map((k, i) => [k, values[i]]));
}

export async function issueSubname(label: string, subowner: string): Promise<string> {
  const signer = getSigner();
  const nameWrapper = new ethers.Contract(
    process.env.ENS_NAME_WRAPPER_ADDRESS!,
    NAME_WRAPPER_ABI,
    signer
  );

  const aegisNode = ethers.namehash('aegis.eth');
  const expiry = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

  const tx = await nameWrapper.setSubnodeRecord(
    aegisNode,
    label,
    subowner,
    process.env.ENS_PUBLIC_RESOLVER_ADDRESS!,
    0,
    0,
    expiry
  );
  await tx.wait();

  return ethers.namehash(`${label}.aegis.eth`);
}

export { ensNode };
