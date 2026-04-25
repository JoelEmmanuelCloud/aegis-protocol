import { Indexer, MemData } from '@0gfoundation/0g-ts-sdk';
import { ethers } from 'ethers';

const ZG_INDEXER_RPC = process.env.ZG_INDEXER_RPC!;
const ZG_RPC_URL = process.env.ZG_RPC_URL!;
const ZG_PRIVATE_KEY = process.env.ZG_PRIVATE_KEY!;

function getSigner(): ethers.Wallet {
  const provider = new ethers.JsonRpcProvider(ZG_RPC_URL);
  return new ethers.Wallet(ZG_PRIVATE_KEY, provider);
}

export async function uploadObject(data: unknown): Promise<string> {
  const signer = getSigner();
  const encoded = Buffer.from(JSON.stringify(data));
  const memData = new MemData(encoded);

  const indexer = new Indexer(ZG_INDEXER_RPC);
  const [result, err] = await indexer.upload(memData, ZG_RPC_URL, signer);
  if (err) throw new Error(`Upload failed: ${err}`);

  const res = result as { rootHash: string };
  return res.rootHash;
}

export async function downloadObject<T>(rootHash: string): Promise<T> {
  const indexer = new Indexer(ZG_INDEXER_RPC);
  const [blob, err] = await indexer.downloadToBlob(rootHash);
  if (err) throw new Error(`Download failed: ${err}`);

  const text = await blob.text();
  return JSON.parse(text) as T;
}
