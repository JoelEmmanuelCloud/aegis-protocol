import { useMutation } from '@tanstack/react-query';
import { fileDispute } from '../lib/orchestratorApi';
import { useDemoMode } from '../context/DemoContext';
import type { FileDisputeResponse } from '@aegis/types';

export function useDispute() {
  const { isDemoMode } = useDemoMode();
  return useMutation<
    FileDisputeResponse,
    Error,
    { rootHash: string; agentId: string; reason: string }
  >({
    mutationFn: isDemoMode
      ? () => Promise.resolve({ disputeId: 'demo_dispute_001', verdict: 'FLAGGED' as const })
      : fileDispute,
  });
}
