import { spawn, execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import express, { Request, Response } from 'express';
import { writeKVObject, readKVObject } from '@aegis/0g-client';
import { recv } from '@aegis/axl-client';
import { setTextRecords } from '@aegis/ens-client';
import type { PropagateMessage, Verdict, ReputationRecord } from '@aegis/types';

const PORT = parseInt(process.env.AXL_MEMORY_PORT ?? '9032', 10);
const MGMT_PORT = PORT + 1000;
const PEER_HOST = process.env.AXL_PEER_HOST ?? '127.0.0.1';
const PROPAGATOR_PORT = parseInt(process.env.AXL_PROPAGATOR_PORT ?? '9022', 10);
const AXL_BASE_URL = `http://127.0.0.1:${PORT}`;
const CONFIG_DIR = path.resolve(__dirname, '../../../axl-configs');
const BINARY = path.resolve(
  __dirname,
  '../../../bin',
  process.platform === 'win32' ? 'axl-node.exe' : 'axl-node'
);

interface AgentHistory {
  agentId: string;
  entries: Array<{ rootHash: string; verdict: Verdict; timestamp: number }>;
  lastUpdated: number;
}

const nodeConfig = {
  node_name: 'aegis-memory',
  listen_addr: `0.0.0.0:${PORT}`,
  http_port: PORT,
  private_key_path: path.join(CONFIG_DIR, 'memory.pem'),
  peers: [`http://${PEER_HOST}:${PROPAGATOR_PORT}`],
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

const CONFIG_PATH = path.join(os.tmpdir(), 'axl-memory.json');
fs.writeFileSync(CONFIG_PATH, JSON.stringify(nodeConfig));

freePort(PORT);
const axl = spawn(BINARY, ['-config', CONFIG_PATH], { stdio: ['ignore', 'pipe', 'pipe'] });

axl.stdout.on('data', (d: Buffer) => process.stdout.write(d));
axl.stderr.on('data', (d: Buffer) => process.stderr.write(d));
axl.on('exit', (code) => {
  process.stderr.write(`axl-node exited with code ${code}\n`);
  process.exit(1);
});

process.on('SIGINT', () => { axl.kill(); process.exit(0); });
process.on('SIGTERM', () => { axl.kill(); process.exit(0); });

async function handlePropagateAttestation(body: PropagateMessage): Promise<void> {
  const key = `aegis:${body.agentId}:history`;
  const existing = await readKVObject<AgentHistory>(key);

  const entry = { rootHash: body.rootHash, verdict: body.verdict, timestamp: body.timestamp };
  const history: AgentHistory = {
    agentId: body.agentId,
    entries: [...(existing?.entries ?? []), entry],
    lastUpdated: Date.now(),
  };
  await writeKVObject(key, history);

  const reputation = await readKVObject<ReputationRecord>(`aegis:${body.agentId}:reputation`);

  if (body.agentId.endsWith('.aegis.eth')) {
    await setTextRecords(body.agentId, {
      'aegis.reputation': String(reputation?.score ?? 100),
      'aegis.totalDecisions': String(reputation?.totalDecisions ?? history.entries.length),
      'aegis.lastVerdict': body.verdict,
      'aegis.flaggedCount': String(reputation?.flagged ?? 0),
      'aegis.storageIndex': body.rootHash,
    }).catch(() => {});
  }
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
    node: 'memory',
    axlPort: PORT,
    peerId: process.env.AXL_MEMORY_PEER_ID ?? 'unknown',
  });
});

app.listen(MGMT_PORT, () => {
  process.stdout.write(`memory management server on port ${MGMT_PORT}\n`);
});
