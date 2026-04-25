import { useQuery } from '@tanstack/react-query';
import { fetchNetworkStats } from '../lib/orchestratorApi';
import { useDemoMode } from './useDemoMode';
import { demoNetworkStats } from '../lib/demoData';
import type { NetworkStats } from '@aegis/types';

export function useNetworkStats() {
  const { enabled } = useDemoMode();

  return useQuery<NetworkStats>({
    queryKey: ['network-stats'],
    queryFn: fetchNetworkStats,
    refetchInterval: 15_000,
    enabled: !enabled,
    placeholderData: enabled ? demoNetworkStats : undefined,
  });
}
