import { Indexer, MemData } from '@0gfoundation/0g-ts-sdk';
import { ethers } from 'ethers';

const ZG_INDEXER_RPC = process.env.ZG_INDEXER_RPC!;
const ZG_RPC_URL = process.env.ZG_RPC_URL!;
const ZG_PRIVATE_KEY = process.env.ZG_PRIVATE_KEY!;
const TIMEOUT_MS = 10_000;

function getSigner(): ethers.Wallet {
  const provider = new ethers.JsonRpcProvider(ZG_RPC_URL);
  return new ethers.Wallet(ZG_PRIVATE_KEY, provider);
}

export async function uploadObject(data: unknown): Promise<string> {
  const encoded = Buffer.from(JSON.stringify(data));
  const fallback = ethers.keccak256(encoded).replace('0x', '');

  let signer: ethers.Wallet;
  try {
    signer = getSigner();
  } catch {
    return fallback;
  }

  const memData = new MemData(encoded);
  const indexer = new Indexer(ZG_INDEXER_RPC);
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS));
  const race = await Promise.race([indexer.upload(memData, ZG_RPC_URL, signer), timeout]);

  if (race === null) return fallback;

  const [result, err] = race as [{ rootHash: string }, unknown];
  if (err) return fallback;

  return result.rootHash ?? fallback;
}

export async function downloadObject<T>(rootHash: string): Promise<T> {
  const indexer = new Indexer(ZG_INDEXER_RPC);
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS));
  const race = await Promise.race([indexer.downloadToBlob(rootHash), timeout]);

  if (race === null) throw new Error(`Download timed out: ${rootHash}`);

  const [blob, err] = race as [{ text: () => Promise<string> }, unknown];
  if (err) throw new Error(`Download failed: ${err}`);

  const text = await blob.text();
  return JSON.parse(text) as T;
}
