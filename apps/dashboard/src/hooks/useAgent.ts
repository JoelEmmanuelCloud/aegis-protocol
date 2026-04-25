import { useQuery } from '@tanstack/react-query';
import { fetchAgent } from '../lib/orchestratorApi';
import { useDemoMode } from '../context/DemoContext';
import { demoAgent } from '../lib/demoData';
import type { AgentRecord } from '@aegis/types';

export function useAgent(label: string | null) {
  const { isDemoMode } = useDemoMode();
  return useQuery<AgentRecord>({
    queryKey: ['agent', isDemoMode ? 'demo' : label],
    queryFn: isDemoMode ? () => Promise.resolve(demoAgent) : () => fetchAgent(label!),
    enabled: isDemoMode ? !!label : !!label,
    staleTime: isDemoMode ? Infinity : 0,
  });
}
