import { useQuery } from '@tanstack/react-query';
import { fetchKeeperAudit } from '../lib/orchestratorApi';
import type { WorkflowRun } from '@aegis/types';

export function useKeeperAudit(workflowId: string | null, limit?: number) {
  return useQuery<WorkflowRun[]>({
    queryKey: ['keeper-audit', workflowId, limit],
    queryFn: () => fetchKeeperAudit(workflowId!, limit),
    enabled: !!workflowId,
  });
}
