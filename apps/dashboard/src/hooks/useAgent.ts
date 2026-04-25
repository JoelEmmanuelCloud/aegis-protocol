import { useQuery } from '@tanstack/react-query';
import { fetchAgent } from '../lib/orchestratorApi';
import type { AgentRecord } from '@aegis/types';

export function useAgent(label: string | null) {
  return useQuery<AgentRecord>({
    queryKey: ['agent', label],
    queryFn: () => fetchAgent(label!),
    enabled: !!label,
  });
}
