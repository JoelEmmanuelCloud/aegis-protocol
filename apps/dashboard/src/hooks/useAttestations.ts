import { useQuery } from '@tanstack/react-query';
import { fetchAttestations } from '../lib/orchestratorApi';
import { useDemoMode } from '../context/DemoContext';
import { demoAttestations } from '../lib/demoData';
import type { AttestationListResponse } from '@aegis/types';

export function useAttestations(agentId?: string | null, cursor?: string, limit?: number) {
  const { isDemoMode } = useDemoMode();
  return useQuery<AttestationListResponse>({
    queryKey: ['attestations', isDemoMode, agentId ?? null, cursor, limit],
    queryFn: isDemoMode ? () => Promise.resolve(demoAttestations) : () => fetchAttestations(agentId ?? null, cursor, limit),
    refetchInterval: isDemoMode ? false : 5_000,
    staleTime: isDemoMode ? Infinity : 0,
  });
}
