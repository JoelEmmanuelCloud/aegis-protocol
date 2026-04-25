import { useMutation } from '@tanstack/react-query';
import { fileDispute } from '../lib/orchestratorApi';
import type { FileDisputeResponse } from '@aegis/types';

export function useDispute() {
  return useMutation<
    FileDisputeResponse,
    Error,
    { rootHash: string; agentId: string; reason: string }
  >({
    mutationFn: fileDispute,
  });
}
