export type Verdict = 'PENDING' | 'CLEARED' | 'FLAGGED';

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

export interface DisputeRecord {
  rootHash: string;
  agentId: string;
  disputedBy: string;
  reason: string;
  timestamp: number;
  verdict?: Verdict;
  teeProof?: string;
}
