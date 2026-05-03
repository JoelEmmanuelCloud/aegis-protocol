import 'dotenv/config';
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import express, { Request, Response } from 'express';
import { writeKVObject, readKVObject } from '@aegis/0g-client';
import { notarizeVerdict } from '@aegis/0g-compute';
import { send, recv } from '@aegis/axl-client';
import type {
  VerifyRequest,
  VerifyResponse,
  DecisionRecord,
  ReputationRecord,
  Verdict,
  DisputePackage,
  TradeAction,
  AgentMandate,
} from '@aegis/types';

const PORT = parseInt(process.env.AXL_VERIFIER_PORT ?? '9012', 10);
const MGMT_PORT = PORT + 1000;
const TCP_PORT = parseInt(process.env.AXL_VERIFIER_TCP_PORT ?? '7012', 10);
const PROPAGATOR_PEER_ID = process.env.AXL_PROPAGATOR_PEER_ID ?? '';
const PROPAGATOR_HOST = process.env.AXL_PEER_HOST ?? '127.0.0.1';
const PROPAGATOR_TLS_PORT = parseInt(process.env.AXL_PROPAGATOR_TLS_PORT ?? '9120', 10);
const AXL_BASE_URL = `http://127.0.0.1:${PORT}`;
const CONFIG_DIR = path.resolve(__dirname, '../../../axl-configs');
const BINARY = path.resolve(
  __dirname,
  '../../../bin',
  process.platform === 'win32' ? 'axl-node.exe' : 'axl-node'
);
const PACKAGE_WAIT_MS = 30_000;
const PACKAGE_POLL_MS = 500;

