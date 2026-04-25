import { useQuery } from '@tanstack/react-query';
import { fetchDisputeStatus } from '../lib/orchestratorApi';
import { useDemoMode } from './useDemoMode';
import { demoDisputes } from '../lib/demoData';
import type { DisputeRecord } from '@aegis/types';

export function useDisputeStatus(rootHash: string | null) {
  const { enabled } = useDemoMode();

  return useQuery<DisputeRecord>({
    queryKey: ['dispute', rootHash],
    queryFn: () => fetchDisputeStatus(rootHash!),
    enabled: !enabled && !!rootHash,
    refetchInterval: 5_000,
    placeholderData: enabled && rootHash ? demoDisputes[0] : undefined,
  });
}
