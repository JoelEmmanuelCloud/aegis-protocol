import { useQuery } from '@tanstack/react-query';
import { fetchNetworkStats } from '../lib/orchestratorApi';
import { useDemoMode } from '../context/DemoContext';
import { demoNetworkStats } from '../lib/demoData';
import type { NetworkStats } from '@aegis/types';

export function useNetworkStats() {
  const { isDemoMode } = useDemoMode();
  return useQuery<NetworkStats>({
    queryKey: ['network-stats', isDemoMode],
    queryFn: isDemoMode ? () => Promise.resolve(demoNetworkStats) : fetchNetworkStats,
    refetchInterval: isDemoMode ? false : 15_000,
    staleTime: isDemoMode ? Infinity : 0,
  });
}
