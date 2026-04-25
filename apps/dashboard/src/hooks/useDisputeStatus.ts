import { useQuery } from '@tanstack/react-query';
import { fetchDisputeStatus } from '../lib/orchestratorApi';
import type { DisputeRecord } from '@aegis/types';

export function useDisputeStatus(rootHash: string | null) {
  return useQuery<DisputeRecord>({
    queryKey: ['dispute', rootHash],
    queryFn: () => fetchDisputeStatus(rootHash!),
    enabled: !!rootHash,
    refetchInterval: 5_000,
  });
}
