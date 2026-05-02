import { Indexer, MemData } from '@0gfoundation/0g-ts-sdk';
import { ethers } from 'ethers';

const ZG_INDEXER_RPC = process.env.ZG_INDEXER_RPC!;
const ZG_RPC_URL = process.env.ZG_RPC_URL!;
const ZG_PRIVATE_KEY = process.env.ZG_PRIVATE_KEY!;
const DOWNLOAD_TIMEOUT_MS = 30_000;

function getSigner(): ethers.Wallet {
  const provider = new ethers.JsonRpcProvider(ZG_RPC_URL);
  return new ethers.Wallet(ZG_PRIVATE_KEY, provider);
}

async function getMemDataRoot(memData: MemData): Promise<string | null> {
  const [tree, err] = await memData.merkleTree();
  if (err || !tree) return null;
  return tree.rootHash();
}

export async function uploadObject(data: unknown): Promise<string> {
  const encoded = Buffer.from(JSON.stringify(data));
  const memData = new MemData(encoded);

  const realRoot = await getMemDataRoot(memData).catch(() => null);
  const fallbackHash = realRoot ?? ethers.keccak256(encoded).replace('0x', '');

  process.stdout.write(`[0g-upload] starting upload rootHash=${fallbackHash}\n`);

  let signer: ethers.Wallet;
  try {
    signer = getSigner();
  } catch (err) {
    process.stdout.write(`[0g-upload] no signer, skipping upload: ${err}\n`);
    return fallbackHash;
  }

  const indexer = new Indexer(ZG_INDEXER_RPC);
  const [, uploadErr] = await indexer.upload(memData, ZG_RPC_URL, signer);

  if (uploadErr) {
    process.stdout.write(`[0g-upload] upload error: ${uploadErr}\n`);
  } else {
    process.stdout.write(`[0g-upload] upload confirmed rootHash=${fallbackHash}\n`);
  }

  return fallbackHash;
}

export async function downloadObject<T>(rootHash: string): Promise<T> {
  process.stdout.write(`[0g-download] fetching rootHash=${rootHash}\n`);

  const indexer = new Indexer(ZG_INDEXER_RPC);
  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), DOWNLOAD_TIMEOUT_MS)
  );
  const race = await Promise.race([indexer.downloadToBlob(rootHash), timeout]);

  if (race === null) {
    process.stdout.write(`[0g-download] timed out rootHash=${rootHash}\n`);
    throw new Error(`Download timed out: ${rootHash}`);
  }

  const [blob, err] = race as [{ text: () => Promise<string> }, unknown];
  if (err) {
    process.stdout.write(`[0g-download] failed rootHash=${rootHash} err=${err}\n`);
    throw new Error(`Download failed: ${err}`);
  }

  const text = await blob.text();
  process.stdout.write(`[0g-download] success rootHash=${rootHash} bytes=${text.length}\n`);
  return JSON.parse(text) as T;
}
