import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import express, { Request, Response } from 'express';
import { downloadObject, writeKVObject, readKVObject } from '@aegis/0g-client';
import { replayDecision } from '@aegis/0g-compute';
import { send, recv } from '@aegis/axl-client';
import type { VerifyRequest, VerifyResponse, DecisionRecord, ReputationRecord } from '@aegis/types';

const PORT = parseInt(process.env.AXL_VERIFIER_PORT ?? '9012', 10);
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
  node_name: 'aegis-verifier',
  listen_addr: `0.0.0.0:${PORT}`,
  http_port: PORT,
  private_key_path: path.join(CONFIG_DIR, 'verifier.pem'),
  peers: [`http://${PEER_HOST}:${PROPAGATOR_PORT}`],
};
const CONFIG_PATH = path.join(os.tmpdir(), 'axl-verifier.json');
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

async function handleVerifyDecision(body: VerifyRequest): Promise<VerifyResponse> {
  const record = await downloadObject<DecisionRecord>(body.rootHash);

  const replay = await replayDecision(
    { inputs: record.inputs, reasoning: record.reasoning, action: record.action },
    record.action
  );

  const existing = await readKVObject<ReputationRecord>(`aegis:${body.agentId}:reputation`);
  const reputation: ReputationRecord = {
    score:
      replay.verdict === 'FLAGGED'
        ? Math.max(0, (existing?.score ?? 100) - 10)
        : Math.min(100, (existing?.score ?? 100) + 1),
    totalDecisions: existing?.totalDecisions ?? 1,
    flagged: replay.verdict === 'FLAGGED' ? (existing?.flagged ?? 0) + 1 : (existing?.flagged ?? 0),
    lastVerified: Date.now(),
  };
  await writeKVObject(`aegis:${body.agentId}:reputation`, reputation);

  if (PROPAGATOR_PEER_ID) {
    await send(AXL_BASE_URL, PROPAGATOR_PEER_ID, {
      type: 'PROPAGATE_ATTESTATION',
      rootHash: body.rootHash,
      agentId: body.agentId,
      verdict: replay.verdict,
      timestamp: Date.now(),
    }).catch(() => {});
  }

  return { verdict: replay.verdict, teeProof: replay.teeProof, rootHash: body.rootHash };
}

setInterval(async () => {
  const messages = await recv(AXL_BASE_URL).catch(() => []);
  for (const msg of messages) {
    if (msg.body.type === 'VERIFY_DECISION') {
      await handleVerifyDecision(msg.body as unknown as VerifyRequest).catch(() => {});
    }
  }
}, 1000);

const app = express();
app.use(express.json());

app.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await handleVerifyDecision(req.body as VerifyRequest);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get('/health', (_req: Request, res: Response): void => {
  res.json({
    status: 'ok',
    node: 'verifier',
    axlPort: PORT,
    peerId: process.env.AXL_VERIFIER_PEER_ID ?? 'unknown',
  });
});

app.listen(MGMT_PORT, () => {
  process.stdout.write(`verifier management server on port ${MGMT_PORT}\n`);
});
