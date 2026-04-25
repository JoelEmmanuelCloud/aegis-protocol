import type {
  NetworkStats,
  AttestationListResponse,
  AgentRecord,
  WorkflowRun,
  DisputeRecord,
} from '@aegis/types';

const now = Date.now();
const m = (n: number) => now - n * 60_000;

export const DEMO_AGENT_LABEL = 'trading-bot';

export const demoNetworkStats: NetworkStats = {
  totalAttestations: 1_247,
  disputes: 3,
  activeAgents: 12,
};

export const demoAttestations: AttestationListResponse = {
  items: [
    {
      agentId: 'trading-bot',
      rootHash: '0xa1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f678901',
      verdict: 'CLEARED',
      timestamp: m(2),
    },
    {
      agentId: 'risk-monitor',
      rootHash: '0xb2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b',
      verdict: 'CLEARED',
      timestamp: m(5),
    },
    {
      agentId: 'arb-executor',
      rootHash: '0xc3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c',
      verdict: 'FLAGGED',
      timestamp: m(11),
    },
    {
      agentId: 'liquidity-mgr',
      rootHash: '0xd4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d',
      verdict: 'CLEARED',
      timestamp: m(18),
    },
    {
      agentId: 'rebalancer',
      rootHash: '0xe5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e',
      verdict: 'PENDING',
      timestamp: m(24),
    },
    {
      agentId: 'trading-bot',
      rootHash: '0xf67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f',
      verdict: 'CLEARED',
      timestamp: m(31),
    },
    {
      agentId: 'risk-monitor',
      rootHash: '0x07890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f6',
      verdict: 'CLEARED',
      timestamp: m(44),
    },
    {
      agentId: 'arb-executor',
      rootHash: '0x1890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67',
      verdict: 'CLEARED',
      timestamp: m(58),
    },
    {
      agentId: 'liquidity-mgr',
      rootHash: '0x290a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f678',
      verdict: 'FLAGGED',
      timestamp: m(73),
    },
    {
      agentId: 'rebalancer',
      rootHash: '0x30a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f6789',
      verdict: 'CLEARED',
      timestamp: m(89),
    },
    {
      agentId: 'trading-bot',
      rootHash: '0x4a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890',
      verdict: 'CLEARED',
      timestamp: m(102),
    },
    {
      agentId: 'risk-monitor',
      rootHash: '0x5b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1',
      verdict: 'PENDING',
      timestamp: m(118),
    },
  ],
  nextCursor: null,
};

export const demoAgent: AgentRecord = {
  tokenId: '42',
  ensName: 'trading-bot.aegis.eth',
  storageRoot: '0x7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f',
  builderAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  userPercent: 65,
  builderPercent: 35,
  active: true,
  mintedAt: 1_714_000_000,
};

export const demoKeeperRuns: WorkflowRun[] = [
  {
    runId: 'run_8f3a2b1c',
    workflowId: 'aegis.execute_remedy',
    status: 'completed',
    createdAt: m(15),
    completedAt: m(14),
    txHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    gasUsed: 142_500,
    retryCount: 0,
  },
  {
    runId: 'run_3c7f1e9d',
    workflowId: 'aegis.execute_remedy',
    status: 'completed',
    createdAt: m(73),
    completedAt: m(72),
    txHash: '0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c',
    gasUsed: 138_200,
    retryCount: 0,
  },
  {
    runId: 'run_a2e5f0b8',
    workflowId: 'aegis.execute_remedy',
    status: 'failed',
    createdAt: m(240),
    completedAt: m(238),
    txHash: undefined,
    gasUsed: undefined,
    retryCount: 2,
  },
];

export const demoDisputeRecord: DisputeRecord = {
  rootHash: '0xc3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c',
  agentId: 'arb-executor',
  disputedBy: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  reason: 'Agent executed trade outside permitted slippage bounds (3.8% vs 1% limit)',
  timestamp: m(11),
  verdict: 'FLAGGED',
  teeProof:
    '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f',
};