const nodeConfig = {
  PrivateKeyPath: path.join(CONFIG_DIR, 'verifier.pem').replace(/\\/g, '/'),
  Peers: [
    `tls://${PROPAGATOR_HOST}:${PROPAGATOR_TLS_PORT}`,
    'tls://34.46.48.224:9001',
    'tls://136.111.135.206:9001',
  ],
  Listen: [],
  api_port: PORT,
  tcp_port: TCP_PORT,
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

const CONFIG_PATH = path.join(os.tmpdir(), 'axl-verifier.json');
fs.writeFileSync(CONFIG_PATH, JSON.stringify(nodeConfig));

freePort(PORT);
const axl = spawn(BINARY, ['-config', CONFIG_PATH], { stdio: ['ignore', 'pipe', 'pipe'] });

axl.stdout.on('data', (d: Buffer) => process.stdout.write(d));
axl.stderr.on('data', (d: Buffer) => process.stderr.write(d));
axl.on('exit', (code) => {
  process.stderr.write(`axl-node exited with code ${code}\n`);
  process.exit(1);
});

process.on('SIGINT', () => {
  axl.kill();
  process.exit(0);
});
process.on('SIGTERM', () => {
  axl.kill();
  process.exit(0);
});

const pendingPackages = new Map<string, DisputePackage>();

async function waitForPackage(rootHash: string): Promise<DisputePackage | null> {
  const deadline = Date.now() + PACKAGE_WAIT_MS;
  while (Date.now() < deadline) {
    const pkg = pendingPackages.get(rootHash);
    if (pkg) {
      pendingPackages.delete(rootHash);
      return pkg;
    }
    await new Promise<void>((r) => setTimeout(r, PACKAGE_POLL_MS));
  }
  return null;
}

function evaluateRules(pkg: DisputePackage): Verdict {
  if (pkg.history === null) {
    process.stdout.write(`[verifier] rule1 PENDING_DATA: history=null\n`);
    return 'PENDING_DATA';
  }

  const action = pkg.action;
  const mandate = pkg.mandate;

  const actionType = String(action.type ?? '').toLowerCase().replace(/[- ]/g, '_');
  const allowedActions = mandate.allowed_actions.map((a) =>
    a.toLowerCase().replace(/[- ]/g, '_')
  );
  const actionAllowed = allowedActions.length === 0 || allowedActions.includes(actionType);
  const pairAllowed =
    mandate.allowed_pairs.length === 0 ||
    mandate.allowed_pairs.map((p) => p.toLowerCase()).includes(
      String(action.pair ?? '').toLowerCase()
    );

  if (!actionAllowed || !pairAllowed) {
    process.stdout.write(
      `[verifier] rule2 FLAGGED: action=${action.type} pair=${action.pair} actionAllowed=${actionAllowed} pairAllowed=${pairAllowed}\n`
    );
    return 'FLAGGED';
  }

  const slippageDiff = Math.abs(action.claimed_price - pkg.oracle_price);
  const slippageAllowance = (pkg.oracle_price * mandate.acceptable_slippage) / 10_000;
  if (slippageDiff > slippageAllowance) {
    process.stdout.write(
      `[verifier] rule3 FLAGGED: slippageDiff=${slippageDiff} allowance=${slippageAllowance}\n`
    );
    return 'FLAGGED';
  }

  if (action.amount > mandate.max_single_trade) {
    process.stdout.write(
      `[verifier] rule4 FLAGGED: amount=${action.amount} max=${mandate.max_single_trade}\n`
    );
    return 'FLAGGED';
  }

  const now = Date.now();
  const cutoff = now - 24 * 60 * 60 * 1000;
  const recentEntries = pkg.history.filter((e) => e.timestamp >= cutoff);
  const historicalLoss = recentEntries.reduce((sum, e) => {
    const loss = e.action.potential_loss ?? 0;
    return sum + (loss > 0 ? loss : 0);
  }, 0);
  const currentLoss = action.potential_loss ?? 0;
  const totalDrawdown = historicalLoss + (currentLoss > 0 ? currentLoss : 0);

  if (totalDrawdown > mandate.max_daily_drawdown) {
    process.stdout.write(
      `[verifier] rule5 FLAGGED: totalDrawdown=${totalDrawdown} max=${mandate.max_daily_drawdown}\n`
    );
    return 'FLAGGED';
  }

  return 'CLEARED';
}

async function handleVerifyDecision(body: VerifyRequest): Promise<VerifyResponse> {
  process.stdout.write(
    `[verifier] verify request rootHash=${body.rootHash} agentId=${body.agentId}\n`
  );

  const pkg = await waitForPackage(body.rootHash);

  let verdict: Verdict;
  if (pkg) {
    process.stdout.write(`[verifier] dispute package received, running rule engine\n`);
    verdict = evaluateRules(pkg);
  } else {
    process.stdout.write(`[verifier] no dispute package after ${PACKAGE_WAIT_MS}ms, fetching record\n`);
    let record: DecisionRecord | null = null;
    try {
      const { downloadObject } = await import('@aegis/0g-client');
      record = await downloadObject<DecisionRecord>(body.rootHash);
      process.stdout.write(`[verifier] record downloaded agentId=${record.agentId}\n`);
    } catch (err) {
      process.stdout.write(`[verifier] download failed: ${err}\n`);
    }
    verdict = record ? (record.verdict ?? 'PENDING_DATA') : 'PENDING_DATA';
  }

  process.stdout.write(`[verifier] verdict=${verdict}, notarizing via 0G Compute\n`);

  let teeProof = '';
  try {
    teeProof = await notarizeVerdict(body.agentId, body.rootHash, verdict, Date.now());
    process.stdout.write(`[verifier] teeProof=${teeProof}\n`);
  } catch (err) {
    process.stdout.write(`[verifier] notarize failed: ${err}\n`);
  }

  if (PROPAGATOR_PEER_ID) {
    send(AXL_BASE_URL, PROPAGATOR_PEER_ID, {
      type: 'PROPAGATE_ATTESTATION',
      rootHash: body.rootHash,
      agentId: body.agentId,
      verdict,
      timestamp: Date.now(),
    }).catch(() => {});
  }

  void (async () => {
    const existing = await readKVObject<ReputationRecord>(
      `aegis:${body.agentId}:reputation`
    ).catch(() => null);
    const reputation: ReputationRecord = {
      score:
        verdict === 'FLAGGED'
          ? Math.max(0, (existing?.score ?? 100) - 10)
          : Math.min(100, (existing?.score ?? 100) + 1),
      totalDecisions: (existing?.totalDecisions ?? 0) + 1,
      flagged: verdict === 'FLAGGED' ? (existing?.flagged ?? 0) + 1 : (existing?.flagged ?? 0),
      lastVerified: Date.now(),
    };
    writeKVObject(`aegis:${body.agentId}:reputation`, reputation).catch(() => {});
  })();

  return { verdict, teeProof, rootHash: body.rootHash };
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

app.post('/packages', (req: Request, res: Response): void => {
  const pkg = req.body as DisputePackage;
  if (!pkg?.rootHash) {
    res.status(400).json({ error: 'missing rootHash' });
    return;
  }
  pendingPackages.set(pkg.rootHash, pkg);
  process.stdout.write(`[verifier] package stored rootHash=${pkg.rootHash}\n`);
  res.json({ ok: true });
});

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
