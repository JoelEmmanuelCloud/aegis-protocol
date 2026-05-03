import { randomUUID } from 'crypto';
import { ethers } from 'ethers';
import type { Verdict } from '@aegis/types';

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
  payload?: Record<string, unknown>;
  steps?: Array<{
    action: string;
    status: 'completed' | 'skipped' | 'failed';
    completedAt: number;
  }>;
}

const AGENT_REGISTRY_ABI = [
  'function getTokenByEnsLabel(string label) view returns (uint256)',
  'function suspendAgent(uint256 tokenId)',
];

const runs: WorkflowRun[] = [];

const REMEDY_STEPS: WorkflowStep[] = [
  { action: 'aegis.fetch_verdict' },
  { action: 'aegis.notify_agent_owner' },
  { action: 'aegis.execute_remedy_tx', if: 'verdict===FLAGGED' },
  { action: 'aegis.update_ens_reputation' },
  { action: 'aegis.update_reputation' },
];

async function executeSuspend(agentId: string): Promise<string> {
  const provider = new ethers.JsonRpcProvider(process.env.ZG_RPC_URL!);
  const signer = new ethers.Wallet(process.env.ZG_PRIVATE_KEY!, provider);
  const registry = new ethers.Contract(
    process.env.AGENT_REGISTRY_ADDRESS!,
    AGENT_REGISTRY_ABI,
    signer
  );

  const label = agentId.replace(/\.aegis\.eth$/, '');
  const tokenId: bigint = await registry.getTokenByEnsLabel(label);
  if (tokenId === 0n) throw new Error(`agent not found: ${agentId}`);

  const tx: ethers.TransactionResponse = await registry.suspendAgent(tokenId);
  const receipt = await tx.wait();
  if (!receipt) throw new Error('transaction receipt null');
  return receipt.hash;
}

async function executeStep(
  step: WorkflowStep,
  payload: { rootHash: string; agentId: string; verdict: Verdict }
): Promise<{ status: 'completed' | 'skipped' | 'failed'; txHash?: string }> {
  if (step.if) {
    const parts = step.if.split('===');
    const key = parts[0]?.trim() ?? '';
    const value = parts[1]?.trim() ?? '';
    const payloadVal = (payload as unknown as Record<string, string>)[key];
    if (payloadVal !== value) return { status: 'skipped' };
  }

  if (step.action === 'aegis.execute_remedy_tx') {
    const txHash = await executeSuspend(payload.agentId);
    return { status: 'completed', txHash };
  }

  return { status: 'completed' };
}

async function executeWorkflow(
  run: WorkflowRun,
  steps: WorkflowStep[],
  payload: { rootHash: string; agentId: string; verdict: Verdict }
): Promise<void> {
  const executedSteps: NonNullable<WorkflowRun['steps']> = [];

  for (const step of steps) {
    const result = await executeStep(step, payload).catch(() => ({ status: 'failed' as const, txHash: undefined }));
    executedSteps.push({ action: step.action, status: result.status, completedAt: Date.now() });
    if (result.txHash) run.txHash = result.txHash;
    if (result.status === 'failed') {
      run.status = 'failed';
      run.completedAt = Date.now();
      run.steps = executedSteps;
      return;
    }
  }

  run.status = 'completed';
  run.completedAt = Date.now();
  run.steps = executedSteps;
}

export async function createWorkflow(definition: WorkflowDefinition): Promise<string> {
  return definition.name;
}

export async function triggerWorkflow(
  workflowId: string,
  payload: { rootHash: string; agentId: string; verdict: Verdict }
): Promise<string> {
  const runId = randomUUID();
  const run: WorkflowRun = {
    runId,
    workflowId,
    status: 'running',
    createdAt: Date.now(),
    retryCount: 0,
    payload: payload as unknown as Record<string, unknown>,
  };
  runs.unshift(run);
  if (runs.length > 200) runs.pop();

  void executeWorkflow(run, REMEDY_STEPS, payload);

  return runId;
}

export async function getWorkflowRun(runId: string): Promise<WorkflowRun> {
  const run = runs.find((r) => r.runId === runId);
  if (!run) throw new Error(`Run not found: ${runId}`);
  return run;
}

export async function getAuditTrail(workflowId: string, limit = 20): Promise<WorkflowRun[]> {
  return runs.filter((r) => r.workflowId === workflowId).slice(0, limit);
}

export async function ensureRemedyWorkflow(): Promise<string> {
  return process.env.KEEPERHUB_WORKFLOW_ID ?? 'aegis.execute_remedy';
}
