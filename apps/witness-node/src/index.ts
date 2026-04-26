import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import express, { Request, Response } from 'express';
import { uploadObject, writeKVObject, readKVObject } from '@aegis/0g-client';
import { send, recv } from '@aegis/axl-client';
import type {
  AttestationRequest,
  AttestationResponse,
  DecisionRecord,
  ReputationRecord,
  LatestRecord,
  NetworkStats,
} from '@aegis/types';

const PORT = parseInt(process.env.AXL_WITNESS_PORT ?? '9002', 10);
const MGMT_PORT = PORT + 1000;
const PROPAGATOR_PEER_ID = process.env.AXL_PROPAGATOR_PEER_ID ?? '';
const PEER_HOST = process.env.AXL_PEER_HOST ?? '127.0.0.1';
const PROPAGATOR_PORT = parseInt(process.env.AXL_PROPAGATOR_PORT ?? '9022', 10);
const AXL_BASE_URL = `http://127.0.0.1:${PORT}`;
const CONFIG_DIR = path.resolve(__dirname, '../../../axl-configs');
const BINARY = path.resolve(
  __dirname,
  '../../../bin',
  process.platform === 'win32' ? 'axl-node.exe' : 'axl-node'
);

const nodeConfig = {
  node_name: 'aegis-witness',
  listen_addr: `0.0.0.0:${PORT}`,
  http_port: PORT,
  private_key_path: path.join(CONFIG_DIR, 'witness.pem'),
  peers: [`http://${PEER_HOST}:${PROPAGATOR_PORT}`],
};
const CONFIG_PATH = path.join(os.tmpdir(), 'axl-witness.json');
fs.writeFileSync(CONFIG_PATH, JSON.stringify(nodeConfig));

const axl = spawn(BINARY, ['-config', CONFIG_PATH], { stdio: ['ignore', 'pipe', 'pipe'] });

axl.stdout.on('data', (d: Buffer) => process.stdout.write(d));
axl.stderr.on('data', (d: Buffer) => process.stderr.write(d));
axl.on('exit', (code) => {
  process.stderr.write(`axl-node exited with code ${code}\n`);
  process.exit(1);
});

process.on('SIGINT', () => { axl.kill(); process.exit(0); });
process.on('SIGTERM', () => { axl.kill(); process.exit(0); });

async function handleAttestDecision(body: AttestationRequest): Promise<AttestationResponse> {
  const record: DecisionRecord = {
    agentId: body.agentId,
    inputs: body.inputs,
    reasoning: body.reasoning,
    action: body.action,
    verdict: 'PENDING',
    attestedBy: `witness:${process.env.AXL_WITNESS_PEER_ID ?? PORT}`,
    timestamp: body.timestamp,
  };

  const rootHash = await uploadObject(record);

  const latest: LatestRecord = { rootHash, timestamp: record.timestamp, verdict: record.verdict };
  await writeKVObject(`aegis:${record.agentId}:latest`, latest);

  const existing = await readKVObject<ReputationRecord>(`aegis:${record.agentId}:reputation`);
  const reputation: ReputationRecord = {
    score: existing?.score ?? 100,
    totalDecisions: (existing?.totalDecisions ?? 0) + 1,
    flagged: existing?.flagged ?? 0,
    lastVerified: Date.now(),
  };
  await writeKVObject(`aegis:${record.agentId}:reputation`, reputation);

  if (PROPAGATOR_PEER_ID) {
    await send(AXL_BASE_URL, PROPAGATOR_PEER_ID, {
      type: 'PROPAGATE_ATTESTATION',
      rootHash,
      agentId: record.agentId,
      verdict: record.verdict,
      timestamp: record.timestamp,
    }).catch(() => {});
  }

  const stats = await readKVObject<NetworkStats>('aegis:network:stats');
  await writeKVObject('aegis:network:stats', {
    totalAttestations: (stats?.totalAttestations ?? 0) + 1,
    disputes: stats?.disputes ?? 0,
    activeAgents: stats?.activeAgents ?? 0,
  }).catch(() => {});

  return { rootHash, status: 'COMMITTED' };
}

setInterval(async () => {
  const messages = await recv(AXL_BASE_URL).catch(() => []);
  for (const msg of messages) {
    if (msg.body.type === 'ATTEST_DECISION') {
      await handleAttestDecision(msg.body as unknown as AttestationRequest).catch(() => {});
    }
  }
}, 1000);

const app = express();
app.use(express.json());

app.post('/attest', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await handleAttestDecision(req.body as AttestationRequest);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/health', (_req: Request, res: Response): void => {
  res.json({
    status: 'ok',
    node: 'witness',
    axlPort: PORT,
    peerId: process.env.AXL_WITNESS_PEER_ID ?? 'unknown',
  });
});

app.listen(MGMT_PORT, () => {
  process.stdout.write(`witness management server on port ${MGMT_PORT}\n`);
});
