import 'dotenv/config';
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import express, { Request, Response } from 'express';
import { ethers } from 'ethers';
import { writeKVObject, readKVObject, downloadObject } from '@aegis/0g-client';
import { recv, send, getTopology } from '@aegis/axl-client';
import { setTextRecords } from '@aegis/ens-client';
import type {
  PropagateMessage,
  Verdict,
  ReputationRecord,
  DisputePackage,
  HistoryEntry,
  TradeAction,
  AgentMandate,
  DecisionRecord,
} from '@aegis/types';

const PORT = parseInt(process.env.AXL_MEMORY_PORT ?? '9032', 10);
const MGMT_PORT = PORT + 1000;
const TCP_PORT = parseInt(process.env.AXL_MEMORY_TCP_PORT ?? '7032', 10);
const PROPAGATOR_HOST = process.env.AXL_PEER_HOST ?? '127.0.0.1';
const PROPAGATOR_TLS_PORT = parseInt(process.env.AXL_PROPAGATOR_TLS_PORT ?? '9120', 10);
const AXL_BASE_URL = `http://127.0.0.1:${PORT}`;
const CONFIG_DIR = path.resolve(__dirname, '../../../axl-configs');
const BINARY = path.resolve(
  __dirname,
  '../../../bin',
  process.platform === 'win32' ? 'axl-node.exe' : 'axl-node'
);

const VERIFIER_AXL_PORT = parseInt(process.env.AXL_VERIFIER_PORT ?? '9012', 10);
const VERIFIER_URL =
  process.env.VERIFIER_MGMT_URL ?? `http://localhost:${VERIFIER_AXL_PORT + 1000}`;

const AGENT_REGISTRY_ABI = [
  'function getTokenByEnsLabel(string label) view returns (uint256)',
  'function getMandate(uint256 tokenId) view returns (tuple(string[] allowedActions, address[] allowedPairs, uint256 maxSingleTrade, uint256 maxDailyDrawdown, uint256 acceptableSlippage) mandate)',
];

const AEGIS_COURT_ABI = [
  'event DisputeFiled(bytes32 indexed rootHash, string agentId, address indexed disputedBy)',
  'event DataResolved(bytes32 indexed rootHash, string agentId, address indexed submitter)',
];

interface AgentHistory {
  agentId: string;
  entries: Array<{ rootHash: string; verdict: Verdict; timestamp: number; action?: TradeAction }>;
  lastUpdated: number;
}

const nodeConfig = {
  PrivateKeyPath: path.join(CONFIG_DIR, 'memory.pem').replace(/\\/g, '/'),
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

process.on('SIGINT', () => {
  axl.kill();
  process.exit(0);
});
process.on('SIGTERM', () => {
  axl.kill();
  process.exit(0);
});

function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(process.env.ZG_RPC_URL!);
}

function getRegistryContract(): ethers.Contract {
  return new ethers.Contract(
    process.env.AGENT_REGISTRY_ADDRESS!,
    AGENT_REGISTRY_ABI,
    getProvider()
  );
}

async function fetchMandate(agentId: string): Promise<AgentMandate | null> {
  try {
    const label = agentId.replace(/\.aegis\.eth$/, '');
    const registry = getRegistryContract();
    const tokenId: bigint = await registry.getTokenByEnsLabel(label);
    if (tokenId === 0n) return null;
    const m = await registry.getMandate(tokenId);
    return {
      allowed_actions: Array.from(m.allowedActions as string[]),
      allowed_pairs: Array.from(m.allowedPairs as string[]),
      max_single_trade: Number(m.maxSingleTrade),
      max_daily_drawdown: Number(m.maxDailyDrawdown),
      acceptable_slippage: Number(m.acceptableSlippage),
    };
  } catch (err) {
    process.stdout.write(`[memory] fetchMandate failed: ${err}\n`);
    return null;
  }
}

async function fetchHistory(agentId: string): Promise<HistoryEntry[] | null> {
  const key = `aegis:${agentId}:history`;
  let stored: AgentHistory | null;
  try {
    stored = await readKVObject<AgentHistory>(key);
  } catch {
    return null;
  }
  if (!stored?.entries?.length) {
    return [];
  }
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return stored.entries
    .filter((e) => e.timestamp >= cutoff)
    .map((e) => ({
      rootHash: e.rootHash,
      action: e.action ?? { type: '', pair: '', amount: 0, claimed_price: 0 },
      timestamp: e.timestamp,
      verdict: e.verdict,
    }));
}

async function broadcastHistoryRequest(agentId: string): Promise<HistoryEntry[] | null> {
  const requestId = `${agentId}:${Date.now()}`;
  const pendingResponses = new Map<string, HistoryEntry[]>();

  const handler = (msg: { body: Record<string, unknown> }) => {
    if (msg.body.type === 'RES_HISTORY' && msg.body.requestId === requestId) {
      pendingResponses.set(requestId, (msg.body.entries as HistoryEntry[]) ?? []);
    }
  };

  axlMessageHandlers.set(requestId, handler);

  const peers = await getTopology(AXL_BASE_URL).catch(() => []);
  for (const peer of peers) {
    send(AXL_BASE_URL, peer.peerId, {
      type: 'REQ_HISTORY',
      agentId,
      requestId,
    }).catch(() => {});
  }

  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (pendingResponses.has(requestId)) {
      axlMessageHandlers.delete(requestId);
      return pendingResponses.get(requestId) ?? null;
    }
    await new Promise<void>((r) => setTimeout(r, 200));
  }

  axlMessageHandlers.delete(requestId);
  return null;
}

