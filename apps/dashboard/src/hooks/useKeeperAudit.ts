import { useQuery } from '@tanstack/react-query';
import { fetchKeeperAudit } from '../lib/orchestratorApi';
import { useDemoMode } from './useDemoMode';
import { demoWorkflowRuns } from '../lib/demoData';
import type { WorkflowRun } from '@aegis/types';

export function useKeeperAudit(workflowId: string | null, limit?: number) {
  const { enabled } = useDemoMode();

  return useQuery<WorkflowRun[]>({
    queryKey: ['keeper-audit', workflowId, limit],
    queryFn: () => fetchKeeperAudit(workflowId!, limit),
    enabled: !enabled && !!workflowId,
    placeholderData: enabled ? demoWorkflowRuns : undefined,
  });
}
