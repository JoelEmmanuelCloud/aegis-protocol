import express, { Request, Response } from 'express';
import { writeKVObject, readKVObject } from '@aegis/0g-client';
import { setTextRecords } from '@aegis/ens-client';
import type { PropagateMessage, Verdict, ReputationRecord } from '@aegis/types';

const PORT = parseInt(process.env.AXL_MEMORY_PORT ?? '9032', 10);

interface AgentHistory {
  agentId: string;
  entries: Array<{ rootHash: string; verdict: Verdict; timestamp: number }>;
  lastUpdated: number;
}

const app = express();
app.use(express.json());

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

app.post('/send', async (req: Request, res: Response): Promise<void> => {
  const body = req.body as PropagateMessage;
  if (body.type !== 'PROPAGATE_ATTESTATION') {
    res.status(400).json({ error: `Unsupported message type: ${body.type}` });
    return;
  }
  try {
    await handlePropagateAttestation(body);
    res.json({ status: 'stored' });
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
  res.json({ status: 'ok', node: 'memory', port: PORT });
});

app.listen(PORT, () => {
  process.stdout.write(`memory-node listening on port ${PORT}\n`);
});
