import { useQuery } from '@tanstack/react-query';
import { fetchDisputeStatus } from '../lib/orchestratorApi';
import { useDemoMode } from '../context/DemoContext';
import { demoDisputeRecord } from '../lib/demoData';
import type { DisputeRecord } from '@aegis/types';

export function useDisputeStatus(rootHash: string | null | undefined) {
  const { isDemoMode } = useDemoMode();
  return useQuery<DisputeRecord>({
    queryKey: ['dispute', isDemoMode ? 'demo' : rootHash],
    queryFn: isDemoMode
      ? () => Promise.resolve(demoDisputeRecord)
      : () => fetchDisputeStatus(rootHash!),
    enabled: !!rootHash,
    refetchInterval: isDemoMode ? false : 5_000,
    staleTime: isDemoMode ? Infinity : 0,
  });
}
