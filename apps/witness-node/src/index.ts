import express, { Request, Response } from 'express';
import { uploadObject, writeKVObject, readKVObject } from '@aegis/0g-client';
import { send } from '@aegis/axl-client';
import type { AttestationRequest, AttestationResponse, DecisionRecord, ReputationRecord, LatestRecord } from '@aegis/types';

const PORT = parseInt(process.env.AXL_WITNESS_PORT ?? '9002', 10);
const PROPAGATOR_AXL_URL = `http://localhost:${process.env.AXL_PROPAGATOR_PORT ?? 9022}`;
const PROPAGATOR_PEER_ID = process.env.AXL_PROPAGATOR_PEER_ID ?? '';

const app = express();
app.use(express.json());

async function handleAttestDecision(body: AttestationRequest): Promise<AttestationResponse> {
  const record: DecisionRecord = {
    agentId: body.agentId,
    inputs: body.inputs,
    reasoning: body.reasoning,
    action: body.action,
    verdict: 'PENDING',
    attestedBy: `witness-node:${PORT}`,
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
    await send(PROPAGATOR_AXL_URL, PROPAGATOR_PEER_ID, {
      type: 'PROPAGATE_ATTESTATION',
      rootHash,
      agentId: record.agentId,
      verdict: record.verdict,
      timestamp: record.timestamp,
    }).catch(() => {});
  }

  return { rootHash, status: 'COMMITTED' };
}

app.post('/send', async (req: Request, res: Response): Promise<void> => {
  const body = req.body as AttestationRequest;
  if (body.type !== 'ATTEST_DECISION') {
    res.status(400).json({ error: `Unsupported message type: ${body.type}` });
    return;
  }
  try {
    const result = await handleAttestDecision(body);
    res.json(result);
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
  res.json({ status: 'ok', node: 'witness', port: PORT });
});

app.listen(PORT, () => {
  process.stdout.write(`witness-node listening on port ${PORT}\n`);
});
