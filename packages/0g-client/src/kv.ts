import { KvClient, Batcher, Indexer, getFlowContract } from '@0gfoundation/0g-ts-sdk';
import { ethers } from 'ethers';

const ZG_KV_ENDPOINT = process.env.ZG_KV_ENDPOINT!;
const ZG_RPC_URL = process.env.ZG_RPC_URL!;
const ZG_INDEXER_RPC = process.env.ZG_INDEXER_RPC!;
const ZG_PRIVATE_KEY = process.env.ZG_PRIVATE_KEY!;
const KV_TIMEOUT_MS = 500;

function withKVTimeout<T>(p: Promise<T>): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('KV operation timed out')), KV_TIMEOUT_MS)
    ),
  ]);
}

function getStreamId(): string {
  if (!ZG_PRIVATE_KEY) throw new Error('ZG_PRIVATE_KEY is required for 0G KV operations');
  const wallet = new ethers.Wallet(ZG_PRIVATE_KEY);
  const hex = wallet.address.toLowerCase().replace('0x', '');
  return '0x' + '0'.repeat(24) + hex;
}

function getSigner(): ethers.Wallet {
  const provider = new ethers.JsonRpcProvider(ZG_RPC_URL);
  return new ethers.Wallet(ZG_PRIVATE_KEY, provider);
}

async function createBatcher(): Promise<Batcher> {
  const indexer = new Indexer(ZG_INDEXER_RPC);
  const [clients, err] = await withKVTimeout(indexer.selectNodes(1));
  if (err) throw new Error(`Failed to select storage nodes: ${err}`);

  const status = await withKVTimeout(clients[0].getStatus());
  const signer = getSigner();
  const flow = getFlowContract(status.networkIdentity.flowAddress, signer);

  return new Batcher(0, clients, flow, ZG_RPC_URL);
}

export async function writeKV(key: string, value: string): Promise<void> {
  const streamId = getStreamId();
  const batcher = await createBatcher();

  batcher.streamDataBuilder.set(streamId, Buffer.from(key, 'utf-8'), Buffer.from(value, 'utf-8'));

  const [, err] = await withKVTimeout(batcher.exec());
  if (err) throw new Error(`KV write failed: ${err}`);
}

function isValidPrivateKey(key: string): boolean {
  return /^(0x)?[0-9a-fA-F]{64}$/.test(key);
}

export async function readKV(key: string): Promise<string | null> {
  if (!ZG_PRIVATE_KEY || !isValidPrivateKey(ZG_PRIVATE_KEY)) return null;
  const kvClient = new KvClient(ZG_KV_ENDPOINT);
  const streamId = getStreamId();

  const result = await withKVTimeout(kvClient.getValue(streamId, Buffer.from(key, 'utf-8')));
  if (!result) return null;

  return Buffer.from(result.data, 'base64').toString('utf-8');
}

export async function writeKVObject(key: string, value: unknown): Promise<void> {
  await writeKV(key, JSON.stringify(value));
}

export async function readKVObject<T>(key: string): Promise<T | null> {
  const raw = await readKV(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}
