import { useQuery } from '@tanstack/react-query';
import { fetchAttestations } from '../lib/orchestratorApi';
import type { AttestationListResponse } from '@aegis/types';

export function useAttestations(agentId?: string | null, cursor?: string, limit?: number) {
  return useQuery<AttestationListResponse>({
    queryKey: ['attestations', agentId ?? null, cursor, limit],
    queryFn: () => fetchAttestations(agentId ?? null, cursor, limit),
    refetchInterval: 5_000,
  });
}
