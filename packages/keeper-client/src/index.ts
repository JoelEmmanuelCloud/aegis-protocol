import type { Verdict } from '@aegis/types';

const BASE_URL = 'https://api.keeperhub.com/v1';

function authHeader(): Record<string, string> {
  return { Authorization: `Bearer ${process.env.KEEPERHUB_API_KEY!}` };
}

export interface WorkflowStep {
  action: string;
  if?: string;
}

export interface WorkflowDefinition {
  name: string;
  trigger: string;
  steps: WorkflowStep[];
}

export interface WorkflowRun {
  runId: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: number;
  completedAt?: number;
  txHash?: string;
  gasUsed?: number;
  retryCount: number;
}

export async function createWorkflow(definition: WorkflowDefinition): Promise<string> {
  const res = await fetch(`${BASE_URL}/workflows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(definition),
  });
  if (!res.ok) throw new Error(`KeeperHub createWorkflow failed: ${res.status}`);
  const data = (await res.json()) as { workflowId: string };
  return data.workflowId;
}

export async function triggerWorkflow(
  workflowId: string,
  payload: { rootHash: string; agentId: string; verdict: Verdict }
): Promise<string> {
  const res = await fetch(`${BASE_URL}/workflows/${workflowId}/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`KeeperHub trigger failed: ${res.status}`);
  const data = (await res.json()) as { runId: string };
  return data.runId;
}

export async function getWorkflowRun(runId: string): Promise<WorkflowRun> {
  const res = await fetch(`${BASE_URL}/runs/${runId}`, { headers: authHeader() });
  if (!res.ok) throw new Error(`KeeperHub getWorkflowRun failed: ${res.status}`);
  return res.json() as Promise<WorkflowRun>;
}

export async function getAuditTrail(workflowId: string, limit = 20): Promise<WorkflowRun[]> {
  const res = await fetch(`${BASE_URL}/workflows/${workflowId}/runs?limit=${limit}`, {
    headers: authHeader(),
  });
  if (!res.ok) throw new Error(`KeeperHub getAuditTrail failed: ${res.status}`);
  const data = (await res.json()) as { runs: WorkflowRun[] };
  return data.runs;
}

export async function ensureRemedyWorkflow(): Promise<string> {
  const existing = process.env.KEEPERHUB_WORKFLOW_ID;
  if (existing) return existing;

  return createWorkflow({
    name: 'aegis.execute_remedy',
    trigger: 'onchain:AegisCourtVerdictEmitted',
    steps: [
      { action: 'aegis.fetch_verdict' },
      { action: 'aegis.notify_agent_owner' },
      { action: 'aegis.execute_remedy_tx', if: 'verdict===FLAGGED' },
      { action: 'aegis.update_ens_reputation' },
      { action: 'aegis.update_reputation' },
    ],
  });
}
