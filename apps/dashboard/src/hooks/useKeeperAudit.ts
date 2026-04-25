import { useQuery } from '@tanstack/react-query';
import { fetchKeeperAudit } from '../lib/orchestratorApi';
import { useDemoMode } from '../context/DemoContext';
import { demoKeeperRuns } from '../lib/demoData';
import type { WorkflowRun } from '@aegis/types';

export function useKeeperAudit(workflowId: string | null, limit?: number) {
  const { isDemoMode } = useDemoMode();
  return useQuery<WorkflowRun[]>({
    queryKey: ['keeper-audit', isDemoMode ? 'demo' : workflowId, limit],
    queryFn: isDemoMode ? () => Promise.resolve(demoKeeperRuns) : () => fetchKeeperAudit(workflowId!, limit),
    enabled: isDemoMode || !!workflowId,
    staleTime: isDemoMode ? Infinity : 0,
  });
}
