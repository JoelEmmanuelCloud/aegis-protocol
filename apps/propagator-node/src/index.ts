import { spawn } from 'child_process';
import path from 'path';
import express, { Request, Response } from 'express';
import { send, recv, getTopology } from '@aegis/axl-client';
import type { PropagateMessage } from '@aegis/types';

const PORT = parseInt(process.env.AXL_PROPAGATOR_PORT ?? '9022', 10);
const MGMT_PORT = PORT + 1000;
const MEMORY_PEER_ID = process.env.AXL_MEMORY_PEER_ID ?? '';
const AXL_BASE_URL = `http://127.0.0.1:${PORT}`;
const CONFIG_PATH = path.resolve(process.cwd(), 'axl-configs', 'propagator-node-config.json');
const BINARY = path.resolve(
  process.cwd(),
  'bin',
  process.platform === 'win32' ? 'axl-node.exe' : 'axl-node'
);

const axl = spawn(BINARY, ['-config', CONFIG_PATH], { stdio: ['ignore', 'pipe', 'pipe'] });

axl.stdout.on('data', (d: Buffer) => process.stdout.write(d));
axl.stderr.on('data', (d: Buffer) => process.stderr.write(d));
axl.on('exit', (code) => {
  process.stderr.write(`axl-node exited with code ${code}\n`);
  process.exit(1);
});

async function handlePropagateAttestation(body: PropagateMessage): Promise<void> {
  if (MEMORY_PEER_ID) {
    await send(AXL_BASE_URL, MEMORY_PEER_ID, body).catch(() => {});
  }

  const peers = await getTopology(AXL_BASE_URL).catch(() => []);
  const broadcasts = peers
    .filter((p) => p.peerId !== process.env.AXL_PROPAGATOR_PEER_ID)
    .map((peer) => send(`http://${peer.addr}`, peer.peerId, body).catch(() => {}));
  await Promise.allSettled(broadcasts);
}

setInterval(async () => {
  const messages = await recv(AXL_BASE_URL).catch(() => []);
  for (const msg of messages) {
    if (msg.body.type === 'PROPAGATE_ATTESTATION') {
      await handlePropagateAttestation(msg.body as unknown as PropagateMessage).catch(() => {});
    }
  }
}, 1000);

const app = express();
app.use(express.json());

app.get('/health', (_req: Request, res: Response): void => {
  res.json({
    status: 'ok',
    node: 'propagator',
    axlPort: PORT,
    peerId: process.env.AXL_PROPAGATOR_PEER_ID ?? 'unknown',
  });
});

app.listen(MGMT_PORT, () => {
  process.stdout.write(`propagator management server on port ${MGMT_PORT}\n`);
});
