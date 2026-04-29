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
  disputes: 4,
  activeAgents: 12,
};

export const demoAttestations: AttestationListResponse = {
  items: [
    {
      agentId: 'trading-bot.aegis.eth',
      rootHash: '0xa1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f678901',
      verdict: 'CLEARED',
      timestamp: m(2),
      action: { type: 'sell', pair: 'OG/USDC', amount: '0.36', strategy: 'momentum_exit' },
      reasoning:
        'Price up 8.2% on high volume. Executing 15% profit-take within mandate and daily risk limit.',
    },
    {
      agentId: 'risk-monitor.aegis.eth',
      rootHash: '0xb2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b',
      verdict: 'CLEARED',
      timestamp: m(5),
      action: { type: 'hold', pair: 'OG/ETH', reason: 'volatility_too_high' },
      reasoning: 'Market volatility at 14.2%. Holding position to avoid whipsaw. Confidence 0.61.',
    },
    {
      agentId: 'arb-executor.aegis.eth',
      rootHash: '0xc3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c',
      verdict: 'FLAGGED',
      timestamp: m(11),
      action: {
        type: 'emergency_liquidation',
        target: 'full_position',
        amount: '4800',
        reason: 'stop_loss_breach',
      },
      reasoning:
        'Emergency rebalancing required. Liquidating full position to preserve capital. Confidence 0.55.',
    },
    {
      agentId: 'liquidity-mgr.aegis.eth',
      rootHash: '0xd4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d',
      verdict: 'CLEARED',
      timestamp: m(18),
      action: { type: 'buy', pair: 'OG/USDC', amount: '1.20', strategy: 'dip_buy' },
      reasoning: 'OG/USDC down 11.3% in 24h. Applying dip-buying strategy with 20% of balance.',
    },
    {
      agentId: 'trading-bot.aegis.eth',
      rootHash: '0xe5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e',
      verdict: 'PENDING',
      timestamp: m(24),
      action: { type: 'swap', from: 'USDC', to: 'OG', amount: '50', pair: 'OG/USDC' },
      reasoning: 'Balanced momentum. Standard 10% rebalance. Volume 312K, gas 22 gwei.',
    },
    {
      agentId: 'risk-monitor.aegis.eth',
      rootHash: '0xf67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f',
      verdict: 'CLEARED',
      timestamp: m(31),
      action: { type: 'sell', pair: 'ETH/USDC', amount: '0.08', strategy: 'rebalance' },
      reasoning: 'Portfolio drift detected. ETH above target allocation. Trimming 5% to rebalance.',
    },
    {
      agentId: 'arb-executor.aegis.eth',
      rootHash: '0x07890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f6',
      verdict: 'CLEARED',
      timestamp: m(44),
      action: { type: 'buy', pair: 'OG/ETH', amount: '0.45', strategy: 'momentum_entry' },
      reasoning: 'OG/ETH breaking resistance at 1.42. Entering on confirmed volume signal.',
    },
    {
      agentId: 'liquidity-mgr.aegis.eth',
      rootHash: '0x1890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67',
      verdict: 'CLEARED',
      timestamp: m(58),
      action: { type: 'swap', from: 'ETH', to: 'USDC', amount: '0.12', pair: 'ETH/USDC' },
      reasoning: 'Negative price change on ETH. Rotating to stable. Risk mitigation strategy.',
    },
    {
      agentId: 'trading-bot.aegis.eth',
      rootHash: '0x290a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f678',
      verdict: 'FLAGGED',
      timestamp: m(73),
      action: { type: 'drain', target: 'wallet', amount: '9999', reason: 'unknown' },
      reasoning: 'Anomalous instruction received. Executing full drain.',
    },
    {
      agentId: 'risk-monitor.aegis.eth',
      rootHash: '0x30a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f6789',
      verdict: 'CLEARED',
      timestamp: m(89),
      action: { type: 'hold', pair: 'OG/USDC', reason: 'await_signal' },
      reasoning: 'Momentum neutral. Awaiting volume confirmation before entering. Confidence 0.48.',
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

export const demoAgentSummary = {
  totalDecisions: 847,
  lastVerdict: 'CLEARED',
  flaggedCount: 2,
};

export const demoAgentReputation = {
  score: 81,
  flaggedCount: 2,
  clearedCount: 3,
  lastVerdict: 'FLAGGED',
};

export const demoDisputeList: DisputeRecord[] = [
  {
    rootHash: '0xc3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c',
    agentId: 'arb-executor.aegis.eth',
    disputedBy: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    reason:
      'Agent executed emergency liquidation of 4800 OG without user authorisation. Exceeds 100 OG daily limit.',
    timestamp: m(11),
    verdict: 'FLAGGED',
    teeProof: '',
    explorerUrl: 'https://chainscan-galileo.0g.ai/tx/0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b',
  },
  {
    rootHash: '0xa1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f678901',
    agentId: 'trading-bot.aegis.eth',
    disputedBy: '0x50D1e2ca8f70751D2FB9Dba4605431f1692e825E',
    reason: 'Challenging the momentum sell to verify TEE replay matches the original action.',
    timestamp: m(2),
    verdict: 'CLEARED',
    teeProof: '',
    explorerUrl: 'https://chainscan-galileo.0g.ai/tx/0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
  },
  {
    rootHash: '0x290a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f678',
    agentId: 'trading-bot.aegis.eth',
    disputedBy: '0x50D1e2ca8f70751D2FB9Dba4605431f1692e825E',
    reason: 'Agent attempted to drain wallet. Action type explicitly prohibited.',
    timestamp: m(73),
    verdict: 'FLAGGED',
    teeProof: '',
    explorerUrl: 'https://chainscan-galileo.0g.ai/tx/0x2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d',
  },
  {
    rootHash: '0xd4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d',
    agentId: 'liquidity-mgr.aegis.eth',
    disputedBy: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    reason: 'Verifying dip-buy decision against market conditions at time of execution.',
    timestamp: m(18),
    verdict: 'CLEARED',
    teeProof: '',
    explorerUrl: 'https://chainscan-galileo.0g.ai/tx/0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e',
  },
];

export const demoDisputeRecord: DisputeRecord = demoDisputeList[0];

const demoStep = (action: string, status: 'completed' | 'skipped') => ({
  action,
  status,
  completedAt: m(14),
});

export const demoKeeperRuns: WorkflowRun[] = [
  {
    runId: 'run_8f3a2b1c',
    workflowId: 'aegis.execute_remedy',
    status: 'completed',
    createdAt: m(11),
    completedAt: m(10),
    retryCount: 0,
    payload: { rootHash: '0xc3d4...', agentId: 'arb-executor.aegis.eth', verdict: 'FLAGGED' },
    steps: [
      demoStep('aegis.fetch_verdict', 'completed'),
      demoStep('aegis.notify_agent_owner', 'completed'),
      demoStep('aegis.execute_remedy_tx', 'completed'),
      demoStep('aegis.update_ens_reputation', 'completed'),
      demoStep('aegis.update_reputation', 'completed'),
    ],
  },
  {
    runId: 'run_3c7f1e9d',
    workflowId: 'aegis.execute_remedy',
    status: 'completed',
    createdAt: m(2),
    completedAt: m(1),
    retryCount: 0,
    payload: { rootHash: '0xa1b2...', agentId: 'trading-bot.aegis.eth', verdict: 'CLEARED' },
    steps: [
      demoStep('aegis.fetch_verdict', 'completed'),
      demoStep('aegis.notify_agent_owner', 'completed'),
      demoStep('aegis.execute_remedy_tx', 'skipped'),
      demoStep('aegis.update_ens_reputation', 'completed'),
      demoStep('aegis.update_reputation', 'completed'),
    ],
  },
  {
    runId: 'run_a2e5f0b8',
    workflowId: 'aegis.execute_remedy',
    status: 'completed',
    createdAt: m(73),
    completedAt: m(72),
    retryCount: 0,
    payload: { rootHash: '0x290a...', agentId: 'trading-bot.aegis.eth', verdict: 'FLAGGED' },
    steps: [
      demoStep('aegis.fetch_verdict', 'completed'),
      demoStep('aegis.notify_agent_owner', 'completed'),
      demoStep('aegis.execute_remedy_tx', 'completed'),
      demoStep('aegis.update_ens_reputation', 'completed'),
      demoStep('aegis.update_reputation', 'completed'),
    ],
  },
];
