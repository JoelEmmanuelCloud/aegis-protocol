import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { fetchAgentsByOwner } from '../lib/orchestratorApi';
import { useDemoMode } from '../context/DemoContext';
import { demoAgent } from '../lib/demoData';
import type { AgentRecord } from '@aegis/types';

export function useMyAgents() {
  const { address } = useAccount();
  const { isDemoMode } = useDemoMode();
  return useQuery<AgentRecord[]>({
    queryKey: ['my-agents', isDemoMode ? 'demo' : address],
    queryFn: isDemoMode
      ? () => Promise.resolve([demoAgent])
      : () => fetchAgentsByOwner(address!),
    enabled: isDemoMode ? true : !!address,
    staleTime: 30_000,
  });
}
