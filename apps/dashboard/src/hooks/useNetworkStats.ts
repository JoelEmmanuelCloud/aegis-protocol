import { useQuery } from '@tanstack/react-query';
import { fetchNetworkStats } from '../lib/orchestratorApi';
import type { NetworkStats } from '@aegis/types';

export function useNetworkStats() {
  return useQuery<NetworkStats>({
    queryKey: ['network-stats'],
    queryFn: fetchNetworkStats,
    refetchInterval: 15_000,
  });
}
