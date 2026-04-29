import { randomUUID } from 'crypto';
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

const runs: WorkflowRun[] = [];

const REMEDY_STEPS: WorkflowStep[] = [
  { action: 'aegis.fetch_verdict' },
  { action: 'aegis.notify_agent_owner' },
  { action: 'aegis.execute_remedy_tx', if: 'verdict===FLAGGED' },
  { action: 'aegis.update_ens_reputation' },
  { action: 'aegis.update_reputation' },
];

async function executeStep(
  step: WorkflowStep,
  payload: { rootHash: string; agentId: string; verdict: Verdict }
): Promise<{ status: 'completed' | 'skipped' | 'failed' }> {
  if (step.if) {
    const parts = step.if.split('===');
    const key = parts[0]?.trim() ?? '';
    const value = parts[1]?.trim() ?? '';
    const payloadVal = (payload as unknown as Record<string, string>)[key];
    if (payloadVal !== value) return { status: 'skipped' };
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
    const result = await executeStep(step, payload).catch(() => ({ status: 'failed' as const }));
    executedSteps.push({ action: step.action, status: result.status, completedAt: Date.now() });
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
