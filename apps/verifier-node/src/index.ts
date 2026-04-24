import express, { Request, Response } from 'express';
import { downloadObject, writeKVObject, readKVObject } from '@aegis/0g-client';
import { replayDecision } from '@aegis/0g-compute';
import { send } from '@aegis/axl-client';
import type { VerifyRequest, VerifyResponse, DecisionRecord, ReputationRecord } from '@aegis/types';

const PORT = parseInt(process.env.AXL_VERIFIER_PORT ?? '9012', 10);
const PROPAGATOR_AXL_URL = `http://localhost:${process.env.AXL_PROPAGATOR_PORT ?? 9022}`;
const PROPAGATOR_PEER_ID = process.env.AXL_PROPAGATOR_PEER_ID ?? '';

const app = express();
app.use(express.json());

async function handleVerifyDecision(body: VerifyRequest): Promise<VerifyResponse> {
  const record = await downloadObject<DecisionRecord>(body.rootHash);

  const replay = await replayDecision(
    { inputs: record.inputs, reasoning: record.reasoning, action: record.action },
    record.action
  );

  const existing = await readKVObject<ReputationRecord>(`aegis:${body.agentId}:reputation`);
  const reputation: ReputationRecord = {
    score: replay.verdict === 'FLAGGED'
      ? Math.max(0, (existing?.score ?? 100) - 10)
      : Math.min(100, (existing?.score ?? 100) + 1),
    totalDecisions: existing?.totalDecisions ?? 1,
    flagged: replay.verdict === 'FLAGGED'
      ? (existing?.flagged ?? 0) + 1
      : (existing?.flagged ?? 0),
    lastVerified: Date.now(),
  };
  await writeKVObject(`aegis:${body.agentId}:reputation`, reputation);

  if (PROPAGATOR_PEER_ID) {
    await send(PROPAGATOR_AXL_URL, PROPAGATOR_PEER_ID, {
      type: 'PROPAGATE_ATTESTATION',
      rootHash: body.rootHash,
      agentId: body.agentId,
      verdict: replay.verdict,
      timestamp: Date.now(),
    }).catch(() => {});
  }

  return {
    verdict: replay.verdict,
    teeProof: replay.teeProof,
    rootHash: body.rootHash,
  };
}

app.post('/send', async (req: Request, res: Response): Promise<void> => {
  const body = req.body as VerifyRequest;
  if (body.type !== 'VERIFY_DECISION') {
    res.status(400).json({ error: `Unsupported message type: ${body.type}` });
    return;
  }
  try {
    const result = await handleVerifyDecision(body);
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
  res.json({ status: 'ok', node: 'verifier', port: PORT });
});

app.listen(PORT, () => {
  process.stdout.write(`verifier-node listening on port ${PORT}\n`);
});
