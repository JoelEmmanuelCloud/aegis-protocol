import { KvClient, Batcher } from '@0gfoundation/0g-ts-sdk';
import { ethers } from 'ethers';

const ZG_KV_ENDPOINT = process.env.ZG_KV_ENDPOINT!;
const ZG_RPC_URL = process.env.ZG_RPC_URL!;
const ZG_PRIVATE_KEY = process.env.ZG_PRIVATE_KEY!;

function getStreamId(): Uint8Array {
  const wallet = new ethers.Wallet(ZG_PRIVATE_KEY);
  const hex = wallet.address.toLowerCase().replace('0x', '');
  const padded = '0'.repeat(24) + hex;
  return Buffer.from(padded, 'hex');
}

function getSigner(): ethers.Wallet {
  const provider = new ethers.JsonRpcProvider(ZG_RPC_URL);
  return new ethers.Wallet(ZG_PRIVATE_KEY, provider);
}

export async function writeKV(key: string, value: string): Promise<void> {
  const signer = getSigner();
  const streamId = getStreamId();
  const batcher = await Batcher.newBatcher(signer, [], signer.provider!, ZG_KV_ENDPOINT);

  await batcher.setValue(
    streamId,
    Buffer.from(key, 'utf-8'),
    Buffer.from(value, 'utf-8')
  );

  await batcher.exec();
}

export async function readKV(key: string): Promise<string | null> {
  const kvClient = new KvClient(ZG_KV_ENDPOINT);
  const streamId = getStreamId();

  const result = await kvClient.getValue(streamId, Buffer.from(key, 'utf-8'), 0, 8192);

  if (!result) return null;
  return Buffer.from(result).toString('utf-8');
}

export async function writeKVObject(key: string, value: unknown): Promise<void> {
  await writeKV(key, JSON.stringify(value));
}

export async function readKVObject<T>(key: string): Promise<T | null> {
  const raw = await readKV(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}
