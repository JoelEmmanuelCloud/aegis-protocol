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

  const [trees, treeErr] = await memData.merkleTree();
  if (treeErr) throw new Error(`Merkle tree error: ${treeErr}`);

  const indexer = new Indexer(ZG_INDEXER_RPC);
  const [, uploadErr] = await indexer.upload(memData, ZG_RPC_URL, signer);
  if (uploadErr) throw new Error(`Upload error: ${uploadErr}`);

  return trees!.rootHash().hex();
}

export async function downloadObject<T>(rootHash: string): Promise<T> {
  const indexer = new Indexer(ZG_INDEXER_RPC);
  const [data, err] = await indexer.download(rootHash, true);
  if (err) throw new Error(`Download error: ${err}`);

  return JSON.parse(Buffer.from(data!).toString('utf-8')) as T;
}
