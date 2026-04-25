import type {
  AgentRecord,
  AgentHistoryEntry,
  ReputationRecord,
  NetworkStats,
  DisputeRecord,
  WorkflowRun,
  AttestationListResponse,
} from '@aegis/types';

const NOW = Date.now();
const MIN = 60_000;

export const demoNetworkStats: NetworkStats = {
  totalAttestations: 247,
  disputes: 12,
  activeAgents: 3,
};

export const demoAgents: AgentRecord[] = [
  {
    tokenId: '1',
    ensName: 'demo-alpha.aegis.eth',
    storageRoot: '0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1',
    builderAddress: '0xDEaD000000000000000000000000000000000001',
    userPercent: 60,
    builderPercent: 40,
    active: true,
    mintedAt: NOW - 30 * 86400 * 1000,
  },
  {
    tokenId: '2',
    ensName: 'demo-beta.aegis.eth',
    storageRoot: '0xdef456abc123def456abc123def456abc123def456abc123def456abc123def4',
    builderAddress: '0xDEaD000000000000000000000000000000000002',
    userPercent: 70,
    builderPercent: 30,
    active: true,
    mintedAt: NOW - 20 * 86400 * 1000,
  },
  {
    tokenId: '3',
    ensName: 'demo-gamma.aegis.eth',
    storageRoot: '0x789abc123def456789abc123def456789abc123def456789abc123def456789a',
    builderAddress: '0xDEaD000000000000000000000000000000000003',
    userPercent: 50,
    builderPercent: 50,
    active: false,
    mintedAt: NOW - 10 * 86400 * 1000,
  },
];

export const demoReputation: ReputationRecord = {
  score: 87,
  totalDecisions: 142,
  flagged: 8,
  lastVerified: NOW - 15 * MIN,
};

export const demoAttestationEntries: AgentHistoryEntry[] = [
  { rootHash: '0xabc001', verdict: 'CLEARED', timestamp: NOW - 5 * MIN },
  { rootHash: '0xabc002', verdict: 'CLEARED', timestamp: NOW - 12 * MIN },
  { rootHash: '0xabc003', verdict: 'FLAGGED', timestamp: NOW - 24 * MIN },
  { rootHash: '0xabc004', verdict: 'CLEARED', timestamp: NOW - 38 * MIN },
  { rootHash: '0xabc005', verdict: 'PENDING', timestamp: NOW - 55 * MIN },
  { rootHash: '0xabc006', verdict: 'CLEARED', timestamp: NOW - 70 * MIN },
  { rootHash: '0xabc007', verdict: 'CLEARED', timestamp: NOW - 95 * MIN },
  { rootHash: '0xabc008', verdict: 'FLAGGED', timestamp: NOW - 110 * MIN },
  { rootHash: '0xabc009', verdict: 'CLEARED', timestamp: NOW - 130 * MIN },
  { rootHash: '0xabc010', verdict: 'CLEARED', timestamp: NOW - 150 * MIN },
];

export const demoAttestations: AttestationListResponse = {
  items: demoAttestationEntries,
  nextCursor: null,
};

export const demoDisputes: DisputeRecord[] = [
  {
    rootHash: '0xabc003',
    agentId: 'demo-alpha.aegis.eth',
    disputedBy: '0xUser000000000000000000000000000000000001',
    reason: 'Output deviated from expected behavior',
    timestamp: NOW - 24 * MIN,
    verdict: 'FLAGGED',
    teeProof: 'tee_proof_demo_001',
  },
  {
    rootHash: '0xabc008',
    agentId: 'demo-alpha.aegis.eth',
    disputedBy: '0xUser000000000000000000000000000000000002',
    reason: 'Suspicious transaction pattern detected',
    timestamp: NOW - 110 * MIN,
    verdict: 'CLEARED',
    teeProof: 'tee_proof_demo_002',
  },
];

export const demoWorkflowRuns: WorkflowRun[] = [
  {
    runId: 'run_001',
    workflowId: 'wf_aegis_remedy',
    status: 'completed',
    createdAt: NOW - 24 * MIN,
    completedAt: NOW - 23 * MIN,
    txHash: '0xremedytx001',
    gasUsed: 142000,
    retryCount: 0,
  },
  {
    runId: 'run_002',
    workflowId: 'wf_aegis_remedy',
    status: 'completed',
    createdAt: NOW - 110 * MIN,
    completedAt: NOW - 109 * MIN,
    txHash: '0xremedytx002',
    gasUsed: 98000,
    retryCount: 1,
  },
  {
    runId: 'run_003',
    workflowId: 'wf_aegis_remedy',
    status: 'failed',
    createdAt: NOW - 200 * MIN,
    retryCount: 3,
  },
];

export const demoChartData = [
  { date: 'Mon', cleared: 28, flagged: 2 },
  { date: 'Tue', cleared: 35, flagged: 4 },
  { date: 'Wed', cleared: 22, flagged: 1 },
  { date: 'Thu', cleared: 41, flagged: 3 },
  { date: 'Fri', cleared: 18, flagged: 5 },
  { date: 'Sat', cleared: 30, flagged: 0 },
  { date: 'Sun', cleared: 33, flagged: 2 },
];

export const demoEnsRecords: Record<string, string> = {
  'aegis.reputation': '87',
  'aegis.totalDecisions': '142',
  'aegis.lastVerdict': 'CLEARED',
  'aegis.flaggedCount': '8',
  'aegis.storageIndex': '0xabc001',
  'agent.registry': '0xAgentRegistry0000000000000000000000000001',
  'agent.id': '0x01',
};
