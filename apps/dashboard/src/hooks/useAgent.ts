import { useQuery } from '@tanstack/react-query';
import { fetchAgent } from '../lib/orchestratorApi';
import { useDemoMode } from './useDemoMode';
import { demoAgents } from '../lib/demoData';
import type { AgentRecord } from '@aegis/types';

export function useAgent(label: string | null) {
  const { enabled } = useDemoMode();

  return useQuery<AgentRecord>({
    queryKey: ['agent', label],
    queryFn: () => fetchAgent(label!),
    enabled: !enabled && !!label,
    placeholderData: enabled && label ? demoAgents[0] : undefined,
  });
}