type AXLHandler = (msg: { body: Record<string, unknown> }) => void;
const axlMessageHandlers = new Map<string, AXLHandler>();

async function assembleDisputePackage(
  rootHash: string,
  agentId: string
): Promise<DisputePackage> {
  process.stdout.write(`[memory] assembling dispute package rootHash=${rootHash} agentId=${agentId}\n`);

  let record: DecisionRecord | null = null;
  try {
    record = await downloadObject<DecisionRecord>(rootHash);
    process.stdout.write(`[memory] record downloaded agentId=${record.agentId}\n`);
  } catch (err) {
    process.stdout.write(`[memory] record download failed: ${err}\n`);
  }

  const rawAction = record?.action ?? {};
  const action: TradeAction = {
    type: String(rawAction.type ?? ''),
    pair: String(rawAction.pair ?? ''),
    amount: Number(rawAction.amount ?? 0),
    claimed_price: Number(rawAction.claimed_price ?? rawAction.price ?? 0),
    potential_loss: rawAction.potential_loss != null ? Number(rawAction.potential_loss) : undefined,
  };

  const oraclePrice =
    record?.inputs?.oracle_price != null
      ? Number(record.inputs.oracle_price)
      : action.claimed_price;

  const mandate = await fetchMandate(agentId);

  let history = await fetchHistory(agentId);
  if (!history) {
    process.stdout.write(`[memory] local KV miss, broadcasting REQ_HISTORY for ${agentId}\n`);
    history = await broadcastHistoryRequest(agentId);
    if (history) {
      process.stdout.write(`[memory] received history via AXL mesh entries=${history.length}\n`);
    } else {
      process.stdout.write(`[memory] history unavailable after broadcast timeout, defaulting to empty\n`);
      history = [];
    }
  }

  return {
    rootHash,
    agentId,
    action,
    mandate: mandate ?? {
      allowed_actions: [],
      allowed_pairs: [],
      max_single_trade: Number.MAX_SAFE_INTEGER,
      max_daily_drawdown: Number.MAX_SAFE_INTEGER,
      acceptable_slippage: 10_000,
    },
    oracle_price: oraclePrice,
    history,
  };
}

async function sendPackageToVerifier(pkg: DisputePackage): Promise<void> {
  try {
    const res = await fetch(`${VERIFIER_URL}/packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pkg),
    });
    if (res.ok) {
      process.stdout.write(`[memory] package delivered to verifier rootHash=${pkg.rootHash}\n`);
    } else {
      process.stdout.write(`[memory] verifier rejected package: ${res.status}\n`);
    }
  } catch (err) {
    process.stdout.write(`[memory] failed to deliver package: ${err}\n`);
  }
}

async function handlePropagateAttestation(body: PropagateMessage): Promise<void> {
  const key = `aegis:${body.agentId}:history`;
  const existing = await readKVObject<AgentHistory>(key).catch(() => null);

  const entry = { rootHash: body.rootHash, verdict: body.verdict, timestamp: body.timestamp };
  const history: AgentHistory = {
    agentId: body.agentId,
    entries: [...(existing?.entries ?? []), entry],
    lastUpdated: Date.now(),
  };
  await writeKVObject(key, history).catch(() => {});

  const reputation = await readKVObject<ReputationRecord>(
    `aegis:${body.agentId}:reputation`
  ).catch(() => null);

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

function watchDisputeEvents(): void {
  if (!process.env.AEGIS_COURT_ADDRESS || !process.env.ZG_RPC_URL) return;

  const court = new ethers.Contract(
    process.env.AEGIS_COURT_ADDRESS,
    AEGIS_COURT_ABI,
    getProvider()
  );

  court.on('DisputeFiled', async (rootHash: string, agentId: string) => {
    process.stdout.write(`[memory] DisputeFiled rootHash=${rootHash} agentId=${agentId}\n`);
    try {
      const pkg = await assembleDisputePackage(rootHash, agentId);
      await sendPackageToVerifier(pkg);
    } catch (err) {
      process.stdout.write(`[memory] dispute assembly error: ${err}\n`);
    }
  });

  court.on('DataResolved', async (rootHash: string, agentId: string) => {
    process.stdout.write(`[memory] DataResolved rootHash=${rootHash} agentId=${agentId}, re-assembling package\n`);
    try {
      const pkg = await assembleDisputePackage(rootHash, agentId);
      await sendPackageToVerifier(pkg);
    } catch (err) {
      process.stdout.write(`[memory] DataResolved re-assembly error: ${err}\n`);
    }
  });
}

watchDisputeEvents();

setInterval(async () => {
  const raw = await recv(AXL_BASE_URL).catch(() => []);
  const messages = Array.isArray(raw) ? raw : [];
  for (const msg of messages) {
    const body = msg.body as Record<string, unknown>;

    if (body.type === 'PROPAGATE_ATTESTATION') {
      await handlePropagateAttestation(body as unknown as PropagateMessage).catch(() => {});
    }

    if (body.type === 'RES_HISTORY') {
      for (const handler of axlMessageHandlers.values()) {
        handler(msg as { body: Record<string, unknown> });
      }
    }

    if (body.type === 'REQ_HISTORY') {
      const requestAgentId = String(body.agentId ?? '');
      const requestId = String(body.requestId ?? '');
      const fromPeerId = String(msg.fromPeerId ?? '');
      if (requestAgentId && requestId && fromPeerId) {
        const history = await fetchHistory(requestAgentId).catch(() => null);
        if (history) {
          send(AXL_BASE_URL, fromPeerId, {
            type: 'RES_HISTORY',
            requestId,
            entries: history,
          }).catch(() => {});
        }
      }
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
