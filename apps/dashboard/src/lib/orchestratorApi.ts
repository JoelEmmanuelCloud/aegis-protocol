import type {
  AgentRecord,
  AttestationListResponse,
  FileDisputeResponse,
  DisputeRecord,
  NetworkStats,
  WorkflowRun,
} from '@aegis/types';

function baseUrl(): string {
  return import.meta.env.VITE_ORCHESTRATOR_URL ?? 'http://localhost:3000';
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export function fetchAgent(label: string): Promise<AgentRecord> {
  return apiFetch<AgentRecord>(`/agents/label/${encodeURIComponent(label)}`);
}

export function fetchAgentsByOwner(address: string): Promise<AgentRecord[]> {
  return apiFetch<AgentRecord[]>(`/agents/owner/${encodeURIComponent(address)}`);
}

export function fetchAttestations(
  agentId: string,
  cursor?: string,
  limit?: number,
): Promise<AttestationListResponse> {
  const params = new URLSearchParams({ agentId });
  if (cursor) params.set('cursor', cursor);
  if (limit !== undefined) params.set('limit', String(limit));
  return apiFetch<AttestationListResponse>(`/attestations?${params}`);
}

export function fileDispute(body: {
  rootHash: string;
  agentId: string;
  reason: string;
}): Promise<FileDisputeResponse> {
  return apiFetch<FileDisputeResponse>('/disputes', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function fetchDisputeStatus(rootHash: string): Promise<DisputeRecord> {
  return apiFetch<DisputeRecord>(`/disputes/${encodeURIComponent(rootHash)}`);
}

export function fetchNetworkStats(): Promise<NetworkStats> {
  return apiFetch<NetworkStats>('/network/stats');
}

export function fetchKeeperAudit(workflowId: string, limit?: number): Promise<WorkflowRun[]> {
  const params = new URLSearchParams({ workflowId });
  if (limit !== undefined) params.set('limit', String(limit));
  return apiFetch<WorkflowRun[]>(`/keeperhub/audit?${params}`);
}
