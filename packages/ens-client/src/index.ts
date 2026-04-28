import { ethers } from 'ethers';

const AEGIS_NAME_REGISTRY_ABI = [
  'function register(string label, address subnodeOwner) external',
  'function setText(bytes32 node, string key, string value) external',
  'function text(bytes32 node, string key) view returns (string)',
  'function nodeForLabel(string label) view returns (bytes32)',
  'function ownerOfNode(bytes32 node) view returns (address)',
];

function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(process.env.ZG_RPC_URL!);
}

function getSigner(): ethers.Wallet {
  return new ethers.Wallet(process.env.ZG_PRIVATE_KEY!, getProvider());
}

function getRegistry(writable: boolean): ethers.Contract {
  const address = process.env.AEGIS_NAME_REGISTRY_ADDRESS!;
  const runner = writable ? getSigner() : getProvider();
  return new ethers.Contract(address, AEGIS_NAME_REGISTRY_ABI, runner);
}

export function ensNode(ensName: string): string {
  return ethers.namehash(ensName);
}

export async function issueSubname(label: string, subnodeOwner: string): Promise<string> {
  const registry = getRegistry(true);
  const tx = await registry.register(label, subnodeOwner);
  await tx.wait();
  return ethers.namehash(`${label}.aegis.eth`);
}

export async function setTextRecord(
  fullEnsName: string,
  key: string,
  value: string
): Promise<void> {
  const registry = getRegistry(true);
  const node = ensNode(fullEnsName);
  const tx = await registry.setText(node, key, value);
  await tx.wait();
}

export async function setTextRecords(
  fullEnsName: string,
  records: Record<string, string>
): Promise<void> {
  const registry = getRegistry(true);
  const node = ensNode(fullEnsName);
  for (const [key, value] of Object.entries(records)) {
    const tx = await registry.setText(node, key, value);
    await tx.wait();
  }
}

export async function getTextRecord(fullEnsName: string, key: string): Promise<string> {
  const registry = getRegistry(false);
  const node = ensNode(fullEnsName);
  return registry.text(node, key) as Promise<string>;
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
