import express, { Request, Response } from 'express';
import { send, getTopology } from '@aegis/axl-client';
import type { PropagateMessage } from '@aegis/types';

const PORT = parseInt(process.env.AXL_PROPAGATOR_PORT ?? '9022', 10);
const MEMORY_AXL_URL = `http://localhost:${process.env.AXL_MEMORY_PORT ?? 9032}`;
const MEMORY_PEER_ID = process.env.AXL_MEMORY_PEER_ID ?? '';
const SELF_URL = `http://localhost:${PORT}`;

const app = express();
app.use(express.json());

async function handlePropagateAttestation(body: PropagateMessage): Promise<void> {
  if (MEMORY_PEER_ID) {
    await send(MEMORY_AXL_URL, MEMORY_PEER_ID, body).catch(() => {});
  }

  const peers = await getTopology(SELF_URL).catch(() => []);
  const broadcasts = peers.map((peer) =>
    send(`http://${peer.addr}`, peer.peerId, body).catch(() => {})
  );
  await Promise.allSettled(broadcasts);
}

app.post('/send', async (req: Request, res: Response): Promise<void> => {
  const body = req.body as PropagateMessage;
  if (body.type !== 'PROPAGATE_ATTESTATION') {
    res.status(400).json({ error: `Unsupported message type: ${body.type}` });
    return;
  }
  try {
    await handlePropagateAttestation(body);
    res.json({ status: 'propagated' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/recv', (_req: Request, res: Response): void => {
  res.json([]);
});

app.get('/topology', (_req: Request, res: Response): void => {
  res.json([]);
});

app.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', node: 'propagator', port: PORT });
});

app.listen(PORT, () => {
  process.stdout.write(`propagator-node listening on port ${PORT}\n`);
});
