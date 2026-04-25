import { useQuery } from '@tanstack/react-query';
import { fetchAttestations } from '../lib/orchestratorApi';
import { useDemoMode } from './useDemoMode';
import { demoAttestations } from '../lib/demoData';
import type { AttestationListResponse } from '@aegis/types';

export function useAttestations(agentId: string | null, cursor?: string, limit?: number) {
  const { enabled } = useDemoMode();

  return useQuery<AttestationListResponse>({
    queryKey: ['attestations', agentId, cursor, limit],
    queryFn: () => fetchAttestations(agentId!, cursor, limit),
    enabled: !enabled && !!agentId,
    refetchInterval: 5_000,
    placeholderData: enabled ? demoAttestations : undefined,
  });
}
