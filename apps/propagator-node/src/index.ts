import { spawn, execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import express, { Request, Response } from 'express';
import { send, recv, getTopology } from '@aegis/axl-client';
import type { PropagateMessage } from '@aegis/types';

const PORT = parseInt(process.env.AXL_PROPAGATOR_PORT ?? '9022', 10);
const MGMT_PORT = PORT + 1000;
const MEMORY_PEER_ID = process.env.AXL_MEMORY_PEER_ID ?? '';
const AXL_BASE_URL = `http://127.0.0.1:${PORT}`;
const CONFIG_DIR = path.resolve(__dirname, '../../../axl-configs');
const BINARY = path.resolve(
  __dirname,
  '../../../bin',
  process.platform === 'win32' ? 'axl-node.exe' : 'axl-node'
);

const nodeConfig = {
  node_name: 'aegis-propagator',
  listen_addr: `0.0.0.0:${PORT}`,
  http_port: PORT,
  private_key_path: path.join(CONFIG_DIR, 'propagator.pem'),
  peers: [],
};
function freePort(port: number): void {
  try {
    if (process.platform === 'win32') {
      execSync(
        `powershell -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`,
        { stdio: 'ignore' }
      );
    } else {
      execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
    }
  } catch {}
}

const CONFIG_PATH = path.join(os.tmpdir(), 'axl-propagator.json');
fs.writeFileSync(CONFIG_PATH, JSON.stringify(nodeConfig));

freePort(PORT);
const axl = spawn(BINARY, ['-config', CONFIG_PATH, '-listen', `http://127.0.0.1:${PORT}`], { stdio: ['ignore', 'pipe', 'pipe'] });

axl.stdout.on('data', (d: Buffer) => process.stdout.write(d));
axl.stderr.on('data', (d: Buffer) => process.stderr.write(d));
axl.on('exit', (code) => {
  process.stderr.write(`axl-node exited with code ${code}\n`);
  process.exit(1);
});

process.on('SIGINT', () => { axl.kill(); process.exit(0); });
process.on('SIGTERM', () => { axl.kill(); process.exit(0); });

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
