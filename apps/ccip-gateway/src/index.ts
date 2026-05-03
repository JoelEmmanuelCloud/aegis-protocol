import express, { Request, Response } from 'express';
import { ethers } from 'ethers';

const PORT = parseInt(process.env.CCIP_GATEWAY_PORT ?? '8080', 10);

const REGISTRY_ABI = [
  'function text(bytes32 node, string key) view returns (string)',
  'function ownerOfNode(bytes32 node) view returns (address)',
];

const SEL_TEXT = '59d1d43c';
const SEL_ADDR = '3b3b57de';

function getRegistry(): ethers.Contract {
  const provider = new ethers.JsonRpcProvider(process.env.ZG_RPC_URL!);
  return new ethers.Contract(process.env.AEGIS_NAME_REGISTRY_ADDRESS!, REGISTRY_ABI, provider);
}

function encodeResponse(innerAbi: string[], innerValues: unknown[]): string {
  const inner = ethers.AbiCoder.defaultAbiCoder().encode(innerAbi, innerValues);
  return ethers.AbiCoder.defaultAbiCoder().encode(['bytes'], [inner]);
}

const app = express();
app.use(express.json());
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', registry: process.env.AEGIS_NAME_REGISTRY_ADDRESS });
});

app.get('/:sender/:calldata', async (req: Request, res: Response): Promise<void> => {
  try {
    const raw = req.params.calldata.replace(/\.json$/, '');
    const calldata = raw.startsWith('0x') ? raw.slice(2) : raw;
    const selector = calldata.slice(0, 8).toLowerCase();
    const registry = getRegistry();

    if (selector === SEL_TEXT) {
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ['bytes32', 'string'],
        '0x' + calldata.slice(8)
      );
      const node = decoded[0] as string;
      const key = decoded[1] as string;
      const value: string = await registry.text(node, key);
      res.json({ data: encodeResponse(['string'], [value]) });
      return;
    }

    if (selector === SEL_ADDR) {
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ['bytes32'],
        '0x' + calldata.slice(8)
      );
      const node = decoded[0] as string;
      const owner: string = await registry.ownerOfNode(node);
      res.json({ data: encodeResponse(['address'], [owner]) });
      return;
    }

    res.status(404).json({ error: `unsupported selector: 0x${selector}` });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  process.stdout.write(`ccip-gateway on port ${PORT}\n`);
  process.stdout.write(`registry: ${process.env.AEGIS_NAME_REGISTRY_ADDRESS}\n`);
});
