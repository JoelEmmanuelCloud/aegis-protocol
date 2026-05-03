export type Verdict = 'PENDING' | 'CLEARED' | 'FLAGGED' | 'PENDING_DATA';

export interface AgentMandate {
  allowed_actions: string[];
  allowed_pairs: string[];
  max_single_trade: number;
  max_daily_drawdown: number;
  acceptable_slippage: number;
}

export interface TradeAction {
  type: string;
  pair: string;
  amount: number;
  claimed_price: number;
  potential_loss?: number;
}

export interface HistoryEntry {
  rootHash: string;
  action: TradeAction;
  timestamp: number;
  verdict: Verdict;
}

export interface DisputePackage {
  rootHash: string;
  agentId: string;
  action: TradeAction;
  mandate: AgentMandate;
  oracle_price: number;
  history: HistoryEntry[] | null;
  block_number?: number;
}

export interface DecisionRecord {
  agentId: string;
  inputs: Record<string, unknown>;
  reasoning: string;
  action: Record<string, unknown>;
  teeProof?: string;
  verdict: Verdict;
  attestedBy: string;
  timestamp: number;
  rootHash?: string;
}

export interface AttestationRequest {
  type: 'ATTEST_DECISION';
  agentId: string;
  inputs: Record<string, unknown>;
  reasoning: string;
  action: Record<string, unknown>;
  timestamp: number;
}

export interface AttestationResponse {
  rootHash: string;
  status: 'COMMITTED';
}

export interface VerifyRequest {
  type: 'VERIFY_DECISION';
  rootHash: string;
  agentId: string;
}

export interface VerifyResponse {
  verdict: Verdict;
  teeProof: string;
  rootHash: string;
}

export interface PropagateMessage {
  type: 'PROPAGATE_ATTESTATION';
  rootHash: string;
  agentId: string;
  verdict: Verdict;
  timestamp: number;
  [key: string]: unknown;
}

export interface ReputationRecord {
  score: number;
  totalDecisions: number;
  flagged: number;
  lastVerified: number;
}

export interface LatestRecord {
  rootHash: string;
  timestamp: number;
  verdict: Verdict;
}

export interface NetworkStats {
  totalAttestations: number;
  disputes: number;
  activeAgents: number;
}

export interface AgentRegistration {
  ensName: string;
  agentAddress: string;
  ownerAddress: string;
  userSplit: number;
  builderSplit: number;
  iNFTAddress?: string;
  registeredAt: number;
}

export interface AXLEnvelope {
  fromPeerId: string;
  body: unknown;
}

export interface AttestationItem {
  agentId: string;
  rootHash: string;
  verdict: Verdict;
  timestamp: number;
  inputs?: Record<string, unknown>;
  action?: Record<string, unknown>;
  reasoning?: string;
}

export interface AttestationListResponse {
  items: AttestationItem[];
  nextCursor: string | null;
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
