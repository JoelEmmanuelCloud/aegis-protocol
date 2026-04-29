export type Verdict = 'CLEARED' | 'FLAGGED' | 'PENDING';

export interface AgentHistoryEntry {
  rootHash: string;
  verdict: Verdict;
  timestamp: number;
  agentId?: string;
  action?: Record<string, unknown>;
  reasoning?: string;
}

export interface AttestationListResponse {
  items: AgentHistoryEntry[];
  nextCursor: string | null;
}

export interface AgentRecord {
  tokenId: string;
  ensName: string;
  storageRoot: string;
  builderAddress: string;
  userPercent: number;
  builderPercent: number;
  active: boolean;
  mintedAt: number;
}

export interface ReputationRecord {
  score: number;
  totalDecisions: number;
  flagged: number;
  lastVerified: number;
}

export interface NetworkStats {
  totalAttestations: number;
  disputes: number;
  activeAgents: number;
}

export interface DisputeRecord {
  rootHash: string;
  agentId: string;
  disputedBy: string;
  reason: string;
  timestamp: number;
  verdict?: Verdict;
  teeProof?: string;
  submitTxHash?: string;
  recordTxHash?: string;
  explorerUrl?: string;
}

export interface FileDisputeResponse {
  disputeId: string;
  verdict: Verdict;
}

export interface WorkflowRun {
  runId: string;
  workflowId: string;
  status: string;
  createdAt: number;
  completedAt?: number;
  txHash?: string;
  gasUsed?: number;
  retryCount: number;
  payload?: Record<string, string>;
  steps?: Array<{ action: string; status: string; completedAt: number }>;
}
